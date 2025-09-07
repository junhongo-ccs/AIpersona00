import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { insertLog } from "@/lib/db";
import { personas } from "@/lib/personas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { url, personaId } = await req.json();
  if (!/^https?:\/\//.test(url || "")) {
    return NextResponse.json({ error: "URLが不正です（http/https必須）" }, { status: 400 });
  }

  const persona = personas.find(p => p.id === personaId) ?? personas[0];

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  let browser;
  const started = Date.now();

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});

    const shotBuf = await page.screenshot({ fullPage: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outDir = path.join(process.cwd(), "out");
    const shotPath = path.join(outDir, `screenshot-${stamp}.png`);
    fs.writeFileSync(shotPath, shotBuf);

    // route.ts 内の visibleText 生成を差し替え
    const uiSummary = await page.evaluate(() => {
      const isVisible = (el: Element) => {
        const s = getComputedStyle(el as HTMLElement);
        const r = (el as HTMLElement).getBoundingClientRect();
        return s.visibility !== "hidden" && s.display !== "none" && r.width * r.height > 0;
      };

      // ヘルパー：ラベル推定
      const labelOf = (el: Element) => {
        const id = (el as HTMLElement).id;
        const viaAria = (el.getAttribute("aria-label") || "").trim();
        if (viaAria) return viaAria;
        // for属性ラベル
        if (id) {
          const lab = document.querySelector(`label[for="${id}"]`);
          if (lab && isVisible(lab)) return (lab as HTMLElement).innerText.trim();
        }
        // 近傍ラベル
        const lab = el.closest("label");
        if (lab && isVisible(lab)) return (lab as HTMLElement).innerText.trim();
        // プレースホルダ
        const ph = (el as HTMLInputElement).placeholder;
        if (ph) return ph;
        return "";
      };

      const pick: string[] = [];

      // 見出し
      document.querySelectorAll("h1,h2,h3").forEach(el => {
        if (!isVisible(el)) return;
        const t = (el as HTMLElement).innerText.trim().replace(/\s+/g, " ");
        if (t) pick.push(`[heading] ${el.tagName.toLowerCase()}: ${t}`);
      });

      // クリック系
      document.querySelectorAll('button,[role="button"],a[href]').forEach(el => {
        if (!isVisible(el)) return;
        const t = ((el as HTMLElement).innerText || el.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ");
        const disabled = (el as HTMLButtonElement).disabled || el.getAttribute("aria-disabled")==="true";
        if (t) pick.push(`[action${disabled ? " disabled":""}] ${el.tagName.toLowerCase()}: ${t}`);
      });

      // 入力欄
      document.querySelectorAll('input,textarea,select').forEach(el => {
        if (!isVisible(el)) return;
        const type = (el as HTMLInputElement).type || el.tagName.toLowerCase();
        const name = labelOf(el);
        const req = el.hasAttribute("required") || el.getAttribute("aria-required")==="true";
        const inv = el.getAttribute("aria-invalid")==="true";
        // エラー文（近傍）
        let err = "";
        const describedby = el.getAttribute("aria-describedby");
        if (describedby) {
          const box = document.getElementById(describedby);
          if (box && isVisible(box)) err = (box as HTMLElement).innerText.trim().replace(/\s+/g, " ");
        } else {
          const nearErr = el.parentElement?.querySelector('.error, [role="alert"]');
          if (nearErr && isVisible(nearErr)) err = (nearErr as HTMLElement).innerText.trim().replace(/\s+/g, " ");
        }
        pick.push(`[field${req ? " required":""}${inv ? " invalid":""}] ${type}: ${name || "(no label)"}${err ? ` | error: ${err}`:""}`);
      });

      // フォーカス中
      const af = document.activeElement;
      if (af && isVisible(af)) {
        const tag = af.tagName.toLowerCase();
        const name = (af as HTMLElement).innerText?.trim() || (af as HTMLElement).getAttribute("aria-label") || (af as HTMLInputElement).placeholder || "";
        pick.unshift(`[focus] ${tag}: ${name || "(no label)"}`);
      }

      // ページ位置の手がかり（概略）
      const scrollY = Math.round(window.scrollY);
      const atTop = scrollY < 50 ? "top" : "scrolled";
      pick.unshift(`[viewport] ${window.innerWidth}x${window.innerHeight}, ${atTop}`);

      return pick.slice(0, 200);
    });

    const meta = await page.evaluate(() => ({
      url: location.href,
      title: document.title,
      viewport: { w: window.innerWidth, h: window.innerHeight },
      scrollY: Math.round(window.scrollY)
    }));

    const base64 = shotBuf.toString("base64");
    const prompt = `
あなたは次のペルソナになりきって、画面を見ながら「発話法」で短い独り言を述べます。
- 1～3文で、具体的なUI語彙（ボタン名やラベル）を引用
- 迷いがあれば正直に述べる
- 最後に次の行動を1行で提案
- 0〜3でUX摩擦スコアも返す（0=問題なし, 3=かなり困る）

[Persona]
name: ${persona.name}
traits: ${persona.traits.join(", ")}
goal: ${persona.goal}

[Page Meta]
title: ${meta.title}
url: ${meta.url}
viewport: ${meta.viewport.w}x${meta.viewport.h}, scrollY=${meta.scrollY}

[Visible UI Excerpts]
${visibleText.join("\n")}

出力フォーマット例:
発話: ...
次アクション: ...
摩擦: 0|1|2|3
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: `data:image/png;base64,${base64}` }
          ]
        }
      ]
    });

    const raw = (completion.choices?.[0]?.message?.content || "").trim();
    const utterance = (raw.match(/発話[:：]\s*(.+)/)?.[1] || raw).slice(0, 800);
    const nextAction = (raw.match(/次アクション[:：]\s*(.+)/)?.[1] || "").slice(0, 200);
    const friction = parseInt(raw.match(/摩擦[:：]\s*(\d)/)?.[1] || "1", 10);
    const score = Number.isFinite(friction) ? friction : 1;

    insertLog({
      persona: persona.id,
      url: meta.url,
      utterance,
      next_action: nextAction,
      friction_score: score
    });

    return NextResponse.json({
      status: "done",
      took_ms: Date.now() - started,
      meta,
      artifactPaths: { screenshot: `/out/${path.basename(shotPath)}` },
      ui: { visibleText },
      llm: { utterance, next_action: nextAction, friction_score: score, raw }
    });
  } catch (err: any) {
    console.error("[/api/run] error:", err);
    return NextResponse.json({ status: "error", error: String(err?.message || err) }, { status: 500 });
  } finally {
    try { await browser?.close(); } catch {}
  }



  
}

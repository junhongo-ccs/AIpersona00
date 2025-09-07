// ==== RUN API (Cheerioベース最小版) ====
// Playwrightを使わず、HTMLを fetch + cheerio で要約して LLM に投げます。

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import * as cheerio from "cheerio";
import { insertLog } from "@/lib/db";
import { personas } from "@/lib/personas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url: string = body?.url || "";
    const personaId: string | undefined = body?.personaId;

    if (!/^https?:\/\//.test(url)) {
      return NextResponse.json({ error: "URLが不正です（http/https必須）" }, { status: 400 });
    }

    const persona = personas.find((p) => p.id === personaId) ?? personas[0];

    // 1) HTML取得 → 簡易要約
    const resp = await fetch(url, { redirect: "follow" });
    const html = await resp.text();
    const $ = cheerio.load(html);

    const title = ($("title").first().text() || "").trim();
    const headings = ["h1", "h2", "h3"]
      .flatMap((sel) => $(sel).map((_, el) => $(el).text().trim()).get())
      .filter(Boolean)
      .slice(0, 14);

    const actions = $("button,a[role='button'],a[href]")
      .map((_, el) => ($(el).text().trim() || $(el).attr("aria-label") || "").trim())
      .get()
      .filter(Boolean)
      .slice(0, 20);

    const fields = $("input,textarea,select")
      .map((_, el) =>
        ($(el).attr("placeholder") ||
          $(el).attr("aria-label") ||
          $(el).attr("name") ||
          "")
          .trim()
      )
      .get()
      .filter(Boolean)
      .slice(0, 20);

    const uiSummary: string[] = [
      ...(title ? [`[title] ${title}`] : []),
      ...headings.map((t) => `[heading] ${t}`),
      ...actions.map((t) => `[action] ${t}`),
      ...fields.map((t) => `[field] ${t}`),
    ].slice(0, 120);

    const meta = { url, title, viewport: { w: 0, h: 0 }, scrollY: 0 };

    // 2) プロンプト
    const prompt = `
あなたは次のペルソナになりきり、画面の要約を見て「発話法」で短く独り言を述べます。
- 1〜3文、要約中の語句を引用
- 最後に「次アクション」1行と「摩擦(0-3)」を返す

[Persona]
name: ${persona.name}
traits: ${Array.isArray(persona.traits) ? persona.traits.join(", ") : ""}
goal: ${persona.goal}

[UI summary]
${uiSummary.join("\n")}

出力形式（先頭語を厳守）:
発話: <短文1-3>
次アクション: <1行>
摩擦: <0|1|2|3>
`.trim();

    // 3) OpenAI（未設定ならダミーで返す）
    let utterance = "";
    let nextAction = "";
    let friction = 1;
    let raw = "";

    if (process.env.OPENAI_API_KEY) {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }], // ← contentは文字列固定
      });
      raw = (completion.choices?.[0]?.message?.content || "").trim();
      utterance = (raw.match(/発話[:：]\s*(.+)/)?.[1] || raw).slice(0, 800);
      nextAction = (raw.match(/次アクション[:：]\s*(.+)/)?.[1] || "").slice(0, 200);
      const n = parseInt(raw.match(/摩擦[:：]\s*(\d)/)?.[1] || "1", 10);
      friction = Number.isFinite(n) ? n : 1;
    } else {
      utterance = "（ダミー）見出しとボタンは把握できるが、入力の説明は少し不足。";
      nextAction = "必要項目を入力して ‘送信’ を押す";
      friction = 1;
      raw = "";
    }

    // 4) ログ保存（JSON版のinsertLogを想定）
    insertLog({ persona: persona.id, url, utterance, next_action: nextAction, friction_score: friction });

    // 5) レスポンス（スクショは無し）
    return NextResponse.json({
      status: "done",
      meta,
      artifactPaths: { screenshot: "" },
      screenshotDataUrl: "",               // 画像がない前提で空
      ui: { visibleText: uiSummary },
      llm: { utterance, next_action: nextAction, friction_score: friction, raw }
    });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

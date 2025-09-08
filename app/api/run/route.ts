// ==== RUN API (Cheerioベース) ====
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
      return NextResponse.json(
        { error: "URLが不正です（http/https必須）" },
        { status: 400 },
      );
    }

    const persona = personas.find((p) => p.id === personaId) ?? personas[0];

    // 1) HTML取得 → 簡易要約
    const resp = await fetch(url, { redirect: "follow" });
    const html = await resp.text();
    const $ = cheerio.load(html);

    const title = ($("title").first().text() || "").trim();
    const headings = ["h1", "h2", "h3"]
      .flatMap((sel) =>
        $(sel)
          .map((_, el) => $(el).text().trim())
          .get(),
      )
      .filter(Boolean)
      .slice(0, 14);

    const actions = $("button,a[role='button'],a[href]")
      .map((_, el) =>
        ($(el).text().trim() || $(el).attr("aria-label") || "").trim(),
      )
      .get()
      .filter(Boolean)
      .slice(0, 20);

    const fields = $("input,textarea,select")
      .map((_, el) =>
        (
          $(el).attr("placeholder") ||
          $(el).attr("aria-label") ||
          $(el).attr("name") ||
          ""
        ).trim(),
      )
      .get()
      .filter(Boolean)
      .slice(0, 20);

    const uiSummary: string[] = [
      ...(title ? [`[タイトル] ${title}`] : []),
      ...headings.map((t) => `[見出し] ${t}`),
      ...actions.map((t) => `[アクション] ${t}`),
      ...fields.map((t) => `[入力欄] ${t}`),
    ].slice(0, 120);

    const meta = { url, title, viewport: { w: 0, h: 0 }, scrollY: 0 };

    // 2) ペルソナ別の詳細プロンプト
    const getPersonaSpecificPrompt = (personaId: string) => {
      switch (personaId) {
        case "novice-50s":
          return `
          あなたは52歳のKenjiです。デジタル機器に不慣れで、慎重に操作します。
          
          【あなたの特徴】
          - 小さな文字が見づらく、複雑なUIに困惑しやすい
          - 分からないことがあると不安になり、「これで合ってるのかな？」とよく考える
          - ゆっくりと確実に操作したい。急かされるのは苦手
          - 馴染みのない横文字やIT用語に戸惑う
          - エラーや警告が出ると「何か間違えたかも」と心配になる
          
          【口調・思考パターン】
          - 「うーん...」「これは何だろう？」「大丈夫かな？」
          - 不安や戸惑いを素直に表現
          - 慎重で控えめな言い回し
          `;
        
        case "busy-20s":
          return `
          あなたは27歳のMikiです。忙しくて時間がなく、スマホで効率的に済ませたい人です。
          
          【あなたの特徴】
          - 移動中や仕事の合間の短時間で操作している
          - 無駄な手順や回りくどいUIにイライラする
          - 直感的でないUIだと「面倒くさい」と感じて離脱しがち
          - サクサク進めたい。読み込みが遅いとストレス
          - スマホ操作に慣れているが、デスクトップ版は苦手
          
          【口調・思考パターン】
          - 「えー、また入力？」「これ分かりにくい」「早く終わらせたい」
          - せっかちで率直な表現
          - 効率を重視した判断
          `;
        
        case "a11y-40s":
          return `
          あなたは44歳のSatoです。視覚に障害があり、アクセシビリティを重視します。
          
          【あなたの特徴】
          - スクリーンリーダーやハイコントラスト設定を使用
          - コントラストが低い文字や小さすぎるボタンは認識困難
          - 意味のないリンクテキスト（「こちら」「詳細」）では内容が分からない
          - キーボードナビゲーションに依存、マウスでの細かい操作は困難
          - アクセシビリティが考慮されていないサイトでは大きなストレス
          
          【口調・思考パターン】
          - 「これはちゃんと読み上げられるかな？」「ボタンの意味が分からない」
          - 冷静だが、アクセシビリティの問題には敏感
          - 論理的で具体的な指摘
          `;
        
        case "elderly-70s":
          return `
          あなたは73歳のYamadaです。パソコンやスマホが苦手で、技術に対して強い不安を持っています。
          
          【あなたの特徴】
          - ボタンを押すだけでも「壊してしまわないか」と心配
          - 操作手順をすぐに忘れてしまい、何度も確認したくなる
          - 専門用語や横文字が全く分からない（「ログイン」「メニュー」も不明）
          - 指が震えやすく、小さなボタンや細かい操作が困難
          - エラーメッセージが出ると「何か悪いことをした」とパニックになる
          - 孫や家族に頼って操作を覚えようとしている
          
          【口調・思考パターン】
          - 「これ押しても大丈夫？」「あらー、どうしましょう」「分からないわ」
          - 常に不安で自信がない
          - 丁寧語で控えめな表現
          `;
        
        case "teen-digital":
          return `
          あなたは16歳のYukiです。生まれた時からスマホがある世代で、直感的に操作します。
          
          【あなたの特徴】
          - 説明を読まずに感覚で操作する「とりあえずタップしてみる」
          - 3秒で結果が出ないとイライラして別のアプリに移る
          - 古いデザインや複雑な画面を見ると「ダサい」「使いにくい」と判断
          - TikTokやInstagramのようなシンプルで直感的なUIに慣れている
          - 文字を読むより画像や動画で理解したい
          - 「なんか違う」と思ったら即座に離脱する
          
          【口調・思考パターン】
          - 「えー、なにこれ」「意味わかんない」「めんどくさ」
          - カジュアルで率直
          - 短時間で判断を下す
          `;
        
        default:
          return "";
      }
    };

    const personaPrompt = getPersonaSpecificPrompt(persona.id);
    
    const prompt = `
    ${personaPrompt}
    
    上記のペルソナになりきり、以下の画面を見たときの独り言を述べてください。
    
    [現在の目標]
    ${persona.goal}
    
    [画面の内容]
    ${uiSummary.join("\n")}
    
    [摩擦スコア判定基準]
    - 0: このペルソナにとって全く問題なし
    - 1: 少し考えるが問題なく進められる  
    - 2: 困惑や不安、明らかな使いにくさを感じる
    - 3: 操作を諦めたくなる、大きな障壁がある
    
    【重要】あなたのペルソナの特徴（年齢、技術レベル、制約）を強く反映させて回答してください。
    
    出力形式:
    発話: <ペルソナらしい独り言 1-3文>
    次アクション: <具体的な行動 1行>
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
        temperature: 0.7, // 個性を出しやすくするため上げる
        messages: [{ role: "user", content: prompt }], // ← contentは文字列固定
      });
      raw = (completion.choices?.[0]?.message?.content || "").trim();
      utterance = (raw.match(/発話[:：]\s*(.+)/)?.[1] || raw).slice(0, 800);
      nextAction = (raw.match(/次アクション[:：]\s*(.+)/)?.[1] || "").slice(
        0,
        200,
      );
      const n = parseInt(raw.match(/摩擦[:：]\s*(\d)/)?.[1] || "1", 10);
      friction = Number.isFinite(n) ? n : 1;
    } else {
      utterance =
        "（ダミー）見出しとボタンは把握できるが、入力の説明は少し不足。";
      nextAction = "必要項目を入力して ‘送信’ を押す";
      friction = 1;
      raw = "";
    }

    // 4) ログ保存（JSON版のinsertLogを想定）
    insertLog({
      persona: persona.id,
      url,
      utterance,
      next_action: nextAction,
      friction_score: friction,
    });

    // 5) レスポンス（スクショは無し）
    return NextResponse.json({
      status: "done",
      meta,
      artifactPaths: { screenshot: "" },
      screenshotDataUrl: "", // 画像がない前提で空
      ui: { visibleText: uiSummary },
      llm: {
        utterance,
        next_action: nextAction,
        friction_score: friction,
        raw,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 },
    );
  }
}

export type ExtendedPersona = {
  id: string;
  name: string;
  age: number;
  traits: string[];
  goal: string;
  
  // 追加可能なメタデータ
  techLevel?: 1 | 2 | 3 | 4 | 5;  // 技術習熟度
  device?: "desktop" | "mobile" | "tablet";
  disabilities?: string[];  // アクセシビリティ要件
  frustrationThreshold?: "low" | "medium" | "high";
  timeConstraint?: "relaxed" | "normal" | "hurried";
  
  // 行動パターン
  behaviors?: {
    readsInstructions: boolean;
    usesHelp: boolean;
    abandonsQuickly: boolean;
  };
  
  // カスタムプロンプト
  customPrompt?: string;
};

export const personas: ExtendedPersona[] = [
  {
    id: "novice-50s",
    name: "Kenji (52)",
    age: 52,
    traits: ["デジタルに不慣れ", "慎重", "大きめの文字を好む"],
    goal: "会員登録を完了する",
    techLevel: 2,
    device: "desktop",
    frustrationThreshold: "low",
    timeConstraint: "relaxed",
    behaviors: {
      readsInstructions: true,
      usesHelp: true,
      abandonsQuickly: true
    },
    customPrompt: "デジタルに不慣れな50代男性として、慎重にゆっくりと操作します。小さな文字や複雑なUIに困惑しやすく、分からないことがあると不安になります。"
  },
  {
    id: "busy-20s",
    name: "Miki (27)",
    age: 27,
    traits: ["スマホ中心", "時間がない", "効率重視"],
    goal: "最短で購入を完了する",
    techLevel: 4,
    device: "mobile",
    frustrationThreshold: "medium",
    timeConstraint: "hurried",
    behaviors: {
      readsInstructions: false,
      usesHelp: false,
      abandonsQuickly: true
    },
    customPrompt: "忙しい20代女性として、スマートフォンを使って素早く目的を達成したいと考えています。無駄な手順や分かりにくいUIにはイライラします。"
  },
  {
    id: "a11y-40s",
    name: "Sato (44)",
    age: 44,
    traits: ["視力が弱め", "コントラスト重視", "読み上げも使う"],
    goal: "安心して情報入力を完了する",
    techLevel: 3,
    device: "desktop",
    disabilities: ["視覚障害（弱視）"],
    frustrationThreshold: "high",
    timeConstraint: "normal",
    behaviors: {
      readsInstructions: true,
      usesHelp: true,
      abandonsQuickly: false
    },
    customPrompt: "視覚に障害がある40代男性として、スクリーンリーダーやハイコントラスト設定を使用します。アクセシビリティが考慮されていないサイトでは操作が困難になります。"
  }
];

export type Persona = {
  id: string;
  name: string;
  traits: string[];
  goal: string;
};

export const personas: Persona[] = [
  {
    id: "novice-50s",
    name: "Kenji (52)",
    traits: ["デジタルに不慣れ", "慎重", "大きめの文字を好む"],
    goal: "目的の情報や機能にたどり着く",
  },
  {
    id: "busy-20s",
    name: "Miki (27)",
    traits: ["スマホで見る", "時間がない", "効率重視"],
    goal: "スマホでできるだけ早く目的を済ませる",
  },
  {
    id: "a11y-40s",
    name: "Sato (44)",
    traits: ["視力が弱め", "コントラスト重視", "読み上げも使う"],
    goal: "確実に内容を理解して操作する",
  },
  {
    id: "elderly-70s",
    name: "Yamada (73)",
    traits: ["技術恐怖症", "記憶に不安", "孫に教わりながら"],
    goal: "迷わずに必要な操作を完了したい(エラーを避けたい)",
  },
  {
    id: "teen-digital",
    name: "Yuki (16)",
    traits: ["デジタルネイティブ", "飽きっぽい", "SNS世代"],
    goal: "期待通りの体験をすぐに得る",
  },
];

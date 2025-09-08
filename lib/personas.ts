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
    goal: "目的の情報や機能にたどり着く"
  },
  {
    id: "busy-20s",
    name: "Miki (27)",
    traits: ["スマホ中心", "時間がない", "効率重視"],
    goal: "できるだけ早く用事を済ませる"
  },
  {
    id: "a11y-40s",
    name: "Sato (44)",
    traits: ["視力が弱め", "コントラスト重視", "読み上げも使う"],
    goal: "確実に内容を理解して操作する"
  }
];

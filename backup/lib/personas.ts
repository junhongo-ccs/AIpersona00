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
    goal: "会員登録を完了する"
  },
  {
    id: "busy-20s",
    name: "Miki (27)",
    traits: ["スマホ中心", "時間がない", "効率重視"],
    goal: "最短で購入を完了する"
  },
  {
    id: "a11y-40s",
    name: "Sato (44)",
    traits: ["視力が弱め", "コントラスト重視", "読み上げも使う"],
    goal: "安心して情報入力を完了する"
  }
];

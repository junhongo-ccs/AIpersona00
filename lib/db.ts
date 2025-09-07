import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const OUT_DIR = path.join(process.cwd(), "out");
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const db = new Database(path.join(OUT_DIR, "chatlogs.db"));

db.prepare(`
CREATE TABLE IF NOT EXISTS chat_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT,
  persona TEXT,
  url TEXT,
  utterance TEXT,
  next_action TEXT,
  friction_score INTEGER
)`).run();

export type ChatRow = {
  id: number;
  timestamp: string;
  persona: string;
  url: string;
  utterance: string;
  next_action: string;
  friction_score: number;
};

export function insertLog(p: {
  persona: string;
  url: string;
  utterance: string;
  next_action: string;
  friction_score: number;
}) {
  const stmt = db.prepare(`
    INSERT INTO chat_logs (timestamp, persona, url, utterance, next_action, friction_score)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(new Date().toISOString(), p.persona, p.url, p.utterance, p.next_action, p.friction_score);
}

export function getLogs(limit = 20): ChatRow[] {
  const stmt = db.prepare(`SELECT * FROM chat_logs ORDER BY id DESC LIMIT ?`);
  return stmt.all(limit) as ChatRow[];
}

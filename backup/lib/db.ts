// 依存不要の簡易DB（JSON）版。Replitでも安定して動きます。
import fs from "fs";
import path from "path";

const OUT = path.join(process.cwd(), "out");
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
const FILE = path.join(OUT, "chatlogs.json");

type Row = {
  id: number; timestamp: string; persona: string; url: string;
  utterance: string; next_action: string; friction_score: number;
};

function readAll(): Row[] { try { return JSON.parse(fs.readFileSync(FILE,"utf-8")); } catch { return []; } }
function writeAll(rows: Row[]) { fs.writeFileSync(FILE, JSON.stringify(rows, null, 2)); }

export function insertLog(p:{persona:string;url:string;utterance:string;next_action:string;friction_score:number;}) {
  const rows = readAll();
  const id = (rows[0]?.id || 0) + 1;
  rows.unshift({ id, timestamp: new Date().toISOString(), ...p });
  writeAll(rows);
}
export function getLogs(limit=20){ return readAll().slice(0, limit); }

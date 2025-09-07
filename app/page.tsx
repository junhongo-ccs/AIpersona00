"use client";

import { useEffect, useMemo, useState } from "react";
import { personas } from "@/lib/personas";

type RunResp = {
  status: string;
  took_ms?: number;
  artifactPaths?: { screenshot?: string };
  ui?: { visibleText: string[] };
  llm?: { utterance: string; next_action: string; friction_score: number; raw: string };
  meta?: { url: string; title: string; viewport: { w: number; h: number }; scrollY: number };
  error?: string;
};

type LogRow = {
  id: number;
  timestamp: string;
  persona: string;
  url: string;
  utterance: string;
  next_action: string;
  friction_score: number;
};

export default function Page() {
  const [url, setUrl] = useState("https://example.com");
  const [personaId, setPersonaId] = useState(personas[0].id);
  const [status, setStatus] = useState<"Idle"|"Running"|"Done"|"Error">("Idle");
  const [err, setErr] = useState<string>("");
  const [data, setData] = useState<RunResp | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);

  const badgeClass = useMemo(() => {
    return {
      Idle: "badge badge-idle",
      Running: "badge badge-run",
      Done: "badge badge-done",
      Error: "badge badge-err"
    }[status];
  }, [status]);

  async function loadLogs() {
    const res = await fetch(`/api/logs?limit=20`, { cache: "no-store" });
    const rows: LogRow[] = await res.json();
    setLogs(rows);
  }

  async function run() {
    setErr("");
    setStatus("Running");
    setData(null);
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, personaId })
      });
      const j: RunResp = await res.json();
      if (!res.ok) throw new Error(j.error || "failed");
      setData(j);
      setStatus("Done");
      await loadLogs();
    } catch (e: any) {
      setErr(String(e?.message || e));
      setStatus("Error");
    }
  }

  useEffect(() => { loadLogs(); }, []);

  return (
    <div className="container space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">AI Persona × Playwright PoC</h1>
        <span className={badgeClass}>{status}</span>
      </div>

      {/* Controls */}
      <div className="card p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="block mb-1 font-medium">Target URL</label>
            <input className="input" type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <label className="block mb-1 font-medium">Persona</label>
            <select className="select" value={personaId} onChange={e => setPersonaId(e.target.value)}>
              {personas.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.traits.join(" / ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button className="btn btn-primary" onClick={run}>Run</button>
          {err && <div className="text-rose-700">{err}</div>}
        </div>
      </div>

      {/* Results */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-lg font-semibold mb-3">結果</h2>
          <div className="grid grid-cols-4 gap-2">
            <div className="col-span-1 text-gray-500">発話</div>
            <div className="col-span-3">
              <pre className="scroll">{data?.llm?.utterance || "-"}</pre>
            </div>

            <div className="col-span-1 text-gray-500">次アクション</div>
            <div className="col-span-3"><pre>{data?.llm?.next_action || "-"}</pre></div>

            <div className="col-span-1 text-gray-500">摩擦スコア</div>
            <div className="col-span-3"><pre>{data?.llm?.friction_score ?? "-"}</pre></div>
          </div>

          <div className="mt-4">
            <h3 className="font-medium mb-2">可視UIテキスト（抜粋）</h3>
            <pre className="scroll">{(data?.ui?.visibleText || []).join("\n") || "-"}</pre>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-lg font-semibold mb-3">スクリーンショット</h2>
          {data?.artifactPaths?.screenshot ? (
            // out/ は Next では自動配信されないため public/out にコピーしたいが、
            // 今回は /api/run 内で path を返しているので next.config なしでOK
            <img className="shot" src={data.artifactPaths.screenshot} alt="screenshot" />
          ) : <div className="text-gray-500">-</div>}
        </div>
      </div>

      {/* Logs */}
      <div className="card p-5">
        <h2 className="text-lg font-semibold mb-3">過去ログ（最新20件）</h2>
        <div className="overflow-auto">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th><th>時刻</th><th>Persona</th><th>URL</th><th>発話</th><th>摩擦</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(r => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{new Date(r.timestamp).toLocaleString()}</td>
                  <td>{r.persona}</td>
                  <td className="max-w-[320px] truncate" title={r.url}>{r.url}</td>
                  <td className="max-w-[420px] truncate" title={r.utterance}>{r.utterance}</td>
                  <td>{r.friction_score}</td>
                </tr>
              ))}
              {!logs.length && (
                <tr><td colSpan={6} className="text-gray-500">No logs yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

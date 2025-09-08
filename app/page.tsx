"use client";

import { useEffect, useMemo, useState } from "react";
import { personas } from "@/lib/personas";

type RunResp = {
  status: string;
  took_ms?: number;
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
        <h1 className="text-xl font-semibold">AI Persona × Cheerio PoC</h1>
        <span className={badgeClass}>{status}</span>
      </div>

      {/* Controls */}
      <div className="card p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="block mb-1 font-medium">Target URL</label>
            <input
              className="input"
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Persona</label>
            <select
              className="select"
              value={personaId}
              onChange={e => setPersonaId(e.target.value)}
            >
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
      <div className="card p-5">
        <h2 className="text-lg font-semibold mb-3">
          {personas.find(p => p.id === personaId)?.name} が {url} にアクセスした結果
        </h2>
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h2 className="text-gray-500 font-semibold mb-1">発話</h2>
            <pre className="bg-gray-50 p-2 rounded">{data?.llm?.utterance || "-"}</pre>
          </div>

          <div>
            <h2 className="text-gray-500 font-semibold mb-1">次アクション</h2>
            <pre className="bg-gray-50 p-2 rounded">{data?.llm?.next_action || "-"}</pre>
          </div>

          <div>
            <h2 className="text-gray-500 font-semibold mb-1">摩擦スコア</h2>
            <pre className="bg-gray-50 p-2 rounded">{data?.llm?.friction_score ?? "-"}</pre>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="font-medium mb-2">可視UIテキスト（抜粋）</h3>
          <pre className="scroll">{(data?.ui?.visibleText || []).join("\n") || "-"}</pre>
        </div>
      </div>

      {/* Logs */}
      <div className="card p-5 max-w-6xl mx-auto">
        <h2 className="text-lg font-semibold mb-3">過去ログ（最新20件）</h2>
        <div className="overflow-x-auto">
          <table className="table w-full text-sm">
            <thead>
              <tr>
                <th>ID</th>
                <th>時刻</th>
                <th>Persona</th>
                <th>アクセス先URL</th>
                <th>発話</th>
                <th>摩擦</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(r => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{new Date(r.timestamp).toLocaleString()}</td>
                  <td className="font-semibold text-indigo-600">{r.persona}</td>
                  <td className="whitespace-nowrap text-blue-600 underline" title={r.url}>
                    <a href={r.url} target="_blank" rel="noopener noreferrer">{r.url}</a>
                  </td>
                  <td className="whitespace-nowrap" title={r.utterance}>{r.utterance}</td>
                  <td>{r.friction_score}</td>
                </tr>
              ))}
              {!logs.length && (
                <tr>
                  <td colSpan={6} className="text-gray-500">No logs yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
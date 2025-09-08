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
    <div style={{maxWidth: '1120px', width: '100%', margin: '0 auto', padding: '20px', background: '#f6f7fb', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', boxSizing: 'border-box'}}>
      {/* Header */}
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', width: '100%', boxSizing: 'border-box'}}>
        <h1 style={{fontSize: '1.25rem', fontWeight: '600'}}>AI Persona × Cheerio PoC</h1>
        <span style={{
          display: 'inline-flex', alignItems: 'center', borderRadius: '9999px', 
          padding: '0.25rem 0.625rem', fontSize: '0.75rem', fontWeight: '500',
          backgroundColor: status === 'Idle' ? '#e5e7eb' : status === 'Running' ? '#fef3c7' : status === 'Done' ? '#d1fae5' : '#ffe4e6',
          color: status === 'Idle' ? '#374151' : status === 'Running' ? '#92400e' : status === 'Done' ? '#065f46' : '#9f1239'
        }}>{status}</span>
      </div>

      {/* Controls */}
      <div style={{background: 'white', border: '1px solid #e5e7eb', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', width: '100%', maxWidth: '100%', boxSizing: 'border-box'}}>
        <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', boxSizing: 'border-box'}}>
          <div style={{width: '100%', boxSizing: 'border-box'}}>
            <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '1rem'}}>Target URL</label>
            <input
              style={{
                width: '100%', 
                maxWidth: '100%', 
                borderRadius: '0.75rem', 
                border: '1px solid #d1d5db', 
                padding: '0.75rem 1rem', 
                background: 'white', 
                fontSize: '1rem', 
                boxSizing: 'border-box',
                height: '3rem',
                appearance: 'none',
                outline: 'none'
              }}
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div style={{width: '100%', boxSizing: 'border-box'}}>
            <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '1rem'}}>Persona</label>
            <select
              style={{
                width: '100%', 
                maxWidth: '100%', 
                borderRadius: '0.75rem', 
                border: '1px solid #d1d5db', 
                padding: '0.75rem 1rem', 
                background: 'white', 
                fontSize: '1rem', 
                boxSizing: 'border-box',
                height: '3rem',
                appearance: 'none',
                outline: 'none'
              }}
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

        <div style={{marginTop: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center'}}>
          <button style={{display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.75rem', padding: '0.75rem 1.5rem', fontWeight: '500', background: '#111213', color: 'white', border: 'none', cursor: 'pointer', fontSize: '1rem'}} onClick={run}>生成する</button>
          {err && <div style={{color: '#be123c', fontSize: '0.95rem'}}>{err}</div>}
        </div>
      </div>

      {/* Results */}
      <div style={{background: 'white', border: '1px solid #e5e7eb', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', width: '100%', maxWidth: '100%', boxSizing: 'border-box'}}>
        <h2 style={{fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', textAlign: 'center'}}>
          {personas.find(p => p.id === personaId)?.name} が {url} にアクセスした結果
        </h2>
        <div style={{width: '100%', maxWidth: '100%', boxSizing: 'border-box'}}>
          <div style={{marginBottom: '2rem', width: '100%', boxSizing: 'border-box'}}>
            <h2 style={{color: '#374151', fontWeight: '600', marginBottom: '0.75rem', fontSize: '1.1rem'}}>発話</h2>
            <pre style={{background: '#f9fafb', padding: '1.5rem', borderRadius: '0.75rem', fontSize: '1rem', lineHeight: '1.6', whiteSpace: 'pre-wrap', border: '1px solid #e5e7eb', width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden', wordWrap: 'break-word'}}>{data?.llm?.utterance || "-"}</pre>
          </div>

          <div style={{marginBottom: '2rem', width: '100%', boxSizing: 'border-box'}}>
            <h2 style={{color: '#374151', fontWeight: '600', marginBottom: '0.75rem', fontSize: '1.1rem'}}>次アクション</h2>
            <pre style={{background: '#f9fafb', padding: '1.5rem', borderRadius: '0.75rem', fontSize: '1rem', lineHeight: '1.6', whiteSpace: 'pre-wrap', border: '1px solid #e5e7eb', width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden', wordWrap: 'break-word'}}>{data?.llm?.next_action || "-"}</pre>
          </div>

          <div style={{marginBottom: '2rem', width: '100%', boxSizing: 'border-box'}}>
            <h2 style={{color: '#374151', fontWeight: '600', marginBottom: '0.75rem', fontSize: '1.1rem'}}>摩擦スコア</h2>
            <pre style={{background: '#f9fafb', padding: '1.5rem', borderRadius: '0.75rem', fontSize: '1rem', lineHeight: '1.6', whiteSpace: 'pre-wrap', border: '1px solid #e5e7eb', width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden', wordWrap: 'break-word'}}>{data?.llm?.friction_score ?? "-"}</pre>
          </div>
        </div>

        <div style={{marginTop: '1.5rem', width: '100%', boxSizing: 'border-box'}}>
          <h3 style={{fontWeight: '600', marginBottom: '0.75rem', fontSize: '1.1rem', color: '#374151'}}>可視UIテキスト（抜粋）</h3>
          <pre style={{maxHeight: '20rem', overflow: 'auto', background: '#f9fafb', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e5e7eb', fontSize: '0.95rem', lineHeight: '1.5', width: '100%', maxWidth: '100%', boxSizing: 'border-box', wordWrap: 'break-word'}}>{(data?.ui?.visibleText || []).join("\n") || "-"}</pre>
        </div>
      </div>

      {/* Logs */}
      <div style={{background: 'white', border: '1px solid #e5e7eb', borderRadius: '1rem', padding: '2rem', margin: '0 auto', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', width: '100%', maxWidth: '100%', boxSizing: 'border-box'}}>
        <h2 style={{fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem'}}>過去ログ（最新20件）</h2>
        <div style={{overflowX: 'auto', width: '100%', maxWidth: '100%', boxSizing: 'border-box'}}>
          <table style={{width: '100%', minWidth: '600px', fontSize: '0.875rem', borderCollapse: 'collapse', boxSizing: 'border-box'}}>
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
                  <td style={{borderBottom: '1px solid #e5e7eb', padding: '0.5rem 0.75rem 0.5rem 0', textAlign: 'left', verticalAlign: 'top'}}>{r.id}</td>
                  <td style={{borderBottom: '1px solid #e5e7eb', padding: '0.5rem 0.75rem 0.5rem 0', textAlign: 'left', verticalAlign: 'top'}}>{new Date(r.timestamp).toLocaleString()}</td>
                  <td style={{borderBottom: '1px solid #e5e7eb', padding: '0.5rem 0.75rem 0.5rem 0', textAlign: 'left', verticalAlign: 'top', fontWeight: '600', color: '#4f46e5'}}>{r.persona}</td>
                  <td style={{borderBottom: '1px solid #e5e7eb', padding: '0.5rem 0.75rem 0.5rem 0', textAlign: 'left', verticalAlign: 'top', whiteSpace: 'nowrap', color: '#2563eb', textDecoration: 'underline'}} title={r.url}>
                    <a href={r.url} target="_blank" rel="noopener noreferrer">{r.url}</a>
                  </td>
                  <td style={{borderBottom: '1px solid #e5e7eb', padding: '0.5rem 0.75rem 0.5rem 0', textAlign: 'left', verticalAlign: 'top', whiteSpace: 'nowrap'}} title={r.utterance}>{r.utterance}</td>
                  <td style={{borderBottom: '1px solid #e5e7eb', padding: '0.5rem 0.75rem 0.5rem 0', textAlign: 'left', verticalAlign: 'top'}}>{r.friction_score}</td>
                </tr>
              ))}
              {!logs.length && (
                <tr>
                  <td colSpan={6} style={{borderBottom: '1px solid #e5e7eb', padding: '0.5rem 0.75rem 0.5rem 0', textAlign: 'left', verticalAlign: 'top', color: '#6b7280'}}>No logs yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
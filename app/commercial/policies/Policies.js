"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { policyTitle } from "../../../lib/policies";

const KEY = "hub-passcode"; // same passcode as Marketing Team Access (Settings)
const fileHref = (name, download) => `/api/policies/file?name=${encodeURIComponent(name)}${download ? "&download=1" : ""}`;
const sizeText = (b) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const extOf = (n) => n.split(".").pop().toUpperCase();

function DocIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round">
      <path d="M13 5h15l10 10v26a2 2 0 0 1-2 2H13a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" /><path d="M28 5v10h10M17 25h14M17 31h14M17 37h9" />
    </svg>
  );
}

function Group({ title, files, manage, onRemove }) {
  if (!files.length) return null;
  return (
    <section className="pol-group">
      <h2>{title} <span>{files.length}</span></h2>
      <ul className="pol-list">
        {files.map((f) => (
          <li key={f.name} className="pol-row">
            <a href={fileHref(f.name)} target="_blank" rel="noopener noreferrer" className="pol-open">
              <DocIcon />
              <span className="pol-name">{policyTitle(f.name)}</span>
              <span className="pol-meta">{extOf(f.name)} · {sizeText(f.size)}</span>
            </a>
            <a href={fileHref(f.name, true)} className="pol-btn" aria-label={`Download ${policyTitle(f.name)}`}>Download</a>
            {manage && <button type="button" className="pol-btn pol-del" onClick={() => onRemove(f)}>Remove</button>}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Policies() {
  const [files, setFiles] = useState(null);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [manage, setManage] = useState(false);
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const input = useRef(null);

  async function load() {
    try {
      const r = await fetch("/api/policies", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Couldn't load the policies.");
      setFiles(j.files);
    } catch (e) { setErr(e.message); setFiles([]); }
  }
  useEffect(() => { load(); try { setPass(sessionStorage.getItem(KEY) || ""); } catch {} }, []);

  const shown = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return (files || []).filter((f) => words.every((w) => f.name.toLowerCase().includes(w)));
  }, [files, q]);
  const dpia = shown.filter((f) => /^DPIA/i.test(f.name));
  const policies = shown.filter((f) => !/^DPIA/i.test(f.name));

  async function upload(list) {
    const chosen = [...list];
    if (!chosen.length) return;
    setMsg(""); setErr("");
    const failed = [];
    for (let i = 0; i < chosen.length; i++) {
      setBusy(`Adding ${i + 1} of ${chosen.length}…`);
      const fd = new FormData();
      fd.append("file", chosen[i]);
      const r = await fetch("/api/policies", { method: "POST", headers: { "x-passcode": pass }, body: fd }).catch(() => null);
      const j = r ? await r.json().catch(() => ({})) : {};
      if (!r || !r.ok) {
        failed.push(j.error || chosen[i].name);
        if (r && r.status === 401) { try { sessionStorage.removeItem(KEY); } catch {} break; }
      }
    }
    setBusy("");
    if (input.current) input.current.value = "";
    if (failed.length) setErr(failed.join(" · "));
    else { setMsg(`Added ${chosen.length} file${chosen.length === 1 ? "" : "s"}.`); try { sessionStorage.setItem(KEY, pass); } catch {} }
    load();
  }

  async function remove(f) {
    if (!window.confirm(`Remove "${policyTitle(f.name)}" from the folder?`)) return;
    setErr(""); setMsg("");
    const r = await fetch(`/api/policies?name=${encodeURIComponent(f.name)}`, { method: "DELETE", headers: { "x-passcode": pass } }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    if (!r || !r.ok) setErr(j.error || "Couldn't remove that file.");
    else { setMsg(`Removed ${policyTitle(f.name)}.`); try { sessionStorage.setItem(KEY, pass); } catch {} }
    load();
  }

  return (
    <div className="pol">
      <div className="pol-bar">
        <input className="pol-search" type="search" placeholder="Search policies" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search policies" />
      </div>

      {err && !manage && <p className="pol-err">{err}</p>}

      {files === null ? <p className="pol-empty">Loading…</p>
        : !files.length ? <p className="pol-empty">No policies here yet.</p>
        : !shown.length ? <p className="pol-empty">Nothing matches “{q}”.</p>
        : (
          <>
            <Group title="Policies" files={policies} manage={manage} onRemove={remove} />
            <Group title="Data Protection Impact Assessments (DPIAs)" files={dpia} manage={manage} onRemove={remove} />
          </>
        )}

      <div className="pol-foot">
        <button type="button" className="pol-manage" onClick={() => { setManage(!manage); setMsg(""); setErr(""); }}>
          {manage ? "Done" : "Marketing team: add or remove policies"}
        </button>
        {manage && (
          <div className="pol-admin">
            <p>Marketing team only: enter the Marketing Team Access passcode, then pick PDF or Word files. A file with the same name as one already here replaces it. Remove buttons appear next to each policy above.</p>
            <div className="pol-admin-row">
              <input className="pol-search" type="password" placeholder="Passcode" value={pass} onChange={(e) => setPass(e.target.value)} aria-label="Marketing Team Access passcode" autoComplete="off" />
              <label className={"pol-upload" + (!pass || busy ? " off" : "")}>
                {busy || "Choose files to add"}
                <input ref={input} type="file" multiple accept=".pdf,.doc,.docx" disabled={!pass || !!busy} onChange={(e) => upload(e.target.files)} hidden />
              </label>
            </div>
            {msg && <p className="pol-msg">{msg}</p>}
            {err && <p className="pol-err">{err}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

const KEY = "hub-passcode";

export default function Settings() {
  const [code, setCode] = useState("");
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");

  async function load(pass) {
    setErr("");
    const r = await fetch("/api/settings", { headers: { "x-passcode": pass }, cache: "no-store" });
    const j = await r.json();
    if (!r.ok) { setErr(j.error || "Couldn't open settings."); try { sessionStorage.removeItem(KEY); } catch {} return; }
    try { sessionStorage.setItem(KEY, pass); } catch {}
    setData(j);
    setForm({
      proofreaders: (j.settings.proofreaders || []).join("\n"),
      finalChecker: j.settings.finalChecker || "",
      media1: (j.settings.mediaLinks || [])[0] || "",
      media2: (j.settings.mediaLinks || [])[1] || "",
      ads: j.settings.adsScriptUrl || "",
    });
  }

  useEffect(() => {
    let saved = "";
    try { saved = sessionStorage.getItem(KEY) || ""; } catch {}
    if (saved) { setCode(saved); load(saved); }
  }, []);

  async function save() {
    setBusy("Saving…"); setMsg("");
    try {
      const r = await fetch("/api/settings", {
        method: "POST", headers: { "Content-Type": "application/json", "x-passcode": code },
        body: JSON.stringify({ settings: {
          proofreaders: form.proofreaders.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean),
          finalChecker: form.finalChecker.trim(),
          mediaLinks: [form.media1.trim(), form.media2.trim()],
          adsScriptUrl: form.ads.trim(),
        } }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setMsg("Saved.");
    } catch (e) { setMsg(e.message || "Couldn't save."); } finally { setBusy(""); }
  }

  async function testEmail() {
    setBusy("Sending…"); setMsg("");
    try {
      const r = await fetch("/api/settings/test-email", { method: "POST", headers: { "x-passcode": code } });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setMsg("Test sent to Zapier. If the Zap is switched on, the email will arrive in a minute.");
    } catch (e) { setMsg(`Test failed: ${e.message}`); } finally { setBusy(""); }
  }

  if (!data) {
    return (
      <form className="panel" style={{ maxWidth: 420 }} onSubmit={(e) => { e.preventDefault(); load(code); }}>
        <div className="row">
          <label className="label" htmlFor="code"><span>Passcode</span></label>
          <input id="code" type="password" className="input" value={code} onChange={(e) => setCode(e.target.value)} autoFocus />
        </div>
        {err ? <div className="hint warn">{err}</div> : null}
        <div className="actions"><button className="btn btn-primary" type="submit">Open settings</button></div>
      </form>
    );
  }

  const ok = (b) => <span className={b ? "pill-ok" : "pill-no"}>{b ? "Connected" : "Not set up"}</span>;
  return (
    <div className="settings-grid">
      <div className="panel">
        <h3 className="group-title" style={{ marginTop: 0, paddingTop: 0, borderTop: 0 }}>Proposals</h3>
        {data.proposals.length ? (
          <table className="table">
            <thead><tr><th>Client – role</th><th>Consultant</th><th>Status</th><th>Updated</th></tr></thead>
            <tbody>
              {data.proposals.map((r) => (
                <tr key={r.id}>
                  <td><a href={r.link}>{r.client || "Client"} – {r.role || "Role"}</a></td>
                  <td>{r.consultant}</td>
                  <td>{r.status}</td>
                  <td>{r.updatedAt ? new Date(r.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="hint">No proposals submitted yet.</p>}
      </div>
      <div className="panel">
        <h3 className="group-title" style={{ marginTop: 0, paddingTop: 0, borderTop: 0 }}>Proposal emails</h3>
        <div className="row">
          <label className="label" htmlFor="pr"><span>Proof-reader(s)</span></label>
          <textarea id="pr" className="input" rows={3} value={form.proofreaders} onChange={(e) => setForm({ ...form, proofreaders: e.target.value })} />
          <div className="hint">One email per line. Swap this to a colleague while you’re on annual leave.</div>
        </div>
        <div className="row">
          <label className="label" htmlFor="fc"><span>Final checker</span></label>
          <input id="fc" className="input" value={form.finalChecker} onChange={(e) => setForm({ ...form, finalChecker: e.target.value })} />
        </div>
        <h3 className="group-title">Branded Campaigns page</h3>
        <div className="row">
          <label className="label" htmlFor="m1"><span>“View Media” link under the 2nd example</span></label>
          <input id="m1" className="input" value={form.media1} placeholder="https://…" onChange={(e) => setForm({ ...form, media1: e.target.value })} />
        </div>
        <div className="row">
          <label className="label" htmlFor="m2"><span>“View Media” link under the 3rd example (video)</span></label>
          <input id="m2" className="input" value={form.media2} placeholder="https://…" onChange={(e) => setForm({ ...form, media2: e.target.value })} />
        </div>
        <div className="row">
          <label className="label" htmlFor="ads"><span>Branded ads link (Google Apps Script web app URL)</span></label>
          <input id="ads" className="input" value={form.ads} placeholder="https://script.google.com/macros/s/…/exec" onChange={(e) => setForm({ ...form, ads: e.target.value })} />
          <div className="hint">Feeds the branded ads dropdown from the Drive folder. New ads appear automatically.</div>
        </div>
        {msg ? <div className="done-msg" style={{ marginBottom: 10 }}>{msg}</div> : null}
        <div className="actions">
          <button className="btn btn-primary" type="button" onClick={save} disabled={!!busy}>{busy === "Saving…" ? busy : "Save settings"}</button>
          <button className="btn btn-ghost" type="button" onClick={testEmail} disabled={!!busy}>{busy === "Sending…" ? busy : "Send test email"}</button>
        </div>
      </div>

      <div className="panel">
        <h3 className="group-title" style={{ marginTop: 0, paddingTop: 0, borderTop: 0 }}>Connections</h3>
        <table className="table"><tbody>
          <tr><td>Storage (Vercel Blob)</td><td>{ok(data.checks.storage)}</td></tr>
          <tr><td>Claude (photos, logo, spelling)</td><td>{ok(data.checks.claude)}</td></tr>
          <tr><td>Emails (Zapier webhook)</td><td>{ok(data.checks.email)}</td></tr>
          <tr><td>Branded ads (Google Drive)</td><td>{ok(data.checks.ads)}</td></tr>
        </tbody></table>
      </div>

      {data.checks.ads ? <AdNames code={code} /> : null}

    </div>
  );
}

// Fix the names shown in the branded ads dropdown. What's typed here always wins over the automatic label.
function AdNames({ code }) {
  const [ads, setAds] = useState(null);
  const [err, setErr] = useState("");
  const [edits, setEdits] = useState({});
  const [filter, setFilter] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setErr("");
    try {
      const r = await fetch("/api/settings/ads", { headers: { "x-passcode": code }, cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setAds(j.ads);
    } catch (e) { setErr(e.message || "Couldn't load the ads."); }
  }
  useEffect(() => { load(); }, []);

  const val = (a, k) => (edits[a.id] && k in edits[a.id] ? edits[a.id][k] : k === "hidden" ? a.hidden : a[k]);
  const change = (a, k, v) => setEdits((e) => ({ ...e, [a.id]: { client: val(a, "client"), jobTitle: val(a, "jobTitle"), hidden: val(a, "hidden"), ...(e[a.id] || {}), [k]: v } }));
  const reset = (a) => setEdits((e) => ({ ...e, [a.id]: { client: "", jobTitle: "", hidden: false, reset: true } }));

  async function save() {
    setBusy(true); setMsg("");
    try {
      const r = await fetch("/api/settings/ads", { method: "POST", headers: { "Content-Type": "application/json", "x-passcode": code }, body: JSON.stringify({ overrides: edits }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setEdits({}); setMsg("Saved. The dropdown now uses these names.");
      await load();
    } catch (e) { setMsg(e.message || "Couldn't save."); } finally { setBusy(false); }
  }

  const q = filter.trim().toLowerCase();
  const shown = (ads || []).filter((a) => !q || `${a.client} ${a.jobTitle} ${a.name}`.toLowerCase().includes(q));
  const changed = Object.keys(edits).length;
  return (
    <div className="panel" style={{ gridColumn: "1 / -1" }}>
      <h3 className="group-title" style={{ marginTop: 0, paddingTop: 0, borderTop: 0 }}>Branded ads – names in the dropdown</h3>
      <p className="hint" style={{ marginTop: 0 }}>Correct any client or job title, then Save. Tick “Hide” to keep an ad out of the dropdown. Your names stay even if the file is updated.</p>
      {err ? <div className="hint warn">{err}</div> : null}
      {!ads && !err ? <p className="hint">Loading the ads…</p> : null}
      {ads ? (
        <>
          <input className="input" placeholder="Filter by client, job title or file name" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ marginBottom: 12 }} />
          <table className="table">
            <thead><tr><th style={{ width: 90 }}>Ad</th><th>Client</th><th>Job title</th><th style={{ width: 60 }}>Hide</th></tr></thead>
            <tbody>
              {shown.map((a) => (
                <tr key={a.id} style={val(a, "hidden") ? { opacity: 0.5 } : null}>
                  <td>
                    <a href={`/api/proposals/ads/thumb?id=${a.id}&u=${encodeURIComponent(a.updated)}`} target="_blank" rel="noreferrer" title={a.name}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/api/proposals/ads/thumb?id=${a.id}&u=${encodeURIComponent(a.updated)}`} alt="" loading="lazy" style={{ width: 80, height: 80, objectFit: "contain", background: "#f3f3f3", borderRadius: 6 }} />
                    </a>
                  </td>
                  <td><input className="input" value={val(a, "client")} placeholder={a.autoClient} onChange={(e) => change(a, "client", e.target.value)} /></td>
                  <td>
                    <input className="input" value={val(a, "jobTitle")} placeholder={a.autoJob} onChange={(e) => change(a, "jobTitle", e.target.value)} />
                    {a.edited && !(edits[a.id] && edits[a.id].reset) ? <button type="button" className="link" onClick={() => reset(a)}>Go back to the automatic name</button> : null}
                  </td>
                  <td style={{ textAlign: "center" }}><input type="checkbox" checked={!!val(a, "hidden")} onChange={(e) => change(a, "hidden", e.target.checked)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {msg ? <div className="done-msg" style={{ margin: "10px 0" }}>{msg}</div> : null}
          <div className="actions">
            <button className="btn btn-primary" type="button" onClick={save} disabled={busy || !changed}>{busy ? "Saving…" : changed ? `Save ${changed} change${changed === 1 ? "" : "s"}` : "No changes"}</button>
          </div>
        </>
      ) : null}
    </div>
  );
}

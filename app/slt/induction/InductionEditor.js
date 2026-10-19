"use client";

import { useState } from "react";
import { blankInduction, normaliseInduction, inductionFileName, OWNERS, PEOPLE, MAX_SESSIONS } from "../../../lib/slt/induction";
import { InductionSheet } from "../../../lib/slt/InductionSheet";
import Scaled from "../Scaled";
import { useSltDoc, downloadPdf } from "../useSltDoc";

// Pick a person from the hub's headshots.
function PersonPick({ id, value, onChange, none = "— Nobody —" }) {
  const known = PEOPLE.some((p) => p.name === value);
  return (
    <select id={id} className="slt-who" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{none}</option>
      {!known && value ? <option value={value}>{value}</option> : null}
      {PEOPLE.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
    </select>
  );
}

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function InductionEditor() {
  const [d, setD, reset] = useSltDoc("slt-induction", blankInduction, normaliseInduction);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  if (!d) return null;

  const set = (k, v) => setD((x) => ({ ...x, [k]: v }));
  const setKey = (owner, person) => setD((x) => ({ ...x, key: x.key.map((k) => (k.owner === owner ? { ...k, person } : k)) }));
  const setWeek = (wi, fn) => setD((x) => ({ ...x, weeks: x.weeks.map((w, j) => (j === wi ? fn(w) : w)) }));
  const setDay = (wi, di, fn) => setWeek(wi, (w) => ({ ...w, days: w.days.map((dd, j) => (j === di ? fn(dd) : dd)) }));
  const setSess = (wi, di, part, si, k, v) => setDay(wi, di, (dd) => ({ ...dd, [part]: dd[part].map((s, j) => (j === si ? { ...s, [k]: v } : s)) }));

  // Who a session is with: anyone in the key, or white for general sessions.
  const whoOptions = [
    ...d.key.filter((k) => k.person).map((k) => ({ v: k.owner, label: `${k.person} (${OWNERS.find((o) => o.id === k.owner).label.toLowerCase()})` })),
    { v: "none", label: "White – no one in particular" },
  ];
  const whoColour = (id) => (OWNERS.find((o) => o.id === id) || { text: "#999" }).text;

  async function download() {
    setErr("");
    setBusy("Making the PDF…");
    try { await downloadPdf("induction", d, inductionFileName(d)); } catch (e) { setErr(e.message); }
    setBusy("");
  }

  const sessions = (wi, di, part, list) => (
    <>
      <div className="slt-sub">{part === "am" ? "Morning" : "Afternoon"}</div>
      {list.map((s, si) => (
        <div key={si} className="slt-sess">
          <textarea className="input" rows={2} value={s.text} maxLength={140} aria-label="Session" onChange={(e) => setSess(wi, di, part, si, "text", e.target.value)} />
          <button type="button" className="slt-x" title="Remove" onClick={() => setDay(wi, di, (dd) => ({ ...dd, [part]: dd[part].filter((_, j) => j !== si) }))}>×</button>
          <select className="slt-who" value={s.who} aria-label="Colour" style={{ borderLeft: `6px solid ${s.who === "none" ? "#d0d3d1" : whoColour(s.who)}` }}
            onChange={(e) => setSess(wi, di, part, si, "who", e.target.value)}>
            {whoOptions.some((o) => o.v === s.who) ? null : <option value={s.who}>{OWNERS.find((o) => o.id === s.who)?.label || "White"}</option>}
            {whoOptions.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
          </select>
        </div>
      ))}
      <button type="button" className="slt-add" disabled={list.length >= MAX_SESSIONS}
        onClick={() => setDay(wi, di, (dd) => ({ ...dd, [part]: [...dd[part], { text: "", who: "none" }] }))}>+ Add a session</button>
    </>
  );

  return (
    <div className="editor slt-editor">
      <div className="panel">
        <div className="row">
          <label className="label" htmlFor="i-starter"><span>New starter <span className="opt">(for the file name only)</span></span></label>
          <input id="i-starter" className="input" value={d.starter} maxLength={60} placeholder="e.g. Jane Smith" onChange={(e) => set("starter", e.target.value)} />
        </div>

        <h3 className="group-title">Introduction</h3>
        <div className="row"><textarea className="input" rows={3} value={d.intro1} maxLength={300} aria-label="First paragraph" onChange={(e) => set("intro1", e.target.value)} /></div>
        <div className="row"><textarea className="input" rows={3} value={d.intro2} maxLength={300} aria-label="Second paragraph" onChange={(e) => set("intro2", e.target.value)} /></div>

        <h3 className="group-title">Buddy</h3>
        <div className="row">
          <PersonPick id="i-buddy" value={d.buddy} onChange={(v) => set("buddy", v)} none="— No buddy —" />
        </div>

        <h3 className="group-title">Colour key</h3>
        <div className="hint" style={{ marginTop: -6, marginBottom: 10 }}>Choose who goes with each colour. Their headshot and name appear in the key, and sessions in that colour are with them.</div>
        {d.key.map((k) => {
          const o = OWNERS.find((x) => x.id === k.owner);
          return (
            <div key={k.owner} className="slt-keyrow">
              <span className="slt-swatch" style={{ background: o.ring }} title={o.label} />
              <PersonPick value={k.person} onChange={(v) => setKey(k.owner, v)} />
            </div>
          );
        })}

        <h3 className="group-title" style={{ marginTop: 24 }}>Schedule</h3>
        {d.weeks.map((w, wi) => (
          <div key={wi} className="slt-card">
            <div className="slt-card-head">
              <input className="input" value={w.label} maxLength={12} aria-label="Week label" style={{ maxWidth: 140 }} onChange={(e) => setWeek(wi, (x) => ({ ...x, label: e.target.value }))} />
              <button type="button" className="slt-add" disabled={w.days.length >= 5}
                onClick={() => setWeek(wi, (x) => ({ ...x, days: [...x.days, { name: WEEKDAYS[x.days.length] || "", note: "", am: [], lunch: "", pm: [] }] }))}>+ Add a day</button>
            </div>
            {w.days.map((dd, di) => (
              <details key={di} className="slt-day">
                <summary>{dd.name || "Day"}{dd.note ? ` ${dd.note}` : ""} <span className="opt" style={{ fontWeight: 400, color: "var(--muted)" }}>· {dd.am.length + dd.pm.length} sessions</span></summary>
                <div className="slt-two" style={{ marginTop: 8 }}>
                  <input className="input" value={dd.name} maxLength={12} placeholder="Day" aria-label="Day" onChange={(e) => setDay(wi, di, (x) => ({ ...x, name: e.target.value }))} />
                  <input className="input" value={dd.note} maxLength={14} placeholder="Note, e.g. (WFH)" aria-label="Note under the day" onChange={(e) => setDay(wi, di, (x) => ({ ...x, note: e.target.value }))} />
                </div>
                {sessions(wi, di, "am", dd.am)}
                <div className="slt-sub">Between morning and afternoon</div>
                <input className="input" value={dd.lunch} maxLength={24} placeholder="e.g. Team Lunch" aria-label="Lunch note" onChange={(e) => setDay(wi, di, (x) => ({ ...x, lunch: e.target.value }))} />
                {sessions(wi, di, "pm", dd.pm)}
                <div style={{ marginTop: 10 }}>
                  <button type="button" className="slt-x" style={{ fontSize: 13 }} onClick={() => setWeek(wi, (x) => ({ ...x, days: x.days.filter((_, j) => j !== di) }))}>Remove this day</button>
                </div>
              </details>
            ))}
          </div>
        ))}
        <div className="hint">Sessions with a lot of words get smaller to fit their box.</div>

        <div className="actions" style={{ marginTop: 20 }}>
          <button type="button" className="btn btn-primary" onClick={download} disabled={!!busy}>{busy || "Download PDF"}</button>
          <button type="button" className="btn btn-ghost" disabled={!!busy} onClick={() => { if (window.confirm("Clear your changes and go back to the template?")) reset(); }}>Start again</button>
        </div>
        {err ? <p className="hint warn">{err}</p> : null}
      </div>

      <div className="slt-preview">
        <Scaled w={1123} h={794}><InductionSheet data={d} /></Scaled>
        <div className="hint">A4 landscape, as it will print.</div>
      </div>
    </div>
  );
}

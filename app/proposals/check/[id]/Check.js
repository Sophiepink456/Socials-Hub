"use client";

// The final checker's view: every page, then approve or leave comments.
import { useEffect, useRef, useState } from "react";
import { proposalPages } from "../../../../lib/proposal/pages";
import { normalise } from "../../../../lib/proposal/data";

export default function Check({ id, c }) {
  const [rec, setRec] = useState(null);
  const [err, setErr] = useState("");
  const [text, setText] = useState("");
  const [name, setName] = useState("John Bohan");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");

  useEffect(() => {
    fetch(`/api/proposals/${id}?c=${encodeURIComponent(c)}`, { cache: "no-store" })
      .then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error); setRec(j); })
      .catch((e) => setErr(e.message || "Couldn't open this proposal."));
  }, [id, c]);

  async function send(approve) {
    if (!approve && !text.trim()) { alert("Add your comments first."); return; }
    setBusy(true);
    try {
      const r = await fetch(`/api/proposals/${id}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ c, action: "comment", comment: text, approve, name }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setRec(j);
      setText("");
      setDone(approve ? "Approved. The proof-reader has been told and will send it to the consultant." : "Thanks. Your comments have been sent to the proof-reader.");
    } catch (e) {
      alert(e.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (err) return <p className="lede">{err}</p>;
  if (!rec) return <p className="lede">Opening the proposal…</p>;
  const p = normalise(rec.data);
  const pages = proposalPages(p);
  return (
    <>
      <h1 className="h1">{p.clientName || "Client"} – {p.roleTitle || "Role"}<span className="g">.</span></h1>
      <p className="lede">Read through each page, then approve it or leave comments for changes. {rec.pdf ? <a href={rec.pdf} target="_blank" rel="noreferrer">Open the PDF</a> : null}</p>
      <div className="pages-scroll">
        {pages.map((pg, i) => (
          <div key={pg.key}>
            <div className="hint" style={{ marginBottom: 6 }}>Page {i + 1} · {pg.label}</div>
            <Scaled>{pg.el}</Scaled>
          </div>
        ))}
      </div>
      <div className="panel" style={{ marginTop: 28 }}>
        {(rec.comments || []).map((cm, i) => (
          <div key={i} className="comment"><div className="meta">{cm.by} · {new Date(cm.at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</div>{cm.text || (cm.approve ? "Approved." : "")}</div>
        ))}
        <div className="row" style={{ marginTop: 16 }}>
          <label className="label" htmlFor="name"><span>Your name</span></label>
          <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="row">
          <label className="label" htmlFor="comments"><span>Comments</span></label>
          <textarea id="comments" className="input" rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Page 5: change the salary to £95k. Page 3: second paragraph reads a bit long." />
        </div>
        {done ? <div className="done-msg" style={{ marginBottom: 12 }}>{done}</div> : null}
        <div className="actions">
          <button type="button" className="btn btn-ghost" onClick={() => send(false)} disabled={busy}>Send comments</button>
          <button type="button" className="btn btn-primary" onClick={() => send(true)} disabled={busy}>{busy ? "Sending…" : text.trim() ? "Approve with these notes" : "Approve"}</button>
        </div>
      </div>
    </>
  );
}

function Scaled({ children }) {
  const box = useRef(null);
  const [w, setW] = useState(900);
  useEffect(() => {
    const el = box.current;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el); setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  const s = w / 1920;
  return (
    <div ref={box} className="pframe" style={{ height: 1080 * s }}>
      <div style={{ width: 1920, height: 1080, transform: `scale(${s})`, transformOrigin: "0 0" }}>{children}</div>
    </div>
  );
}

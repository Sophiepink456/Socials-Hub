"use client";

// The proof-reader's view: the same form, pre-filled, with save / send buttons.
import { useEffect, useState } from "react";
import ProposalEditor from "../../ProposalEditor";

export default function Review({ id, k }) {
  const [rec, setRec] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch(`/api/proposals/${id}?k=${encodeURIComponent(k)}`, { cache: "no-store" })
      .then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error); setRec(j); })
      .catch((e) => setErr(e.message || "Couldn't open this proposal."));
  }, [id, k]);

  if (err) return <p className="lede">{err}</p>;
  if (!rec) return <p className="lede">Opening the proposal…</p>;
  const d = rec.data;
  return (
    <>
      <h1 className="h1">{d.clientName || "Client"} – {d.roleTitle || "Role"}<span className="g">.</span></h1>
      <div className="review-banner">
        <span className="status">{rec.statusLabel}</span>
        <span className="hint" style={{ marginLeft: 10 }}>
          Submitted by {rec.submittedBy && rec.submittedBy.name || "a consultant"}
          {rec.pdf ? <> · <a href={rec.pdf} target="_blank" rel="noreferrer">Latest PDF</a></> : null}
        </span>
        {(rec.comments || []).map((c, i) => (
          <div key={i} className="comment">
            <div className="meta">{c.by} · {new Date(c.at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}{c.approve ? " · Approved" : " · Changes requested"}</div>
            {c.text || (c.approve ? "Approved with no comments." : "")}
          </div>
        ))}
      </div>
      <ProposalEditor mode="review" record={{ ...rec, key: k }} onRecord={(r) => setRec(r)} />
    </>
  );
}

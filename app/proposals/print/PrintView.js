"use client";

// Every proposal page stacked one per printed page. Headless Chrome loads this
// with the proposal in window.__PROPOSAL__ and prints it to PDF.
import { useEffect, useState } from "react";
import { proposalPages } from "../../../lib/proposal/pages";
import { normalise, sampleProposal } from "../../../lib/proposal/data";

export default function PrintView() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let p = typeof window !== "undefined" && window.__PROPOSAL__;
    if (!p) {
      try { p = JSON.parse(sessionStorage.getItem("proposal-print") || "null"); } catch { p = null; }
    }
    setData({ p: normalise(p || sampleProposal()), ctx: (window.__PROPOSAL_CTX__ || {}) });
  }, []);

  useEffect(() => {
    if (!data) return;
    const imgs = Array.from(document.images);
    Promise.all([
      document.fonts ? document.fonts.ready : Promise.resolve(),
      ...imgs.map((im) => (im.complete ? Promise.resolve() : new Promise((r) => { im.onload = r; im.onerror = r; }))),
    ]).then(() => { window.__PROPOSAL_READY__ = true; document.body.setAttribute("data-ready", "1"); });
  }, [data]);

  if (!data) return null;
  return (
    <div className="print-root">
      <style>{`
        .bar { display: none !important; }
        html, body { margin: 0; padding: 0; background: #fff; }
        @page { size: 1920px 1080px; margin: 0; }
        .print-root .sheet { width: 1920px; height: 1080px; page-break-after: always; break-after: page; overflow: hidden; }
        .print-root .sheet:last-child { page-break-after: auto; break-after: auto; }
      `}</style>
      {proposalPages(data.p, data.ctx).map((pg) => (
        <div key={pg.key} className="sheet">{pg.el}</div>
      ))}
    </div>
  );
}

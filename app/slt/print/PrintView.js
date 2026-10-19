"use client";

// The page headless Chrome prints. The document comes in window.__SLT__ (set by
// lib/server/sltPdf.js); this page holds nothing itself, so it's open to the PDF maker.
import { useEffect, useState } from "react";
import { targetsSlides } from "../../../lib/slt/TargetsSlides";
import { InductionSheet } from "../../../lib/slt/InductionSheet";

export default function PrintView() {
  const [doc, setDoc] = useState(null);
  const [pass, setPass] = useState(0);
  useEffect(() => { setDoc((typeof window !== "undefined" && window.__SLT__) || null); }, []);
  useEffect(() => {
    if (!doc) return;
    const imgs = Array.from(document.images);
    Promise.all([
      document.fonts ? document.fonts.ready : Promise.resolve(),
      ...imgs.map((im) => (im.complete ? Promise.resolve() : new Promise((r) => { im.onload = r; im.onerror = r; }))),
    ]).then(() => setPass(1)); // draw again now the fonts are in, so long text is fitted with them
  }, [doc]);
  useEffect(() => {
    if (pass) requestAnimationFrame(() => requestAnimationFrame(() => { window.__SLT_READY__ = true; }));
  }, [pass]);
  if (!doc) return null;
  const slides = doc.kind === "targets";
  const w = slides ? 1920 : 1123;
  const h = slides ? 1080 : 794;
  const pages = slides ? targetsSlides(doc.data).map((s) => ({ key: s.key, el: s.el })) : [{ key: "sheet", el: <InductionSheet data={doc.data} /> }];
  return (
    <div className="print-root">
      <style>{`
        .bar { display: none !important; }
        html, body { margin: 0; padding: 0; background: #fff; }
        @page { size: ${w}px ${h}px; margin: 0; }
        .print-root .sheet { width: ${w}px; height: ${h}px; page-break-after: always; break-after: page; overflow: hidden; }
        .print-root .sheet:last-child { page-break-after: auto; break-after: auto; }
      `}</style>
      {pages.map((p) => <div key={p.key + pass} className="sheet">{p.el}</div>)}
    </div>
  );
}

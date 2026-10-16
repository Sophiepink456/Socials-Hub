"use client";

// Headless Chrome loads this with the document in window.__LETTERHEAD__ and
// prints one part: "cover" (one full-bleed page) or "body" (flowing pages).
import { useEffect, useState } from "react";
import { normaliseDoc } from "../../../lib/letterhead/doc";
import { Cover, Body } from "../../../lib/letterhead/Sheets";

export default function PrintView() {
  const [state, setState] = useState(null);

  useEffect(() => {
    let d = window.__LETTERHEAD__;
    if (!d) { try { d = JSON.parse(sessionStorage.getItem("letterhead-print") || "null"); } catch { d = null; } }
    setState({ doc: normaliseDoc(d), part: window.__LETTERHEAD_PART__ || (/[?&]part=cover/.test(location.search) ? "cover" : "body") });
  }, []);

  useEffect(() => {
    if (!state) return;
    const imgs = Array.from(document.images);
    Promise.all([
      document.fonts ? document.fonts.ready : Promise.resolve(),
      ...imgs.map((im) => (im.complete ? Promise.resolve() : new Promise((r) => { im.onload = r; im.onerror = r; }))),
    ]).then(() => { window.__LETTERHEAD_READY__ = true; });
  }, [state]);

  if (!state) return null;
  const cover = state.part === "cover";
  return (
    <>
      <style>{`
        .bar { display: none !important; }
        html, body { margin: 0; padding: 0; background: #fff; }
        ${cover ? "@page { size: A4; margin: 0; }" : ""}
      `}</style>
      {cover ? <Cover cover={state.doc.cover} /> : <Body doc={state.doc} />}
    </>
  );
}

"use client";

// Shared bits for the SLT editors: the document being edited (kept in this tab only, so a
// refresh doesn't lose it but nothing outlives the tab), and the straight-to-PDF download.
import { useEffect, useState } from "react";

export function useSltDoc(key, blank, normalise) {
  const [doc, setDoc] = useState(null);
  const [, setFonts] = useState(0);
  useEffect(() => {
    let d = null;
    try { d = JSON.parse(sessionStorage.getItem(key) || "null"); } catch {}
    setDoc(normalise(d || blank()));
    // Fit long text again once the fonts have loaded.
    if (document.fonts) document.fonts.ready.then(() => setFonts(1));
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!doc) return;
    try { sessionStorage.setItem(key, JSON.stringify(doc)); } catch {}
  }, [key, doc]);
  const reset = () => {
    try { sessionStorage.removeItem(key); } catch {}
    setDoc(normalise(blank()));
  };
  return [doc, setDoc, reset];
}

export async function downloadPdf(kind, data, fileName) {
  const r = await fetch("/api/slt/pdf", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, data }) });
  if (r.status === 401) throw new Error("The SLT folder has locked itself. Open it again from the hub and unlock it (your changes are kept).");
  if (!r.ok) throw new Error("Couldn’t make the PDF. Please try again.");
  const blob = await r.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

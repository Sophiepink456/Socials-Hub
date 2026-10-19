"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { normaliseDoc, pdfName } from "../../lib/letterhead/doc";
import { Cover, Block } from "../../lib/letterhead/Sheets";
// Loaded here too so the proof-reading and final-check pages (under /proposals) get the styles.
import "./letterhead.css";

const ACCEPT = ".docx,.pdf,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";

// mode "new": a consultant uploads a document and sends it for proof-reading.
// mode "review": the proof-reader edits it, saves, sends to the final checker, then to the consultant
// (the same sign-off route as proposals and candidate packs, via /api/proposals/…).
export default function Letterhead({ mode = "new", record = null, onRecord }) {
  const review = mode === "review";
  const [doc, setDoc] = useState(() => (record ? normaliseDoc(record.data) : null));
  const [submit, setSubmit] = useState(null); // { name, email } while the send panel is open
  const [done, setDone] = useState("");
  const [sendTo, setSendTo] = useState(record ? (record.submittedBy && record.submittedBy.email) || "" : "");

  async function sendForProofing() {
    if (!submit.name.trim() || !submit.email.trim()) { alert("Add your name and email so the finished PDF can come back to you."); return; }
    setBusy("Sending…"); setErr("");
    try {
      const r = await fetch("/api/proposals/submit", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposal: { ...doc, kind: "letterhead" }, submitter: submit }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error);
      try { localStorage.setItem("hub-submitter", JSON.stringify(submit)); } catch {}
      setSubmit(null);
      setDone("Sent for proof-reading. You’ll get the finished PDF by email once it’s been checked, and it’ll be in your Saved Docs.");
    } catch (e) { setErr(e.message || "Sorry, it didn't send. Try again in a moment."); } finally { setBusy(""); }
  }

  async function reviewAction(action, label) {
    if (action === "send-consultant" && !sendTo.trim()) { alert("Add the consultant's email."); return; }
    if (action === "send-consultant" && !confirm(`Send the finished document to ${sendTo}?`)) return;
    setBusy(label); setErr(""); setDone("");
    try {
      const r = await fetch(`/api/proposals/${record.id}`, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ k: record.key, action, data: { ...doc, kind: "letterhead" }, to: sendTo }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      onRecord && onRecord(j);
      setDone(action === "save" ? "Changes saved and the PDF updated." : action === "send-check" ? "Sent to the final checker." : `Sent to ${sendTo}.`);
    } catch (e) { setErr(e.message || "Something went wrong."); } finally { setBusy(""); }
  }
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [drag, setDrag] = useState(false);
  const input = useRef(null);

  async function upload(file) {
    if (!file) return;
    setErr("");
    if (file.size > 4 * 1024 * 1024) { setErr("Please keep documents under 4 MB."); return; }
    setBusy(/\.pdf$/i.test(file.name) ? "Reading your PDF… this can take up to a minute." : "Reading your document…");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/letterhead/parse", { method: "POST", body: fd });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.doc) throw new Error(j.error || "Couldn't read that document.");
      setDoc(normaliseDoc(j.doc));
    } catch (e) {
      setErr(e.message || "Couldn't read that document.");
    } finally {
      setBusy("");
      if (input.current) input.current.value = "";
    }
  }

  async function download() {
    setBusy("Making your PDF…");
    setErr("");
    try {
      const r = await fetch("/api/letterhead/pdf", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ doc }) });
      if (!r.ok) throw new Error();
      const url = URL.createObjectURL(await r.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = pdfName(doc);
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch {
      setErr("Sorry, the PDF didn't download. Try again in a moment.");
    } finally {
      setBusy("");
    }
  }

  const setCover = (k, v) => setDoc((d) => ({ ...d, cover: { ...d.cover, [k]: v } }));
  const setLine = (k, i, v) => setDoc((d) => ({ ...d, cover: { ...d.cover, [k]: d.cover[k].map((x, j) => (j === i ? v : x)) } }));
  const removeBlock = (i) => setDoc((d) => ({ ...d, blocks: d.blocks.filter((_, j) => j !== i) }));
  // Edits typed on the preview. A block that's been emptied is taken out.
  const editBlock = (i, nb) => setDoc((d) => ({ ...d, blocks: nb ? d.blocks.map((x, j) => (j === i ? nb : x)) : d.blocks.filter((_, j) => j !== i) }));
  const addBreak = (i) => setDoc((d) => ({ ...d, blocks: [...d.blocks.slice(0, i), { type: "pagebreak" }, ...d.blocks.slice(i)] }));
  const editCover = (k, i, v) => (i === null ? setCover(k, v) : setLine(k, i, v));

  const picker = (
    <input ref={input} type="file" accept={ACCEPT} hidden onChange={(e) => upload(e.target.files && e.target.files[0])} />
  );

  if (!doc) {
    return (
      <div className="lh-start">
        {picker}
        <button type="button" className={"lh-drop" + (drag ? " on" : "")} disabled={!!busy}
          onClick={() => input.current && input.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files && e.dataTransfer.files[0]); }}>
          <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M13 5h15l10 10v26a2 2 0 0 1-2 2H13a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" /><path d="M28 5v10h10M24 36V22M18 28l6-6 6 6" /></svg>
          <strong>{busy || "Upload a document"}</strong>
          <span>{busy ? "" : "Drop it here or click to choose. Word (.docx), PDF or text, up to 4 MB."}</span>
        </button>
        {err ? <p className="hint warn lh-err">{err}</p> : null}
      </div>
    );
  }

  const c = doc.cover;
  return (
    <div className="editor lh-editor">
      <div className="panel">
        {picker}
        <div className="row lh-file">
          <span>📄 {doc.fileName || "Your document"}</span>
          {!review ? <button type="button" className="link" disabled={!!busy} onClick={() => input.current && input.current.click()}>Upload a different one</button> : null}
        </div>

        <h3 className="group-title">Cover page</h3>
        <label className="check"><input type="checkbox" checked={c.on} onChange={(e) => setCover("on", e.target.checked)} /> Include a cover page</label>
        {c.on ? (
          <>
            <div className="row" style={{ marginTop: 14 }}>
              <label className="label" htmlFor="lh-title"><span>Title</span></label>
              <textarea id="lh-title" className="input" rows={2} value={c.title} maxLength={240} placeholder={"e.g. Tedd Engineering\nRecruitment Partnership Proposal"} onChange={(e) => setCover("title", e.target.value.split("\n").slice(0, 3).join("\n"))} />
              <div className="hint">Press Enter to put the rest on a second line. The first line is shown larger, as in the design.</div>
            </div>
            <div className="row">
              <label className="label"><span>Prepared for <span className="opt">(optional)</span></span></label>
              {c.forLines.map((l, i) => (
                <input key={i} className="input lh-line" value={l} maxLength={90} placeholder={["e.g. Chris Cox, Managing Director", "e.g. Mollart Cox Engineering Limited", ""][i]}
                  onChange={(e) => setLine("forLines", i, e.target.value)} />
              ))}
            </div>
            <div className="row">
              <label className="label"><span>Prepared by <span className="opt">(optional)</span></span></label>
              {c.byLines.map((l, i) => (
                <input key={i} className="input lh-line" value={l} maxLength={90} placeholder={["e.g. John Bohan, Commercial Director", "e.g. Elevation Recruitment Group", ""][i]}
                  onChange={(e) => setLine("byLines", i, e.target.value)} />
              ))}
            </div>
            <label className="check"><input type="checkbox" checked={c.confidential} onChange={(e) => setCover("confidential", e.target.checked)} /> Show “Private &amp; Confidential”</label>
          </>
        ) : null}

        <h3 className="group-title" style={{ marginTop: 24 }}>Layout</h3>
        <label className="check"><input type="checkbox" checked={doc.breakSections} onChange={(e) => setDoc((d) => ({ ...d, breakSections: e.target.checked }))} /> Start each main heading on a new page</label>
        <div className="hint">Click any text in the preview to change it: press Enter to move words onto a new line, or delete anything you don’t want (for example text repeated from the cover). Hover over a block for ⤒ (start a new page there) or × (take it out).</div>

        {review ? (
          <>
            <div className="actions" style={{ marginTop: 20 }}>
              <button type="button" className="btn btn-ghost" onClick={() => reviewAction("save", "Saving…")} disabled={!!busy}>Save changes</button>
              <button type="button" className="btn btn-ghost" onClick={download} disabled={!!busy}>Download PDF</button>
            </div>
            <div className="actions"><button type="button" className="btn btn-primary" onClick={() => reviewAction("send-check", "Sending…")} disabled={!!busy}>{busy || "Send to final checker"}</button></div>
            <div className="row" style={{ marginTop: 16 }}>
              <label className="label" htmlFor="lh-sendto"><span>Consultant’s email</span></label>
              <input id="lh-sendto" className="input" value={sendTo} onChange={(e) => setSendTo(e.target.value)} />
            </div>
            <div className="actions"><button type="button" className="btn btn-primary" onClick={() => reviewAction("send-consultant", "Sending…")} disabled={!!busy}>Send to consultant</button></div>
          </>
        ) : submit ? (
          <div className="send-panel" style={{ marginTop: 20 }}>
            <div className="row">
              <label className="label" htmlFor="lh-name"><span>Your name</span></label>
              <input id="lh-name" className="input" value={submit.name} onChange={(e) => setSubmit({ ...submit, name: e.target.value })} />
            </div>
            <div className="row">
              <label className="label" htmlFor="lh-email"><span>Your email</span></label>
              <input id="lh-email" type="email" className="input" value={submit.email} onChange={(e) => setSubmit({ ...submit, email: e.target.value })} />
              <div className="hint">The finished PDF comes back to this address once it’s been proof-read and checked.</div>
            </div>
            <div className="actions">
              <button type="button" className="btn btn-primary" onClick={sendForProofing} disabled={!!busy}>{busy || "Send"}</button>
              <button type="button" className="btn btn-ghost" onClick={() => setSubmit(null)} disabled={!!busy}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="actions" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-primary" disabled={!!busy || !!done || (!doc.blocks.length && !c.on)}
              onClick={() => { let me = null; try { me = JSON.parse(localStorage.getItem("hub-submitter") || "null"); } catch {} setSubmit(me || { name: "", email: "" }); }}>
              Send for proof-reading
            </button>
          </div>
        )}
        {done ? <div className="done-msg" style={{ marginTop: 12 }}>{done}</div> : null}
        {err ? <p className="hint warn">{err}</p> : null}
      </div>

      <div className="lh-preview">
        {c.on ? <Scaled><Cover cover={c} onEdit={editCover} /></Scaled> : null}
        <Pages doc={doc} editBlock={editBlock} removeBlock={removeBlock} addBreak={addBreak} />
        <div className="preview-note">A4 · Each page as it will print, with the footer bar. The PDF may move a line or two between pages.</div>
      </div>
    </div>
  );
}

// The final checker's view: the cover and every page, nothing editable.
export function LetterheadView({ data }) {
  const doc = normaliseDoc(data);
  return (
    <div className="lh-preview lh-readonly">
      {doc.cover.on ? <Scaled><Cover cover={doc.cover} /></Scaled> : null}
      <Pages doc={doc} />
    </div>
  );
}

// The body split into A4 pages, the way it will print: every block is measured off screen,
// then pages are filled to the printable height (842pt less the 48pt top and 92pt footer
// margins), starting a new page at each page break, and at main headings when that's ticked.
const PT = 4 / 3;
const PAGE_H = (842 - 48 - 92) * PT;
function Pages({ doc, editBlock, removeBlock, addBreak }) {
  const measure = useRef(null);
  const [pages, setPages] = useState(null);
  const [fontsReady, setFontsReady] = useState(0);
  useEffect(() => { if (document.fonts) document.fonts.ready.then(() => setFontsReady((n) => n + 1)); }, []);
  useLayoutEffect(() => {
    const box = measure.current;
    if (!box) return;
    const els = Array.from(box.children);
    const out = [{ items: [], breakAt: null }];
    let used = 0, prevMb = 0, seenH1 = false;
    const newPage = (breakAt = null) => { out.push({ items: [], breakAt }); used = 0; prevMb = 0; };
    doc.blocks.forEach((b, i) => {
      const cur = out[out.length - 1];
      if (b.type === "pagebreak") { if (cur.items.length || cur.breakAt !== null) newPage(i); else cur.breakAt = i; return; }
      if (doc.breakSections && b.type === "h1" && seenH1 && cur.items.length) newPage();
      if (b.type === "h1") seenH1 = true;
      const el = els[i];
      const inner = el && el.firstElementChild;
      const cs = inner ? getComputedStyle(inner) : null;
      const mt = cs ? parseFloat(cs.marginTop) || 0 : 0, mb = cs ? parseFloat(cs.marginBottom) || 0 : 0;
      const h = el ? el.offsetHeight : 0;
      const page = out[out.length - 1];
      let add = (page.items.length ? Math.max(prevMb, mt) : 0) + h;
      if (page.items.length && used + add > PAGE_H) { newPage(); add = h; }
      out[out.length - 1].items.push(i);
      used += add; prevMb = mb;
    });
    setPages(out);
  }, [doc.blocks, doc.breakSections, fontsReady]);
  return (
    <>
      <div ref={measure} className="lh-body lh-measure" aria-hidden="true">
        {doc.blocks.map((b, i) => <div key={i}><Block b={b} /></div>)}
      </div>
      {(pages || [{ items: doc.blocks.map((_, i) => i), breakAt: null }]).map((pg, n) => (
        <Scaled key={n}>
          <div className="lh-sheet">
            <span className="lh-pageno">Page {n + 1}</span>
            {editBlock && pg.breakAt !== null && doc.blocks[pg.breakAt] && doc.blocks[pg.breakAt].type === "pagebreak" ? (
              <span className="lh-manual">Page break · <button type="button" onClick={() => removeBlock(pg.breakAt)}>Remove</button></span>
            ) : null}
            <div className="lh-body">
              {pg.items.filter((i) => doc.blocks[i] && doc.blocks[i].type !== "pagebreak").map((i, k) => (!editBlock ? (
                <div key={i}><Block b={doc.blocks[i]} first={k === 0} /></div>
              ) : (
                <div key={i} className="lh-edit">
                  <Block b={doc.blocks[i]} first={k === 0} onEdit={(nb) => editBlock(i, nb)} />
                  <span className="lh-tools">
                    {k > 0 ? <button type="button" title="Start a new page here" onClick={() => addBreak(i)}>⤒</button> : null}
                    <button type="button" className="lh-del" title="Take this out" onClick={() => removeBlock(i)}>×</button>
                  </span>
                </div>
              )))}
              {!doc.blocks.length ? <p className="lh-p" style={{ color: "#888" }}>No content left. Upload the document again to start over.</p> : null}
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="lh-sheet-footer" src="/letterhead/footer.png" alt="" />
          </div>
        </Scaled>
      ))}
    </>
  );
}

// Shows a 595pt-wide A4 sheet scaled to fit the column.
function Scaled({ children }) {
  const box = useRef(null);
  const inner = useRef(null);
  const [scale, setScale] = useState(1);
  const [h, setH] = useState(0);
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      if (!box.current || !inner.current) return;
      const s = box.current.clientWidth / inner.current.offsetWidth;
      setScale(s);
      setH(inner.current.offsetHeight * s);
    });
    if (box.current) ro.observe(box.current);
    if (inner.current) ro.observe(inner.current);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={box} className="lh-scaled" style={{ height: h || undefined }}>
      <div ref={inner} style={{ transform: `scale(${scale})`, transformOrigin: "0 0", width: "595pt" }}>{children}</div>
    </div>
  );
}


"use client";

import { useState } from "react";
import { blankTargets, normaliseTargets, targetsFileName, newPage, DESIGNS, LABELS, PHOTOS, designById, MAX_PAGES, MAX_POINTS } from "../../../lib/slt/targets";
import { targetsSlides } from "../../../lib/slt/TargetsSlides";
import Scaled from "../Scaled";
import { useSltDoc, downloadPdf } from "../useSltDoc";

const small = { background: "none", border: 0, padding: "2px 4px", color: "var(--muted)", fontSize: 13, cursor: "pointer" };

export default function TargetsEditor() {
  const [d, setD, reset] = useSltDoc("slt-targets", blankTargets, normaliseTargets);
  const [open, setOpen] = useState(0);
  const [adding, setAdding] = useState("skills1");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  if (!d) return null;

  const set = (k, v) => setD((x) => ({ ...x, [k]: v }));
  const setPage = (i, fn) => setD((x) => ({ ...x, pages: x.pages.map((p, j) => (j === i ? fn(p) : p)) }));
  const setField = (i, k, v) => setPage(i, (p) => ({ ...p, [k]: v }));
  const setPoint = (i, n, k, v) => setPage(i, (p) => ({ ...p, points: p.points.map((it, j) => (j === n ? { ...it, [k]: v } : it)) }));
  const move = (i, by) => setD((x) => {
    const pages = [...x.pages];
    const j = i + by;
    if (j < 0 || j >= pages.length) return x;
    [pages[i], pages[j]] = [pages[j], pages[i]];
    setOpen(j);
    return { ...x, pages };
  });
  const duplicate = (i) => setD((x) => {
    if (x.pages.length >= MAX_PAGES) return x;
    const pages = [...x.pages];
    pages.splice(i + 1, 0, JSON.parse(JSON.stringify(x.pages[i])));
    setOpen(i + 1);
    return { ...x, pages };
  });
  const remove = (i) => {
    if (!window.confirm("Remove this page?")) return;
    setD((x) => ({ ...x, pages: x.pages.filter((_, j) => j !== i) }));
    setOpen(-1);
  };
  const add = () => {
    setD((x) => (x.pages.length >= MAX_PAGES ? x : { ...x, pages: [...x.pages, newPage(adding)] }));
    setOpen(d.pages.length);
    setTimeout(() => document.getElementById(`slide-${d.pages.length}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
  };
  // Changing the design keeps everything typed; a new design's photo comes with it.
  const setDesign = (i, id) => setPage(i, (p) => ({ ...p, design: id, photo: p.photo === designById(p.design).photo ? designById(id).photo : p.photo }));

  async function download() {
    setErr("");
    setBusy("Making the PDF…");
    try { await downloadPdf("targets", d, targetsFileName(d)); } catch (e) { setErr(e.message); }
    setBusy("");
  }

  const slides = targetsSlides(d);
  const show = (i) => {
    setOpen(open === i ? -1 : i);
    document.getElementById(`slide-${i}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="editor slt-editor">
      <div className="panel">
        <div className="slt-two">
          <div className="row">
            <label className="label" htmlFor="t-person"><span>Name <span className="opt">(file name)</span></span></label>
            <input id="t-person" className="input" value={d.person} maxLength={60} onChange={(e) => set("person", e.target.value)} />
          </div>
          <div className="row">
            <label className="label" htmlFor="t-period"><span>Dates <span className="opt">(every page)</span></span></label>
            <input id="t-period" className="input" value={d.period} maxLength={60} onChange={(e) => set("period", e.target.value)} />
          </div>
        </div>

        <h3 className="group-title">Pages</h3>
        {d.pages.map((p, i) => {
          const des = designById(p.design);
          const L = LABELS[p.design] || {};
          const f = (k) => des.fields.includes(k);
          return (
            <div key={i} className="slt-card">
              <div className="slt-card-head">
                <button type="button" onClick={() => show(i)} style={{ background: "none", border: 0, padding: 0, font: "inherit", fontWeight: 600, cursor: "pointer", textAlign: "left", flex: 1 }}>
                  {open === i ? "▾" : "▸"} {i + 1}. {slides[i] ? slides[i].label : des.name}
                </button>
                <span style={{ whiteSpace: "nowrap" }}>
                  <button type="button" style={small} title="Move up" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                  <button type="button" style={small} title="Move down" disabled={i === d.pages.length - 1} onClick={() => move(i, 1)}>↓</button>
                  <button type="button" style={small} title="Duplicate" disabled={d.pages.length >= MAX_PAGES} onClick={() => duplicate(i)}>⧉</button>
                  <button type="button" className="slt-x" title="Remove this page" onClick={() => remove(i)}>×</button>
                </span>
              </div>
              {open === i ? (
                <>
                  <div className="row">
                    <label className="label"><span>Design</span></label>
                    <select className="slt-who" value={p.design} onChange={(e) => setDesign(i, e.target.value)}>
                      {DESIGNS.map((x) => <option key={x.id} value={x.id}>{x.name} – {x.desc}</option>)}
                    </select>
                  </div>
                  {f("pill") ? (
                    <div className="row"><label className="label"><span>{L.pill}</span></label>
                      <input className="input" value={p.pill} maxLength={30} onChange={(e) => setField(i, "pill", e.target.value)} /></div>
                  ) : null}
                  {f("title") ? (
                    <div className="row"><label className="label"><span>{L.title}</span></label>
                      <textarea className="input" rows={2} value={p.title} maxLength={120} onChange={(e) => setField(i, "title", e.target.value)} /></div>
                  ) : null}
                  {f("subtitle") ? (
                    <div className="row"><label className="label"><span>{L.subtitle}</span></label>
                      <input className="input" value={p.subtitle} maxLength={120} onChange={(e) => setField(i, "subtitle", e.target.value)} /></div>
                  ) : null}
                  {f("body") ? (
                    <div className="row"><label className="label"><span>{L.body}</span></label>
                      <textarea className="input" rows={p.design === "cover" ? 2 : 4} value={p.body} maxLength={1200} onChange={(e) => setField(i, "body", e.target.value)} /></div>
                  ) : null}
                  {f("points") ? (
                    <>
                      <div className="slt-sub">{L.points}</div>
                      {p.points.map((it, n) => (
                        <div key={n} style={{ marginBottom: 10 }}>
                          <div className="slt-sess" style={{ marginBottom: 4 }}>
                            <input className="input" value={it.h} maxLength={120} placeholder={p.design === "skills1" || p.design === "skills2" ? "Heading" : "Label or heading (optional)"} aria-label="Heading" onChange={(e) => setPoint(i, n, "h", e.target.value)} />
                            <button type="button" className="slt-x" title="Remove" onClick={() => setPage(i, (x) => ({ ...x, points: x.points.filter((_, j) => j !== n) }))}>×</button>
                          </div>
                          <textarea className="input" rows={3} value={it.t} maxLength={1200} placeholder="Text" aria-label="Text" onChange={(e) => setPoint(i, n, "t", e.target.value)} />
                        </div>
                      ))}
                      <button type="button" className="slt-add" disabled={p.points.length >= MAX_POINTS} onClick={() => setPage(i, (x) => ({ ...x, points: [...x.points, { h: "", t: "" }] }))}>+ Add a point</button>
                    </>
                  ) : null}
                  <div className="slt-two" style={{ marginTop: 12 }}>
                    {f("size") ? (
                      <select className="slt-who" value={p.size} aria-label="Text size" onChange={(e) => setField(i, "size", e.target.value)}>
                        <option value="roomy">Larger headings</option>
                        <option value="compact">Smaller headings (fits more)</option>
                      </select>
                    ) : null}
                    {f("photo") ? (
                      <select className="slt-who" value={p.photo} aria-label="Photo" onChange={(e) => setField(i, "photo", e.target.value)}>
                        {PHOTOS.map((x) => <option key={x.id} value={x.id}>Photo: {x.label}</option>)}
                      </select>
                    ) : null}
                  </div>
                </>
              ) : null}
            </div>
          );
        })}

        <div className="slt-card" style={{ background: "#fff" }}>
          <div className="slt-sub" style={{ marginTop: 0 }}>Add a page</div>
          <select className="slt-who" value={adding} onChange={(e) => setAdding(e.target.value)} aria-label="Design for the new page">
            {DESIGNS.map((x) => <option key={x.id} value={x.id}>{x.name} – {x.desc}</option>)}
          </select>
          <div style={{ marginTop: 8 }}>
            <button type="button" className="slt-add" disabled={d.pages.length >= MAX_PAGES} onClick={add}>+ Add this page</button>
          </div>
          <div className="hint" style={{ marginBottom: 0 }}>It starts with the example wording from the template for you to type over.</div>
        </div>
        <div className="hint">Long text gets smaller to fit its slide. Leave a box empty to leave it off.</div>

        <div className="actions" style={{ marginTop: 20 }}>
          <button type="button" className="btn btn-primary" onClick={download} disabled={!!busy || !d.pages.length}>{busy || "Download PDF"}</button>
          <button type="button" className="btn btn-ghost" disabled={!!busy} onClick={() => { if (window.confirm("Clear your changes and go back to the template?")) reset(); }}>Start again</button>
        </div>
        {err ? <p className="hint warn">{err}</p> : null}
      </div>

      <div className="slt-preview">
        {slides.map((s, i) => (
          <div key={s.key} id={`slide-${i}`} onClick={() => setOpen(i)} style={{ cursor: "pointer" }}>
            <p className="slt-cap">{i + 1}. {s.label}{open === i ? " · editing" : ""}</p>
            <Scaled w={1920} h={1080}>{s.el}</Scaled>
          </div>
        ))}
      </div>
    </div>
  );
}

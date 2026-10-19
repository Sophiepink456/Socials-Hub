"use client";

import { useState } from "react";
import { blankTargets, normaliseTargets, targetsFileName, expectHeadingFor, skillsTitleFor, MAX_EXPECTATIONS, MAX_ITEMS, MAX_SECTIONS } from "../../../lib/slt/targets";
import { targetsSlides } from "../../../lib/slt/TargetsSlides";
import Scaled from "../Scaled";
import { useSltDoc, downloadPdf } from "../useSltDoc";

const Field = ({ id, label, children, hint }) => (
  <div className="row">
    <label className="label" htmlFor={id}><span>{label}</span></label>
    {children}
    {hint ? <div className="hint">{hint}</div> : null}
  </div>
);

export default function TargetsEditor() {
  const [d, setD, reset] = useSltDoc("slt-targets", blankTargets, normaliseTargets);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  if (!d) return null;

  const set = (k, v) => setD((x) => ({ ...x, [k]: v }));
  // Changing the role also changes the headings made from it, unless they've been reworded.
  const setRole = (v) => setD((x) => ({
    ...x,
    role: v,
    expectHeading: x.expectHeading === expectHeadingFor(x.role) ? expectHeadingFor(v) : x.expectHeading,
    skillsTitle: x.skillsTitle === skillsTitleFor(x.role) ? skillsTitleFor(v) : x.skillsTitle,
  }));
  const setExp = (i, v) => setD((x) => ({ ...x, expectations: x.expectations.map((e, j) => (j === i ? v : e)) }));
  const setSec = (si, fn) => setD((x) => ({ ...x, sections: x.sections.map((s, j) => (j === si ? fn(s) : s)) }));
  const setItem = (si, pi, ii, k, v) => setSec(si, (s) => ({ ...s, pages: s.pages.map((pg, a) => (a === pi ? pg.map((it, b) => (b === ii ? { ...it, [k]: v } : it)) : pg)) }));
  const moveItem = (si, pi, ii) => setSec(si, (s) => {
    const pages = s.pages.map((pg) => [...pg]);
    while (pages.length < 2) pages.push([]);
    const [it] = pages[pi].splice(ii, 1);
    if (pi === 0) pages[1].unshift(it); else pages[0].push(it);
    return { ...s, pages };
  });

  async function download() {
    setErr("");
    setBusy("Making the PDF…");
    try { await downloadPdf("targets", d, targetsFileName(d)); } catch (e) { setErr(e.message); }
    setBusy("");
  }

  const slides = targetsSlides(d);
  return (
    <div className="editor slt-editor">
      <div className="panel">
        <h3 className="group-title">Title slide</h3>
        <Field id="t-person" label="Name"><input id="t-person" className="input" value={d.person} maxLength={60} onChange={(e) => set("person", e.target.value)} /></Field>
        <Field id="t-role" label="Role they’re working towards"><input id="t-role" className="input" value={d.role} maxLength={50} onChange={(e) => setRole(e.target.value)} /></Field>
        <Field id="t-dur" label="Duration"><input id="t-dur" className="input" value={d.duration} maxLength={60} onChange={(e) => set("duration", e.target.value)} /></Field>
        <Field id="t-period" label="Dates (bottom of every slide)"><input id="t-period" className="input" value={d.period} maxLength={60} onChange={(e) => set("period", e.target.value)} /></Field>
        <Field id="t-title" label="Title"><input id="t-title" className="input" value={d.title} maxLength={40} onChange={(e) => set("title", e.target.value)} /></Field>

        <h3 className="group-title" style={{ marginTop: 24 }}>The Process</h3>
        <Field id="t-obj" label="Objective"><textarea id="t-obj" className="input" rows={4} value={d.objective} maxLength={600} onChange={(e) => set("objective", e.target.value)} /></Field>
        <Field id="t-rev" label="Review process"><textarea id="t-rev" className="input" rows={3} value={d.review} maxLength={400} onChange={(e) => set("review", e.target.value)} /></Field>
        <Field id="t-exph" label="Expectations heading"><input id="t-exph" className="input" value={d.expectHeading} maxLength={80} onChange={(e) => set("expectHeading", e.target.value)} /></Field>
        {d.expectations.map((t, i) => (
          <div key={i} className="slt-sess">
            <textarea className="input" rows={3} value={t} maxLength={500} aria-label={`Expectation ${i + 1}`} onChange={(e) => setExp(i, e.target.value)} />
            <button type="button" className="slt-x" title="Remove" onClick={() => set("expectations", d.expectations.filter((_, j) => j !== i))}>×</button>
          </div>
        ))}
        <button type="button" className="slt-add" disabled={d.expectations.length >= MAX_EXPECTATIONS} onClick={() => set("expectations", [...d.expectations, ""])}>+ Add an expectation</button>

        <h3 className="group-title" style={{ marginTop: 24 }}>Key skills</h3>
        <Field id="t-skills" label="Heading on the photo"><input id="t-skills" className="input" value={d.skillsTitle} maxLength={60} onChange={(e) => set("skillsTitle", e.target.value)} /></Field>
        {d.sections.map((s, si) => (
          <div key={si} className="slt-card">
            <div className="slt-card-head">
              <span>Section {si + 1}</span>
              <button type="button" className="slt-x" title="Remove this section" onClick={() => set("sections", d.sections.filter((_, j) => j !== si))}>×</button>
            </div>
            <div className="slt-two">
              <input className="input" value={s.name} maxLength={30} placeholder="e.g. Operational" aria-label="Section name" onChange={(e) => setSec(si, (x) => ({ ...x, name: e.target.value }))} />
              <select className="slt-who" value={s.style} aria-label="Text size" onChange={(e) => setSec(si, (x) => ({ ...x, style: e.target.value }))}>
                <option value="roomy">Larger headings</option>
                <option value="compact">Smaller headings (fits more)</option>
              </select>
            </div>
            {[0, 1].map((pi) => (
              <div key={pi}>
                <div className="slt-sub">Slide {pi + 1}</div>
                {(s.pages[pi] || []).map((it, ii) => (
                  <div key={ii} style={{ marginBottom: 10 }}>
                    <div className="slt-sess" style={{ marginBottom: 4 }}>
                      <input className="input" value={it.h} maxLength={90} placeholder="Heading" aria-label="Heading" onChange={(e) => setItem(si, pi, ii, "h", e.target.value)} />
                      <button type="button" className="slt-x" title="Remove" onClick={() => setSec(si, (x) => ({ ...x, pages: x.pages.map((pg, a) => (a === pi ? pg.filter((_, b) => b !== ii) : pg)) }))}>×</button>
                    </div>
                    <textarea className="input" rows={4} value={it.t} maxLength={900} placeholder="What it means" aria-label="Description" onChange={(e) => setItem(si, pi, ii, "t", e.target.value)} />
                    <button type="button" className="link" style={{ background: "none", border: 0, padding: 0, color: "var(--green-dark)", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}
                      onClick={() => moveItem(si, pi, ii)}>Move to slide {pi === 0 ? 2 : 1}</button>
                  </div>
                ))}
                <button type="button" className="slt-add" disabled={(s.pages[pi] || []).length >= MAX_ITEMS}
                  onClick={() => setSec(si, (x) => { const pages = [...x.pages]; while (pages.length <= pi) pages.push([]); pages[pi] = [...pages[pi], { h: "", t: "" }]; return { ...x, pages }; })}>+ Add a skill</button>
              </div>
            ))}
          </div>
        ))}
        <button type="button" className="slt-add" disabled={d.sections.length >= MAX_SECTIONS}
          onClick={() => set("sections", [...d.sections, { name: "", style: "roomy", pages: [[{ h: "", t: "" }], []] }])}>+ Add a section</button>
        <div className="hint">Long text gets smaller to fit its slide. A slide with nothing on it is left out.</div>

        <div className="actions" style={{ marginTop: 20 }}>
          <button type="button" className="btn btn-primary" onClick={download} disabled={!!busy}>{busy || "Download PDF"}</button>
          <button type="button" className="btn btn-ghost" disabled={!!busy} onClick={() => { if (window.confirm("Clear your changes and go back to the template?")) reset(); }}>Start again</button>
        </div>
        {err ? <p className="hint warn">{err}</p> : null}
      </div>

      <div className="slt-preview">
        {slides.map((s, i) => (
          <div key={s.key}>
            <p className="slt-cap">{i + 1}. {s.label}</p>
            <Scaled w={1920} h={1080}>{s.el}</Scaled>
          </div>
        ))}
      </div>
    </div>
  );
}

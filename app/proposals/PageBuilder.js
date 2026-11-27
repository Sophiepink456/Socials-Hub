"use client";

// "Add more pages", at the bottom of the proposal and candidate pack forms.
// - Upload a document: its sections become pages in our style, placed where you choose.
// - Or add a page in any of the existing page designs (or a blank one) and edit everything on it,
//   including adding text, bullet points, tables and pictures and dragging them where you want.
// Added pages get page numbers and a line on the Contents page (proposals) automatically.
import { useLayoutEffect, useRef, useState } from "react";
import { EXTRA_STYLES, styleById, defaultsFor } from "../../lib/proposal/extra";
import { PACK_STYLES, packStyle, packStyleDefaults } from "../../lib/candidate/extra";
import { STOCK_PHOTOS } from "../../lib/proposal/data";
import { BLOCK_TYPES, newBlock, newId, pagesFromDoc } from "../../lib/blocks";
import { readImage, limitHit, Count, PhotoFramer } from "./kit";

const MAX_ADDED = 30;

async function uploadImage(file) {
  const dataUrl = await readImage(file, 2400);
  const r = await fetch("/api/proposals/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataUrl }) });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || "Couldn't upload that picture.");
  return j.url;
}

export function PageBuilder({ kind, p, setP, setPage, pages }) {
  const isPack = kind === "pack";
  const STYLES = isPack ? PACK_STYLES : EXTRA_STYLES;
  const getStyle = isPack ? packStyle : styleById;
  const defaults = isPack ? packStyleDefaults : defaultsFor;
  const END = isPack ? "beforeEnd" : "lastSection";
  const headKey = isPack ? "customHeading" : "heading";
  const list = p.extraPages || [];

  const [openId, setOpenId] = useState("");
  const [newStyle, setNewStyle] = useState("custom");
  const [newWhere, setNewWhere] = useState(END);
  const [docWhere, setDocWhere] = useState(END);
  const [docBg, setDocBg] = useState("light");
  const [docState, setDocState] = useState({ busy: false, msg: "" });

  const update = (id, fn) => setP((cur) => ({ ...cur, extraPages: (cur.extraPages || []).map((e) => (e.id === id ? fn(e) : e)) }));
  const key = (e) => `x-${e.id}`;
  // Places a page can go after: any page except the end page.
  const whereOptions = (skip) => pages.filter((pg) => pg.key !== skip && pg.key !== "end");
  const WhereSelect = ({ value, onChange, skip, id }) => (
    <select id={id} className="input" value={value} onChange={(ev) => onChange(ev.target.value)}>
      <option value={END}>Before the end page</option>
      {whereOptions(skip).map((pg) => <option key={pg.key} value={pg.key}>After page {pages.indexOf(pg) + 1}: {pg.label}</option>)}
    </select>
  );

  function addPage() {
    if (list.length >= MAX_ADDED) { alert(`Up to ${MAX_ADDED} added pages.`); return; }
    const st = getStyle(newStyle);
    const e = { id: newId(), style: newStyle, after: newWhere, name: "", desc: "", v: defaults(newStyle, p), photoPos: {}, blocks: [], bg: "light" };
    if (newStyle === "custom") e.blocks = [newBlock("text", 240)];
    if (!isPack && st && newStyle !== "custom") e.name = st.label.replace(/ style.*$/, "");
    setP((cur) => ({ ...cur, extraPages: [...(cur.extraPages || []), e] }));
    setOpenId(e.id);
    setPage(key(e));
  }

  function remove(id) {
    if (!confirm("Remove this added page?")) return;
    setP((cur) => {
      const gone = (cur.extraPages || []).find((e) => e.id === id);
      return { ...cur, extraPages: (cur.extraPages || []).filter((e) => e.id !== id)
        .map((e) => (e.after === `x-${id}` || e.after === id ? { ...e, after: gone ? gone.after : END } : e)) };
    });
  }

  async function fromDocument(file) {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { setDocState({ busy: false, msg: "Please keep documents under 4 MB." }); return; }
    setDocState({ busy: true, msg: "Reading the document and building the pages… this can take up to a minute for a PDF." });
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/letterhead/parse", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Couldn't read that document.");
      const built = pagesFromDoc(j.doc, { maxPages: Math.max(1, MAX_ADDED - list.length) });
      if (!built.length) throw new Error("Couldn't find anything to put on a page in that document.");
      let after = docWhere;
      const fresh = built.map((pg) => {
        const e = { id: newId(), style: "custom", after, name: pg.heading.slice(0, 60), desc: "", v: { [headKey]: pg.heading.slice(0, 60) }, photoPos: {}, blocks: pg.blocks, bg: docBg, fromDoc: file.name };
        after = `x-${e.id}`;
        return e;
      });
      setP((cur) => ({ ...cur, extraPages: [...(cur.extraPages || []), ...fresh] }));
      setPage(key(fresh[0]));
      setOpenId(fresh[0].id);
      setDocState({ busy: false, msg: `Added ${fresh.length} page${fresh.length === 1 ? "" : "s"} from “${file.name}”. Check each one below: change any wording, drag boxes where you want them, or add tables and pictures.` });
    } catch (err) { setDocState({ busy: false, msg: err.message || "Couldn't read that document." }); }
  }

  return (
    <>
      <div className="panel" style={{ padding: 16 }}>
        <h4 className="group-title" style={{ fontSize: 15, marginTop: 0 }}>Build pages from a document</h4>
        <p className="hint" style={{ marginTop: 0 }}>Upload a Word document, PDF or text file. Each main heading starts a new page in our style, with its text, bullet points and tables laid out underneath (long sections carry on over extra pages).</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 240px" }}>
            <label className="label" htmlFor={`${kind}-docwhere`}><span>Where the pages go</span></label>
            <WhereSelect id={`${kind}-docwhere`} value={docWhere} onChange={setDocWhere} />
          </div>
          <div style={{ flex: "0 1 180px" }}>
            <label className="label" htmlFor={`${kind}-docbg`}><span>Background</span></label>
            <select id={`${kind}-docbg`} className="input" value={docBg} onChange={(ev) => setDocBg(ev.target.value)}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
        <div className="actions" style={{ marginTop: 10 }}>
          <label className="btn btn-primary btn-small" style={{ cursor: docState.busy ? "wait" : "pointer" }}>
            {docState.busy ? "Building pages…" : "Upload a document"}
            <input type="file" accept=".docx,.pdf,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" style={{ display: "none" }} disabled={docState.busy}
              onChange={(ev) => { fromDocument(ev.target.files && ev.target.files[0]); ev.target.value = ""; }} />
          </label>
        </div>
        {docState.msg ? <div className="hint">{docState.msg}</div> : null}
      </div>

      <div className="panel" style={{ padding: 16, marginTop: 14 }}>
        <h4 className="group-title" style={{ fontSize: 15, marginTop: 0 }}>Add a page</h4>
        <p className="hint" style={{ marginTop: 0 }}>Start from one of our page designs (it copies that page, and you can change everything on it) or a blank page. You can add text, bullet points, tables and pictures to any added page and drag them into place.</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 240px" }}>
            <label className="label" htmlFor={`${kind}-newstyle`}><span>Page design</span></label>
            <select id={`${kind}-newstyle`} className="input" value={newStyle} onChange={(ev) => setNewStyle(ev.target.value)}>
              {[...STYLES].sort((a, b) => (a.id === "custom" ? -1 : b.id === "custom" ? 1 : 0)).map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div style={{ flex: "1 1 240px" }}>
            <label className="label" htmlFor={`${kind}-newwhere`}><span>Where it goes</span></label>
            <WhereSelect id={`${kind}-newwhere`} value={newWhere} onChange={setNewWhere} />
          </div>
          <button type="button" className="btn btn-primary btn-small" onClick={addPage}>Add page</button>
        </div>
      </div>

      {list.map((e, n) => {
        const st = getStyle(e.style);
        const isOpen = openId === e.id;
        const pg = pages.find((x) => x.key === key(e));
        const pageNo = pg ? pages.indexOf(pg) + 1 : 0;
        return (
          <div key={e.id} className="panel" style={{ padding: 16, marginTop: 14 }}>
            <div className="row" style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 0 }}>
              <button type="button" className="link" style={{ fontWeight: 700, textAlign: "left" }} onClick={() => { setOpenId(isOpen ? "" : e.id); if (st) setPage(key(e)); }}>
                {isOpen ? "–" : "+"} Added page {n + 1}: {(pg && pg.label) || (st ? st.label : "choose a design")}{pageNo ? ` · page ${pageNo} of ${pages.length}` : ""}
              </button>
              <button type="button" className="link muted" onClick={() => remove(e.id)}>Remove</button>
            </div>
            {isOpen && st ? (
              <AddedPage e={e} st={st} p={p} isPack={isPack} STYLES={STYLES} getStyle={getStyle} defaults={defaults} update={update} setPage={setPage}
                pageEl={pg && pg.el} where={<WhereSelect value={e.after || END} skip={key(e)} onChange={(val) => { update(e.id, (x) => ({ ...x, after: val })); setPage(key(e)); }} />} />
            ) : null}
          </div>
        );
      })}
      {list.length ? <p className="hint" style={{ marginTop: 12 }}>Page numbers{isPack ? "" : " and the Contents page"} update automatically. Your added pages are saved with the rest of the form.</p> : null}
    </>
  );
}

function AddedPage({ e, st, p, isPack, STYLES, getStyle, defaults, update, setPage, pageEl, where }) {
  const [busy, setBusy] = useState("");
  const pk = `x-${e.id}`;
  const custom = e.style === "custom";
  const setVal = (f, nv) => {
    if (f.max && typeof nv === "string" && nv.length > f.max) { limitHit(f.label, f.max, nv.length); nv = nv.slice(0, f.max); }
    update(e.id, (x) => ({ ...x, v: { ...x.v, [f.k]: nv } }));
  };
  function chooseStyle(id) {
    if (!confirm("Changing the design starts this page again with that design’s wording. Boxes you added stay. Carry on?")) return;
    const ns = getStyle(id);
    update(e.id, (x) => ({ ...x, style: id, v: defaults(id, p), photoPos: {}, name: !isPack && ns && id !== "custom" ? ns.label.replace(/ style.*$/, "") : x.name }));
    setPage(pk);
  }
  const photos = [...(p.sitePhotos || []).map((ph) => ph.url), ...STOCK_PHOTOS];
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div className="row" style={{ flex: "1 1 220px" }}>
          <label className="label"><span>Page design</span></label>
          <select className="input" value={e.style} onChange={(ev) => chooseStyle(ev.target.value)}>
            {STYLES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        <div className="row" style={{ flex: "1 1 220px" }}>
          <label className="label"><span>Where it goes</span></label>
          {where}
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div className="row" style={{ flex: "1 1 220px" }}>
          <label className="label"><span>{isPack ? "Name on the page tab" : "Name on the Contents page"}</span></label>
          <input className="input" value={e.name || ""} maxLength={60} placeholder={custom ? "Uses the page heading" : st.label} onChange={(ev) => { const v = ev.target.value; update(e.id, (x) => ({ ...x, name: v })); }} />
        </div>
        {!isPack && st.numbered !== false ? (
          <div className="row" style={{ flex: "1 1 220px" }}>
            <label className="label"><span>Line under it on the Contents page</span></label>
            <input className="input" value={e.desc || ""} maxLength={160} placeholder="Optional" onChange={(ev) => { const v = ev.target.value; update(e.id, (x) => ({ ...x, desc: v })); }} />
          </div>
        ) : null}
        {!isPack && st.numbered !== false ? (
          <label className="check" style={{ flex: "1 1 100%" }}>
            <input type="checkbox" checked={e.inContents !== false} onChange={(ev) => { const v = ev.target.checked; update(e.id, (x) => ({ ...x, inContents: v })); }} />
            Show this page on the Contents page
          </label>
        ) : null}
      </div>

      {custom ? (
        <div className="row">
          <label className="label"><span>Background</span></label>
          <div style={{ display: "flex", gap: 8 }}>
            {[["light", "Light"], ["dark", "Dark"]].map(([v, l]) => (
              <button key={v} type="button" className={"btn btn-small " + ((e.bg || "light") === v ? "btn-primary" : "btn-ghost")} onClick={() => { update(e.id, (x) => ({ ...x, bg: v })); setPage(pk); }}>{l}</button>
            ))}
          </div>
        </div>
      ) : null}

      <h4 className="group-title" style={{ fontSize: 15 }}>{custom ? "Heading" : "Words and pictures from the page design"}</h4>
      {st.fields.map((f) => {
        const val = e.v && e.v[f.k] !== undefined ? e.v[f.k] : f.def ? f.def(p) ?? "" : "";
        if (f.kind === "image") {
          const posKey = f.posKey || f.k;
          return (
            <div key={f.k} className="row">
              <label className="label"><span>{f.label}</span></label>
              {val ? <PhotoFramer src={val} slot={{ w: f.w, h: f.h }} pos={(e.photoPos || {})[posKey]}
                onChange={(pos) => { update(e.id, (x) => ({ ...x, photoPos: { ...(x.photoPos || {}), [posKey]: pos } })); setPage(pk); }} /> : <div className="hint">No picture.</div>}
              <div className="actions" style={{ marginTop: 6 }}>
                <label className="btn btn-ghost btn-small" style={{ cursor: "pointer" }}>
                  {busy === f.k ? "Uploading…" : "Upload picture"}
                  <input type="file" accept="image/*" style={{ display: "none" }} disabled={!!busy} onChange={async (ev) => {
                    const file = ev.target.files && ev.target.files[0]; ev.target.value = "";
                    if (!file) return;
                    setBusy(f.k);
                    try { const url = await uploadImage(file); update(e.id, (x) => ({ ...x, v: { ...x.v, [f.k]: url }, photoPos: { ...(x.photoPos || {}), [posKey]: undefined } })); setPage(pk); }
                    catch (err) { alert(err.message); } finally { setBusy(""); }
                  }} />
                </label>
                {photos.length && f.k !== "siteShot" ? (
                  <select className="input" style={{ width: "auto" }} value="" onChange={(ev) => { if (ev.target.value) { setVal(f, ev.target.value); setPage(pk); } }}>
                    <option value="">…or use another photo</option>
                    {(p.sitePhotos || []).map((ph, i) => <option key={ph.url} value={ph.url}>Website photo {i + 1}</option>)}
                    {STOCK_PHOTOS.map((src, i) => <option key={src} value={src}>Our photo {i + 1}</option>)}
                  </select>
                ) : null}
              </div>
            </div>
          );
        }
        return (
          <div key={f.k} className="row">
            <label className="label" htmlFor={`${e.id}-${f.k}`}><span>{f.label}</span>{f.max ? <Count value={val} max={f.max} /> : null}</label>
            {f.kind === "text"
              ? <input id={`${e.id}-${f.k}`} className="input" value={val} spellCheck lang="en-GB" onFocus={() => setPage(pk)} onChange={(ev) => setVal(f, ev.target.value)} />
              : <textarea id={`${e.id}-${f.k}`} className="input" rows={f.kind === "lines" ? 6 : 4} value={val} spellCheck lang="en-GB" onFocus={() => setPage(pk)} onChange={(ev) => setVal(f, ev.target.value)} />}
            {f.kind === "lines" ? <div className="hint">One per line. Start a line with ## and a space for a semibold subheading.</div> : null}
          </div>
        );
      })}
      {e.style === "contact" ? <div className="hint">The consultants and their details come from the Consultant(s) section.</div> : null}

      <h4 className="group-title" style={{ fontSize: 15 }}>{custom ? "Boxes on this page" : "Extra boxes on this page (optional)"}</h4>
      {!custom ? (
        <div className="row">
          <label className="label"><span>Colour of the extra boxes’ text</span></label>
          <div style={{ display: "flex", gap: 8 }}>
            {[["light", "Dark text"], ["dark", "White text"]].map(([v, l]) => (
              <button key={v} type="button" className={"btn btn-small " + ((e.bg || "light") === v ? "btn-primary" : "btn-ghost")} onClick={() => { update(e.id, (x) => ({ ...x, bg: v })); setPage(pk); }}>{l}</button>
            ))}
          </div>
        </div>
      ) : null}
      <BlocksEditor blocks={e.blocks || []} pageEl={pageEl} setPage={() => setPage(pk)}
        onChange={(fn) => update(e.id, (x) => ({ ...x, blocks: typeof fn === "function" ? fn(x.blocks || []) : fn }))} />
    </div>
  );
}

// ---- The boxes: a small copy of the page to drag them on, then each box's content -----------
function BlocksEditor({ blocks, onChange, pageEl, setPage }) {
  const [sel, setSel] = useState("");
  const [busy, setBusy] = useState("");
  const setB = (id, patch) => onChange((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  function add(type) {
    const lowest = blocks.reduce((m, b) => Math.max(m, (b.y || 0) + (b.type === "image" ? b.h || 400 : b.type === "table" ? 60 * (b.rows || []).length : 120)), 200);
    const b = newBlock(type, Math.min(820, lowest + 30));
    onChange((bs) => [...bs, b]);
    setSel(b.id);
    setPage();
  }
  const move = (i, d) => onChange((bs) => { const a = bs.slice(); const j = i + d; if (j < 0 || j >= a.length) return a; [a[i], a[j]] = [a[j], a[i]]; return a; });
  return (
    <>
      {pageEl ? <DragCanvas pageEl={pageEl} blocks={blocks} sel={sel} onSelect={(id) => { setSel(id); setPage(); }} onMove={(id, patch) => setB(id, patch)} /> : null}
      <div className="hint">Drag a box on the picture above to move it. Drag its right edge to make it wider or narrower{blocks.some((b) => b.type === "image") ? ", and a picture’s bottom edge to change its height" : ""}.</div>
      <div className="actions" style={{ marginTop: 8, flexWrap: "wrap" }}>
        {BLOCK_TYPES.map(([t, l]) => <button key={t} type="button" className="btn btn-ghost btn-small" onClick={() => add(t)}>+ {l}</button>)}
      </div>
      {blocks.map((b, i) => {
        const label = (BLOCK_TYPES.find(([t]) => t === b.type) || [, "Box"])[1];
        const on = sel === b.id;
        return (
          <div key={b.id} className="subgroup" style={{ borderLeft: on ? "3px solid #BAE400" : undefined, paddingLeft: on ? 10 : undefined }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <button type="button" className="link" style={{ fontWeight: 700 }} onClick={() => { setSel(on ? "" : b.id); setPage(); }}>{i + 1}. {label}</button>
              <span style={{ display: "flex", gap: 10 }}>
                <button type="button" className="link muted" onClick={() => move(i, -1)} disabled={i === 0} title="Earlier in this list">↑</button>
                <button type="button" className="link muted" onClick={() => move(i, 1)} disabled={i === blocks.length - 1} title="Later in this list">↓</button>
                <button type="button" className="link muted" onClick={() => { const c = { ...JSON.parse(JSON.stringify(b)), id: newId(), y: Math.min(1000, (b.y || 0) + 40) }; onChange((bs) => [...bs, c]); setSel(c.id); }}>Copy</button>
                <button type="button" className="link muted" onClick={() => { if (confirm(`Remove this ${label.toLowerCase()}?`)) onChange((bs) => bs.filter((x) => x.id !== b.id)); }}>Remove</button>
              </span>
            </div>
            {b.type === "heading" ? (
              <input className="input" value={b.text || ""} maxLength={120} onFocus={() => { setSel(b.id); setPage(); }} onChange={(ev) => setB(b.id, { text: ev.target.value })} />
            ) : b.type === "text" ? (
              <>
                <textarea className="input" rows={6} value={b.text || ""} maxLength={3000} spellCheck lang="en-GB" onFocus={() => { setSel(b.id); setPage(); }} onChange={(ev) => setB(b.id, { text: ev.target.value })} />
                <div className="hint">Start a line with “- ” for a bullet point, or “## ” for a semibold subheading. Leave a blank line between paragraphs.</div>
              </>
            ) : b.type === "table" ? (
              <TableEditor b={b} set={(patch) => setB(b.id, patch)} onFocus={() => { setSel(b.id); setPage(); }} />
            ) : b.type === "image" ? (
              <div className="actions" style={{ marginTop: 4 }}>
                <label className="btn btn-ghost btn-small" style={{ cursor: "pointer" }}>
                  {busy === b.id ? "Uploading…" : b.src ? "Change picture" : "Upload picture"}
                  <input type="file" accept="image/*" style={{ display: "none" }} disabled={!!busy} onChange={async (ev) => {
                    const file = ev.target.files && ev.target.files[0]; ev.target.value = "";
                    if (!file) return;
                    setBusy(b.id);
                    try { setB(b.id, { src: await uploadImage(file) }); setPage(); } catch (err) { alert(err.message); } finally { setBusy(""); }
                  }} />
                </label>
              </div>
            ) : null}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 8, fontSize: 13 }}>
              {b.type !== "image" ? (
                <label>Text size{" "}
                  <select className="input" style={{ width: "auto", display: "inline-block", padding: "4px 8px" }} value={b.size || 22} onChange={(ev) => setB(b.id, { size: Number(ev.target.value) })}>
                    {(b.type === "heading" ? [28, 32, 40, 48, 60, 75] : [14, 16, 18, 20, 22, 24, 28]).map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
              ) : null}
              {[["x", "Across", 0, 1800], ["y", "Down", 0, 1040], ["w", "Width", 120, 1920], ...(b.type === "image" ? [["h", "Height", 60, 1000]] : [])].map(([k, l, min, max]) => (
                <label key={k}>{l}{" "}
                  <input type="number" className="input" style={{ width: 80, display: "inline-block", padding: "4px 8px" }} min={min} max={max} step={10} value={Math.round(b[k] || 0)}
                    onChange={(ev) => { const v = Math.max(min, Math.min(max, Number(ev.target.value) || 0)); setB(b.id, { [k]: v }); setPage(); }} />
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}

// Table cells. Pasting rows copied from Excel or Word fills the table from that cell.
function TableEditor({ b, set, onFocus }) {
  const rows = b.rows && b.rows.length ? b.rows : [[""]];
  const cols = Math.max(1, ...rows.map((r) => r.length));
  const norm = (rs) => rs.map((r) => Array.from({ length: Math.max(1, ...rs.map((x) => x.length)) }, (_, j) => r[j] ?? ""));
  const setCell = (i, j, v) => set({ rows: norm(rows.map((r, a) => (a === i ? Array.from({ length: cols }, (_, c) => (c === j ? v : r[c] ?? "")) : r))) });
  function paste(i, j, ev) {
    const t = ev.clipboardData.getData("text");
    if (!/[\t\n]/.test(t)) return;
    ev.preventDefault();
    const grid = t.replace(/\r/g, "").replace(/\n$/, "").split("\n").map((l) => l.split("\t"));
    const out = rows.map((r) => r.slice());
    grid.forEach((gr, a) => gr.forEach((v, c) => {
      while (out.length <= i + a) out.push([]);
      out[i + a][j + c] = v.trim();
    }));
    set({ rows: norm(out).slice(0, 40).map((r) => r.slice(0, 8)) });
  }
  return (
    <div onFocus={onFocus}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {Array.from({ length: cols }, (_, j) => (
                  <td key={j} style={{ padding: 2, minWidth: 90 }}>
                    <input className="input" style={{ padding: "6px 8px", fontWeight: b.header && i === 0 ? 700 : 400 }} value={r[j] ?? ""} onPaste={(ev) => paste(i, j, ev)} onChange={(ev) => setCell(i, j, ev.target.value)} />
                  </td>
                ))}
                <td style={{ width: 24 }}>
                  {rows.length > 1 ? <button type="button" className="link muted" title="Remove this row" onClick={() => set({ rows: rows.filter((_, a) => a !== i) })}>×</button> : null}
                </td>
              </tr>
            ))}
            <tr>
              {Array.from({ length: cols }, (_, j) => (
                <td key={j} style={{ textAlign: "center" }}>
                  {cols > 1 ? <button type="button" className="link muted" title="Remove this column" onClick={() => set({ rows: rows.map((r) => r.filter((_, c) => c !== j)) })}>× column</button> : null}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <div className="actions" style={{ marginTop: 6, flexWrap: "wrap" }}>
        <button type="button" className="btn btn-ghost btn-small" disabled={rows.length >= 40} onClick={() => set({ rows: [...rows, Array.from({ length: cols }, () => "")] })}>+ Row</button>
        <button type="button" className="btn btn-ghost btn-small" disabled={cols >= 8} onClick={() => set({ rows: rows.map((r) => [...Array.from({ length: cols }, (_, c) => r[c] ?? ""), ""]) })}>+ Column</button>
        <label className="check" style={{ marginLeft: 6 }}>
          <input type="checkbox" checked={!!b.header} onChange={(ev) => set({ header: ev.target.checked })} /> First row is a heading row
        </label>
      </div>
      <div className="hint">Tip: copy cells from Excel or Word and paste them into the first box to fill the table in one go.</div>
    </div>
  );
}

// A small copy of the page with a handle over each box. Dragging moves the box on the page itself
// while you drag; the new place is saved when you let go.
function DragCanvas({ pageEl, blocks, sel, onSelect, onMove }) {
  const outer = useRef(null);
  const inner = useRef(null);
  const [w, setW] = useState(560);
  const [rects, setRects] = useState({});
  const s = w / 1920;
  useLayoutEffect(() => {
    const el = outer.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  useLayoutEffect(() => {
    const root = inner.current;
    if (!root) return;
    const base = root.getBoundingClientRect();
    const next = {};
    root.querySelectorAll("[data-block]").forEach((n) => {
      const r = n.getBoundingClientRect();
      next[n.getAttribute("data-block")] = { x: (r.left - base.left) / s, y: (r.top - base.top) / s, w: r.width / s, h: r.height / s };
    });
    setRects((old) => (JSON.stringify(old) === JSON.stringify(next) ? old : next));
  });

  function start(ev, b, mode) {
    ev.preventDefault();
    ev.stopPropagation();
    onSelect(b.id);
    const node = inner.current && inner.current.querySelector(`[data-block="${b.id}"]`);
    const handle = ev.currentTarget.closest("[data-handle]");
    const x0 = ev.clientX, y0 = ev.clientY;
    const orig = { x: b.x || 0, y: b.y || 0, w: b.w || 400, h: b.h || 400 };
    let cur = { ...orig };
    const snap = (v) => Math.round(v / 5) * 5;
    const onMoveEv = (me) => {
      const dx = (me.clientX - x0) / s, dy = (me.clientY - y0) / s;
      if (mode === "move") cur = { ...orig, x: snap(Math.max(0, Math.min(1920 - 60, orig.x + dx))), y: snap(Math.max(0, Math.min(1040, orig.y + dy))) };
      else if (mode === "w") cur = { ...orig, w: snap(Math.max(120, Math.min(1920 - orig.x, orig.w + dx))) };
      else if (mode === "h") cur = { ...orig, h: snap(Math.max(60, Math.min(1000, orig.h + dy))) };
      if (node) {
        node.style.left = `${cur.x}px`; node.style.top = `${cur.y}px`; node.style.width = `${cur.w}px`;
        if (mode === "h") { const img = node.firstElementChild; if (img) img.style.height = `${cur.h}px`; }
      }
      if (handle) {
        const r = rects[b.id] || { x: orig.x, y: orig.y, w: orig.w, h: 60 };
        handle.style.left = `${cur.x}px`; handle.style.top = `${cur.y}px`; handle.style.width = `${cur.w}px`;
        if (mode === "h") handle.style.height = `${cur.h}px`; else handle.style.height = `${r.h}px`;
      }
    };
    const end = () => {
      window.removeEventListener("pointermove", onMoveEv);
      window.removeEventListener("pointerup", end);
      if (cur.x !== orig.x || cur.y !== orig.y || cur.w !== orig.w || cur.h !== orig.h) onMove(b.id, mode === "h" ? { h: cur.h } : mode === "w" ? { w: cur.w } : { x: cur.x, y: cur.y });
    };
    window.addEventListener("pointermove", onMoveEv);
    window.addEventListener("pointerup", end);
  }

  return (
    <div ref={outer} className="pframe" style={{ height: 1080 * s, position: "relative", overflow: "hidden", marginBottom: 6, touchAction: "none" }}>
      <div ref={inner} style={{ width: 1920, height: 1080, transform: `scale(${s})`, transformOrigin: "0 0", position: "absolute", left: 0, top: 0 }}>
        {pageEl}
        {blocks.map((b, i) => {
          const r = rects[b.id];
          if (!r) return null;
          const on = sel === b.id;
          const bw = 2 / s;
          return (
            <div key={b.id} data-handle="" onPointerDown={(ev) => start(ev, b, "move")}
              style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: Math.max(r.h, 30), cursor: "move",
                outline: `${bw}px ${on ? "solid" : "dashed"} ${on ? "#BAE400" : "rgba(80,80,80,.7)"}`, background: on ? "rgba(186,228,0,.08)" : "transparent" }}>
              <span style={{ position: "absolute", left: 0, top: -26 / s, fontSize: 12 / s, padding: `${2 / s}px ${6 / s}px`, background: on ? "#BAE400" : "#555", color: on ? "#161616" : "#fff", borderRadius: 4 / s, lineHeight: 1.2, whiteSpace: "nowrap" }}>{i + 1}</span>
              <span onPointerDown={(ev) => start(ev, b, "w")} title="Drag to change the width"
                style={{ position: "absolute", right: -7 / s, top: "50%", width: 14 / s, height: 34 / s, marginTop: -17 / s, background: "#BAE400", borderRadius: 4 / s, cursor: "ew-resize" }} />
              {b.type === "image" ? (
                <span onPointerDown={(ev) => start(ev, b, "h")} title="Drag to change the height"
                  style={{ position: "absolute", bottom: -7 / s, left: "50%", width: 34 / s, height: 14 / s, marginLeft: -17 / s, background: "#BAE400", borderRadius: 4 / s, cursor: "ns-resize" }} />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

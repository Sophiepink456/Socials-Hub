"use client";

// Form pieces shared by the proposal and candidate pack editors.
import { useEffect, useLayoutEffect, useRef, useState } from "react";

// ---- small helpers -----------------------------------------------------------

export function setIn(obj, path, value) {
  const keys = path.split(".");
  const out = { ...obj };
  let cur = out;
  for (let i = 0; i < keys.length - 1; i++) {
    cur[keys[i]] = Array.isArray(cur[keys[i]]) ? [...cur[keys[i]]] : { ...cur[keys[i]] };
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
  return out;
}
export const getIn = (obj, path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);

// Shrink a picked file to a sensible size so the proposal stays quick to send.
export function readImage(file, maxSide = 2200, type = "image/jpeg") {
  return new Promise((resolve, reject) => {
    if (file.type === "image/svg+xml") {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.round(img.naturalWidth * s);
      c.height = Math.round(img.naturalHeight * s);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL(type, 0.88));
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ---- form fields -------------------------------------------------------------

// Tell the editor a box went over its limit (it shows the popup).
export function limitHit(label, max, tried) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("proposal-limit", { detail: { label, max, tried } }));
}

export function Count({ value, max }) {
  if (!max) return null;
  const n = String(value || "").length;
  return <span className={"count" + (n >= max ? " over" : n > max * 0.9 ? " near" : "")}>{n}/{max}</span>;
}

export function Text({ label, path, p, set, max, page, setPage, placeholder, multiline, rows = 4, hint, optional, type = "text" }) {
  const v = getIn(p, path) || "";
  const common = {
    id: path,
    className: "input",
    value: v,
    placeholder,
    spellCheck: true,
    lang: "en-GB",
    onFocus: () => page && setPage(page),
    onChange: (e) => {
      const val = e.target.value;
      if (max && val.length > max) {
        set(path, val.slice(0, max));
        limitHit(label, max, val.length);
      } else set(path, val);
    },
  };
  return (
    <div className="row">
      <label className="label" htmlFor={path}>
        <span>{label} {optional ? <span className="opt">(optional)</span> : null}</span>
        <Count value={v} max={max} />
      </label>
      {multiline ? <textarea rows={rows} {...common} /> : <input type={type} {...common} />}
      {hint ? <div className="hint">{hint}</div> : null}
    </div>
  );
}

export function Check({ label, path, p, set, page, setPage, hint }) {
  return (
    <div className="row">
      <label className="check">
        <input type="checkbox" checked={!!getIn(p, path)} onChange={(e) => { set(path, e.target.checked); if (page) setPage(page); }} />
        {label}
      </label>
      {hint ? <div className="hint">{hint}</div> : null}
    </div>
  );
}

export function Section({ title, children, open, onToggle, done }) {
  return (
    <section className={"psec" + (open ? " open" : "")}>
      <button type="button" className="psec-head" onClick={onToggle} aria-expanded={open}>
        <span>{title}</span>
        <span className="psec-state">{done ? "✓" : ""} {open ? "–" : "+"}</span>
      </button>
      {open ? <div className="psec-body">{children}</div> : null}
    </section>
  );
}

// Drag a photo around inside its space. It always covers the space, so moving it only changes
// which part of the photo shows; it can't leave a gap.
export function PhotoFramer({ src, slot, pos, onChange }) {
  const box = useRef(null);
  const drag = useRef(null);
  const [nat, setNat] = useState(null);
  const x = pos && pos.x != null ? pos.x : 50;
  const y = pos && pos.y != null ? pos.y : 50;
  // Fit the preview to the space it's in: up to 320 wide and 260 tall, keeping the shape.
  const wrap = useRef(null);
  const [avail, setAvail] = useState(320);
  useEffect(() => {
    const el = wrap.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setAvail(el.clientWidth || 320));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const W = Math.max(80, Math.round(Math.min(avail, 320, (260 * slot.w) / slot.h))), H = Math.round((W * slot.h) / slot.w);
  // How far the photo spills past the frame on each side (in frame pixels).
  let ox = 0, oy = 0;
  if (nat) {
    const k = Math.max(W / nat.w, H / nat.h);
    ox = nat.w * k - W; oy = nat.h * k - H;
  }
  const canX = ox > 1, canY = oy > 1;
  function down(e) {
    if (!canX && !canY) return;
    e.preventDefault();
    drag.current = { sx: e.clientX, sy: e.clientY, x, y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function move(e) {
    const d = drag.current;
    if (!d) return;
    const clamp = (v) => Math.max(0, Math.min(100, v));
    onChange({
      x: canX ? Math.round(clamp(d.x - ((e.clientX - d.sx) / ox) * 100)) : 50,
      y: canY ? Math.round(clamp(d.y - ((e.clientY - d.sy) / oy) * 100)) : 50,
    });
  }
  const up = () => { drag.current = null; };
  return (
    <div ref={wrap} style={{ marginTop: 8 }}>
      <div ref={box} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
        style={{ width: W, height: H, overflow: "hidden", borderRadius: 8, border: "1px solid #ddd", background: "#eee",
          cursor: canX || canY ? (drag.current ? "grabbing" : "grab") : "default", touchAction: "none", userSelect: "none" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" draggable={false} onLoad={(e) => setNat({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${x}% ${y}%`, display: "block", pointerEvents: "none" }} />
      </div>
      <div className="hint">
        {canX || canY ? `Drag the picture to choose which part shows (${canX && canY ? "any direction" : canX ? "left and right" : "up and down"}).` : "This picture fits the space exactly, so there's nothing to move."}
        {pos && (pos.x !== 50 || pos.y !== 50) ? <> <button type="button" className="link" onClick={() => onChange({ x: 50, y: 50 })}>Centre it</button></> : null}
      </div>
    </div>
  );
}

export function ScaledPage({ children }) {
  const box = useRef(null);
  const [w, setW] = useState(640);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  const s = w / 1920;
  return (
    <div ref={box} className="pframe" style={{ height: 1080 * s }}>
      <div style={{ width: 1920, height: 1080, transform: `scale(${s})`, transformOrigin: "0 0" }}>{children}</div>
    </div>
  );
}

// The "Character limit reached" popup. Boxes call limitHit(); this listens and shows it.
export function LimitModal() {
  const [msg, setMsg] = useState(null);
  useEffect(() => {
    const on = (e) => setMsg((cur) => cur || e.detail);
    window.addEventListener("proposal-limit", on);
    return () => window.removeEventListener("proposal-limit", on);
  }, []);
  if (!msg) return null;
  return (
    <div className="modal-back" role="dialog" aria-modal="true" onClick={() => setMsg(null)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {msg.full ? (
          <>
            <h3 style={{ marginTop: 0 }}>This page is full</h3>
            <p>There’s no more room on the <strong>{msg.label}</strong> page, so that last change wasn’t added.</p>
            <p className="hint">Shorten something on that page to make room.</p>
            <div className="actions"><button className="btn btn-primary" type="button" onClick={() => setMsg(null)} autoFocus>OK</button></div>
          </>
        ) : <>
        <h3 style={{ marginTop: 0 }}>Character limit reached</h3>
        <p><strong>{msg.label}</strong> can be up to {msg.max.toLocaleString("en-GB")} characters so it fits on the page.
          {msg.tried > msg.max + 1 ? ` The text was ${msg.tried.toLocaleString("en-GB")} characters, so everything after the limit has been cut off.` : " Anything more won't fit."}</p>
        <p className="hint">Shorten the wording to make room for anything else you want to say.</p>
        <div className="actions"><button className="btn btn-primary" type="button" onClick={() => setMsg(null)} autoFocus>OK</button></div>
        </>}
      </div>
    </div>
  );
}

// "Start from…" picker shared by the proposal and candidate pack forms. Lists saved copies
// (from Settings), candidate packs and proposals; `onPick(data, item)` gets the data already
// turned into the kind being made (`target`: "proposal" or "candidate").
export function StartFrom({ target, onPick }) {
  const [items, setItems] = useState(null);
  const [msg, setMsg] = useState("");
  const [val, setVal] = useState("");
  useEffect(() => {
    fetch("/api/proposals/recent", { cache: "no-store" }).then((r) => r.json()).then((j) => setItems(j.items || [])).catch(() => setItems([]));
  }, []);
  const day = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" }) : "");
  const label = (r) => (r.name ? `${r.name}${r.client ? ` (${r.client} – ${r.role})` : ""}` : `${r.client} – ${r.role}`) + (r.consultant || r.date ? ` · ${[r.consultant, day(r.date)].filter(Boolean).join(", ")}` : "");
  const groups = [
    ["Saved copies", (items || []).filter((r) => r.src === "copy")],
    ["Candidate packs", (items || []).filter((r) => r.src === "rec" && r.kind === "candidate")],
    ["Proposals", (items || []).filter((r) => r.src === "rec" && r.kind === "proposal")],
  ].filter(([, list]) => list.length);
  async function pick(v) {
    setVal(v);
    if (!v) return;
    const item = (items || []).find((r) => `${r.src}:${r.id}` === v);
    if (!item) return;
    setMsg("Copying it in…");
    try {
      const r = await fetch(`/api/proposals/recent?id=${encodeURIComponent(item.id)}&src=${item.src}&for=${target}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setMsg(onPick(j.data, { ...item, from: j.from }) || "Copied in. Change anything you need.");
    } catch (e) { setMsg(e.message || "Couldn’t copy that one."); }
  }
  return (
    <>
      <select className="select" value={val} disabled={items === null} onChange={(e) => pick(e.target.value)}>
        <option value="">{items === null ? "Loading…" : items.length ? "Choose one…" : "Nothing made yet"}</option>
        {groups.map(([g, list]) => (
          <optgroup key={g} label={g}>
            {list.map((r) => <option key={`${r.src}:${r.id}`} value={`${r.src}:${r.id}`}>{label(r)}</option>)}
          </optgroup>
        ))}
      </select>
      {msg ? <div className="hint">{msg}</div> : <div className="hint">Or skip this and fill it in from scratch.</div>}
    </>
  );
}

// A list (points, benefits) typed into one box: each new line is a new bullet.
// Bullets are shown in the box as you type; pasted lists with "-", "*" or "•" are tidied.
const BULLET = "\u2022 ";
const stripBullet = (l) => l.replace(/^\s*(?:[\u2022\u25CF\u25AA\u2013\u2014*\-]|\d+[.)])\s?/, "");
const showLines = (lines) => lines.map((l) => BULLET + l).join("\n");
export function LinesBox({ label, path, p, set, setPage, page, max, each, placeholder, hint }) {
  const ref = useRef(null);
  const caret = useRef(null);
  const list = getIn(p, path) || [];
  const value = list.length && !(list.length === 1 && !list[0]) ? showLines(list) : "";
  const filled = list.filter((b) => String(b).trim()).length;
  useLayoutEffect(() => {
    if (caret.current !== null && ref.current && document.activeElement === ref.current) {
      ref.current.setSelectionRange(caret.current, caret.current);
      caret.current = null;
    }
  });
  function onChange(e) {
    const raw = e.target.value;
    const at = e.target.selectionStart;
    let lines = raw.split("\n").map(stripBullet);
    if (lines.length > max) {
      limitHit(`${label} (one per line)`, max, lines.length);
      lines = lines.slice(0, max);
    }
    const long = lines.findIndex((l) => l.length > each);
    if (long >= 0) {
      limitHit(`${placeholder} ${long + 1}`, each, lines[long].length);
      lines = lines.map((l) => l.slice(0, each));
    }
    // Keep the cursor where it was once the bullets are added back.
    const before = raw.slice(0, at).split("\n").map(stripBullet);
    const pos = showLines(before).length;
    caret.current = Math.min(pos, showLines(lines).length);
    set(path, raw.trim() === "" ? [""] : lines);
  }
  return (
    <div className="row">
      <label className="label"><span>{label}</span><span className="count">{filled}/{max}</span></label>
      <textarea ref={ref} className="input" rows={Math.min(14, Math.max(5, list.length + 1))} value={value} spellCheck lang="en-GB" onFocus={() => setPage(page)}
        placeholder={`${BULLET}${placeholder} one\n${BULLET}Press Enter for the next one`} onChange={onChange} />
      <div className="hint">Press Enter to start a new bullet point. Up to {max}, {each} characters each.{hint ? " " + hint : ""}</div>
    </div>
  );
}

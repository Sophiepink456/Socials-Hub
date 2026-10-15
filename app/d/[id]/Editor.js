"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getDesign, slideCount, photoSlides, visibleFields } from "../../../lib/designs";
import { randomPhoto, HEADSHOTS } from "../../../lib/photos";
import { fileName } from "../../../lib/text";

export default function Editor({ id }) {
  const design = getDesign(id);
  const set_ = design.photoSet || design.id;
  // Fields with a default (e.g. Colour) start filled in.
  const [values, setValues] = useState(() =>
    Object.fromEntries(design.fields.filter((f) => f.default).map((f) => [f.key, f.default])));
  const count = slideCount(design, values);
  const multi = count > 1;
  const withPhoto = photoSlides(design, values);
  // One photo per photo slide, keyed by slide number.
  const [photos, setPhotos] = useState({});
  const [slide, setSlide] = useState(0);
  const [src, setSrc] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState("");
  const timer = useRef(null);

  // Pick photos once the division is known, and re-pick if the division
  // moves to a different photo set (e.g. Leadership & Executive). Carousels
  // with several photo slides get a different photo on each.
  const photoKey = withPhoto.join(",");
  useEffect(() => {
    if (!design.photo) return;
    const folder = (x) => x.split("/").slice(0, -1).join("/");
    setPhotos((cur) => {
      const next = {};
      const used = [];
      for (const n of photoKey.split(",").map(Number)) {
        let p = cur[n];
        const fresh = pick(set_, values.division, used);
        if (!p || folder(p) !== folder(fresh)) p = fresh;
        next[n] = p;
        used.push(p);
      }
      return next;
    });
  }, [design, set_, values.division, photoKey]);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(values)) if (v !== "" && v != null) p.set(k, v);
    return p.toString();
  }, [values]);

  const urlFor = (n) =>
    `/api/render/${design.id}?${query}${multi ? `&slide=${n}` : ""}${photos[n] ? `&photo=${encodeURIComponent(photos[n])}` : ""}`;

  // Keep the open slide in range when the number of slides drops.
  useEffect(() => { if (slide > count - 1) setSlide(count - 1); }, [slide, count]);

  // Debounced live preview of the slide being worked on.
  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setLoading(true);
      setSrc(urlFor(slide));
    }, 350);
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design.id, query, slide, photos]);

  const set = (k, v) => setValues((s) => ({ ...s, [k]: v }));

  // Shuffle the photo on the open slide; on a slide without one, shuffle them all.
  function shuffle() {
    const own = withPhoto.includes(slide);
    if (!own && withPhoto.length === 1) setSlide(withPhoto[0]);
    setPhotos((cur) => {
      const next = { ...cur };
      const targets = own ? [slide] : withPhoto;
      for (const n of targets) {
        const others = withPhoto.filter((m) => m !== n).map((m) => next[m]);
        next[n] = pick(set_, values.division, [...others, cur[n]]);
      }
      return next;
    });
  }
  const focusField = (f) => { if (multi && typeof f.slide === "number") setSlide(f.slide); };

  function save(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  async function downloadPng() {
    setBusy("Preparing…");
    try {
      const res = await fetch(urlFor(0));
      if (!res.ok) throw new Error("render failed");
      save(await res.blob(), fileName(values.title || design.title, "png"));
    } catch {
      alert("Sorry, that didn't download. Try again in a moment.");
    } finally {
      setBusy("");
    }
  }

  // Carousels download as one PDF, one slide per page, ready for a LinkedIn
  // document post. Slides are turned into high-quality JPEGs first so the
  // file stays small enough to upload.
  async function downloadPdf() {
    try {
      const { PDFDocument } = await import("pdf-lib");
      const pdf = await PDFDocument.create();
      for (let n = 0; n < count; n++) {
        setBusy(`Slide ${n + 1} of ${count}…`);
        const res = await fetch(urlFor(n));
        if (!res.ok) throw new Error("render failed");
        const jpg = await toJpeg(await res.blob());
        const img = await pdf.embedJpg(jpg);
        const page = pdf.addPage([design.width, design.height]);
        page.drawImage(img, { x: 0, y: 0, width: design.width, height: design.height });
      }
      setBusy("Saving…");
      const bytes = await pdf.save();
      save(new Blob([bytes], { type: "application/pdf" }), fileName(values.title || design.title, "pdf"));
    } catch {
      alert("Sorry, that didn't download. Try again in a moment.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="editor">
      <div className="panel">
        {visibleFields(design, values).map((f) =>
          f.type === "heading" ? (
            <h3 key={f.key} className="group-title" onClick={() => focusField(f)}>{f.label}</h3>
          ) : (
            <Field key={f.key} f={f} values={values} set={set} onFocus={() => focusField(f)} />
          ))}

        <div className="actions">
          {design.photo ? (
            <button type="button" className="btn btn-ghost" onClick={shuffle}>
              {withPhoto.length > 1 ? (withPhoto.includes(slide) ? `Shuffle photo (slide ${slide + 1})` : "Shuffle photos") : "Shuffle photo"}
            </button>
          ) : null}
          <button type="button" className="btn btn-primary" onClick={multi ? downloadPdf : downloadPng} disabled={!!busy}>
            {busy || (multi ? "Download PDF" : "Download PNG")}
          </button>
        </div>
      </div>

      <div className="preview">
        {multi ? (
          <div className="tabs" role="tablist" aria-label="Slides">
            {Array.from({ length: count }).map((_, n) => (
              <button key={n} type="button" role="tab" aria-selected={slide === n}
                className={"tab" + (slide === n ? " on" : "")} onClick={() => setSlide(n)}>
                Slide {n + 1}
              </button>
            ))}
          </div>
        ) : null}
        <div className={"preview-frame" + (loading ? " loading" : "")}>
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={`Preview, slide ${slide + 1}`} onLoad={() => setLoading(false)} onError={() => setLoading(false)} />
          ) : null}
        </div>
        <div className="preview-note">
          1080 × 1350 · LinkedIn portrait{multi ? ` · ${count} slides, downloads as one PDF` : ""}
        </div>
      </div>
    </div>
  );
}

// A random photo, avoiding the ones already in use where the pool allows.
function pick(set, division, avoid) {
  for (let i = 0; i < 12; i++) {
    const p = randomPhoto(set, division);
    if (!avoid.includes(p)) return p;
  }
  return randomPhoto(set, division);
}

function toJpeg(blob) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      c.getContext("2d").drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      c.toBlob((b) => (b ? b.arrayBuffer().then(resolve, reject) : reject(new Error("jpeg"))), "image/jpeg", 0.92);
    };
    img.onerror = reject;
    img.src = url;
  });
}

function Field({ f, values, set, onFocus }) {
  const v = values[f.key] || "";
  const disabled = f.toggle && values[f.toggle.key] === "1";
  let count = null;
  if (f.maxLines) {
    const ls = v.split(/\r?\n/).filter((l) => l.trim());
    const long = ls.some((l) => l.length > f.max);
    count = { text: `${ls.length}/${f.maxLines} points`, over: ls.length > f.maxLines || long };
  } else if (f.max && f.type !== "select" && f.type !== "consultant") {
    count = { text: `${v.length}/${f.max}`, over: v.length > f.max };
  }
  return (
    <div className="row">
      <label className="label" htmlFor={f.key}>
        <span>{f.label} {f.optional ? <span className="opt">(optional)</span> : null}</span>
        {count ? <span className={"count" + (count.over ? " over" : "")}>{count.text}</span> : null}
      </label>

      {f.type === "select" || f.type === "consultant" ? (
        <select id={f.key} className="select" value={v} onFocus={onFocus} onChange={(e) => set(f.key, e.target.value)}>
          {f.default ? null : <option value="">{f.placeholder || "Select"}</option>}
          {(f.type === "consultant" ? HEADSHOTS.map((h) => h.name) : f.options).map((o) => (<option key={o} value={o}>{o}</option>))}
        </select>
      ) : f.type === "textarea" ? (
        <textarea id={f.key} className="input" rows={f.rows || 4} value={v} placeholder={f.placeholder}
          onFocus={onFocus} onChange={(e) => set(f.key, e.target.value)} />
      ) : (
        <input id={f.key} className="input" value={disabled ? "" : v} placeholder={disabled ? "£Competitive" : f.placeholder}
          disabled={disabled} onFocus={onFocus} onChange={(e) => set(f.key, e.target.value)} />
      )}

      {f.hint ? <div className="hint">{f.hint}</div> : null}
      {count && count.over && f.maxLines ? <div className="hint warn">Keep to {f.maxLines} points of up to {f.max} characters so it fits.</div> : null}

      {f.toggle ? (
        <label className="check">
          <input type="checkbox" checked={values[f.toggle.key] === "1"}
            onChange={(e) => set(f.toggle.key, e.target.checked ? "1" : "")} />
          {f.toggle.label}
        </label>
      ) : null}
    </div>
  );
}

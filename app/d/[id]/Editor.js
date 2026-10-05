"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getDesign } from "../../../lib/designs";
import { randomPhoto } from "../../../lib/photos";
import { fileName } from "../../../lib/text";

export default function Editor({ id }) {
  const design = getDesign(id);
  const [values, setValues] = useState({});
  const [photo, setPhoto] = useState("");
  const [src, setSrc] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const timer = useRef(null);

  // Pick a photo once the division is known, and re-pick if the division
  // moves to a different photo set (e.g. Leadership & Executive).
  useEffect(() => {
    if (!design.photo) return;
    setPhoto((p) => {
      const fresh = randomPhoto(design.id, values.division);
      if (!p) return fresh;
      const sameFolder = p.split("/").slice(0, -1).join("/") === fresh.split("/").slice(0, -1).join("/");
      return sameFolder ? p : fresh;
    });
  }, [design, values.division]);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(values)) if (v !== "" && v != null) p.set(k, v);
    if (photo) p.set("photo", photo);
    return p.toString();
  }, [values, photo]);

  // Debounced live preview.
  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setLoading(true);
      setSrc(`/api/render/${design.id}?${query}`);
    }, 350);
    return () => clearTimeout(timer.current);
  }, [design.id, query]);

  const set = (k, v) => setValues((s) => ({ ...s, [k]: v }));

  async function download() {
    setBusy(true);
    try {
      const res = await fetch(`/api/render/${design.id}?${query}`);
      if (!res.ok) throw new Error("render failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName(values.title || design.title, "png");
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      alert("Sorry, that didn't download. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="editor">
      <div className="panel">
        {design.fields.map((f) => (
          <Field key={f.key} f={f} values={values} set={set} />
        ))}

        <div className="actions">
          {design.photo ? (
            <button type="button" className="btn btn-ghost"
              onClick={() => setPhoto((p) => randomPhoto(design.id, values.division, p))}>
              Shuffle photo
            </button>
          ) : null}
          <button type="button" className="btn btn-primary" onClick={download} disabled={busy}>
            {busy ? "Preparing…" : "Download PNG"}
          </button>
        </div>
      </div>

      <div className="preview">
        <div className={"preview-frame" + (loading ? " loading" : "")}>
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="Preview" onLoad={() => setLoading(false)} onError={() => setLoading(false)} />
          ) : null}
        </div>
        <div className="preview-note">1080 × 1350 · LinkedIn portrait</div>
      </div>
    </div>
  );
}

function Field({ f, values, set }) {
  const v = values[f.key] || "";
  const disabled = f.toggle && values[f.toggle.key] === "1";
  const over = f.max && v.length > f.max;
  return (
    <div className="row">
      <label className="label" htmlFor={f.key}>
        <span>{f.label} {f.optional ? <span className="opt">(optional)</span> : null}</span>
        {f.max && f.type !== "select" ? (
          <span className={"count" + (over ? " over" : "")}>{v.length}/{f.max}</span>
        ) : null}
      </label>

      {f.type === "select" ? (
        <select id={f.key} className="select" value={v} onChange={(e) => set(f.key, e.target.value)}>
          <option value="">{f.placeholder || "Select"}</option>
          {f.options.map((o) => (<option key={o} value={o}>{o}</option>))}
        </select>
      ) : f.type === "textarea" ? (
        <textarea id={f.key} className="input" rows={f.rows || 4} value={v} placeholder={f.placeholder}
          onChange={(e) => set(f.key, e.target.value)} />
      ) : (
        <input id={f.key} className="input" value={disabled ? "" : v} placeholder={disabled ? "£Competitive" : f.placeholder}
          disabled={disabled} onChange={(e) => set(f.key, e.target.value)} />
      )}

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

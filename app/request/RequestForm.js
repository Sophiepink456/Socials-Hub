"use client";

// The Marketing Request Form. Same questions as the monday.com Creative Request Form; the answers
// go straight onto the Marketing & Design WIP board (app/api/request).
import { useEffect, useState } from "react";
import { BRANDS, REQUESTS, MAX_REQUESTS, MAX_FILES, MAX_FILE_MB } from "../../lib/request";

const blank = () => ({ name: "", email: "", deadline: "", brand: [], client: "", requesting: [], content: "" });
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const pretty = (d) => d.toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

// Photos over the size limit are shrunk; other files have to fit as they are.
async function prepare(file) {
  const limit = MAX_FILE_MB * 1024 * 1024;
  if (file.size <= limit) return file;
  if (/^image\/(jpeg|png|webp)$/.test(file.type)) {
    const blob = await new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, 3000 / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement("canvas");
        c.width = Math.round(img.naturalWidth * s);
        c.height = Math.round(img.naturalHeight * s);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob((b) => (b ? resolve(b) : reject(new Error("shrink failed"))), "image/jpeg", 0.85);
      };
      img.onerror = reject;
      img.src = url;
    });
    if (blob.size <= limit) return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  }
  throw new Error(`${file.name} is over ${MAX_FILE_MB} MB. Please make it smaller, or put a link to it under Content required.`);
}

export default function RequestForm() {
  const [f, setF] = useState(blank());
  const [files, setFiles] = useState([]);
  const [now, setNow] = useState(null);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [done, setDone] = useState(null);

  useEffect(() => {
    setNow(new Date());
    try {
      const me = JSON.parse(localStorage.getItem("hub-submitter") || "null");
      if (me) setF((x) => ({ ...x, name: me.name || "", email: me.email || "" }));
    } catch {}
  }, []);

  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const toggle = (k, v, max) => setF((x) => {
    const on = x[k].includes(v);
    if (!on && max && x[k].length >= max) return x;
    return { ...x, [k]: on ? x[k].filter((y) => y !== v) : [...x[k], v] };
  });
  const pm = now && now.getHours() >= 12;

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (!f.requesting.length) { setErr("Please choose what you’re requesting."); return; }
    let ready = [];
    try { ready = await Promise.all(files.map(prepare)); } catch (x) { setErr(x.message); return; }
    setBusy("Sending your request…");
    try {
      const r = await fetch("/api/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Couldn’t send your request.");
      try { localStorage.setItem("hub-submitter", JSON.stringify({ name: f.name, email: f.email })); } catch {}
      const failed = [];
      for (let i = 0; i < ready.length; i++) {
        setBusy(`Attaching file ${i + 1} of ${ready.length}…`);
        const fd = new FormData();
        fd.append("item", j.id);
        fd.append("ticket", j.ticket);
        fd.append("file", ready[i], ready[i].name);
        const u = await fetch("/api/request/file", { method: "POST", body: fd });
        if (!u.ok) failed.push(ready[i].name);
      }
      setDone({ failed });
      setF((x) => ({ ...blank(), name: x.name, email: x.email }));
      setFiles([]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (x) {
      setErr(x.message);
    }
    setBusy("");
  }

  if (done) {
    return (
      <div className="panel">
        <h3 className="group-title" style={{ marginTop: 0, paddingTop: 0, borderTop: 0 }}>Thank you – your request is in.</h3>
        <p style={{ marginTop: 0 }}>Your design request has now been submitted. If you have any queries in the meantime please contact Sophie, Shea or Molly direct.</p>
        {done.failed.length ? <p className="hint warn">These files didn’t attach, so please email them to the marketing team: {done.failed.join(", ")}</p> : null}
        <div className="actions">
          <button type="button" className="btn btn-primary" onClick={() => { setDone(null); setNow(new Date()); }}>Make another request</button>
          <a className="btn btn-ghost" href="/">Back to the hub</a>
        </div>
      </div>
    );
  }

  return (
    <form className="panel req-form" onSubmit={submit}>
      <div className="slt-two req-two">
        <div className="row">
          <label className="label" htmlFor="r-name"><span>Name *</span></label>
          <input id="r-name" className="input" value={f.name} maxLength={120} required onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="row">
          <label className="label" htmlFor="r-email"><span>Email *</span></label>
          <input id="r-email" type="email" className="input" value={f.email} maxLength={160} required onChange={(e) => set("email", e.target.value)} />
        </div>
      </div>

      <div className="slt-two req-two">
        <div className="row">
          <label className="label"><span>Today’s date</span></label>
          <div className="input" style={{ background: "#f4f5f2", color: "var(--muted)" }}>{now ? pretty(now) : "…"}</div>
        </div>
        <div className="row">
          <label className="label" htmlFor="r-deadline"><span>Deadline *</span></label>
          <input id="r-deadline" type="date" className="input" value={f.deadline} min={today()} required onChange={(e) => set("deadline", e.target.value)} />
        </div>
      </div>
      <div className="hint" style={{ marginTop: -10, marginBottom: 18 }}>
        Please select the deadline for the request. <strong>Ad requests made in the PM will be completed the following day.</strong>
        {pm ? " (It’s the afternoon now.)" : ""}
      </div>

      <div className="row">
        <label className="label"><span>Brand <span className="opt">(choose any that apply)</span></span></label>
        <div className="req-checks">
          {BRANDS.map((b) => (
            <label key={b} className={"req-check" + (f.brand.includes(b) ? " on" : "")}>
              <input type="checkbox" checked={f.brand.includes(b)} onChange={() => toggle("brand", b)} /> {b}
            </label>
          ))}
        </div>
      </div>

      <div className="row">
        <label className="label" htmlFor="r-client"><span>Client <span className="opt">(optional)</span></span></label>
        <input id="r-client" className="input" value={f.client} maxLength={300} placeholder="If it’s for a client, their name and website" onChange={(e) => set("client", e.target.value)} />
      </div>

      <div className="row">
        <label className="label"><span>What are you requesting? *</span><span className="opt">{f.requesting.length}/{MAX_REQUESTS}</span></label>
        <div className="hint" style={{ marginTop: 0 }}><strong>Please only request one thing at once</strong> (two at most).</div>
        <div className="req-checks">
          {REQUESTS.map((x) => {
            const on = f.requesting.includes(x);
            const full = !on && f.requesting.length >= MAX_REQUESTS;
            return (
              <label key={x} className={"req-check" + (on ? " on" : "") + (full ? " off" : "")}>
                <input type="checkbox" checked={on} disabled={full} onChange={() => toggle("requesting", x, MAX_REQUESTS)} /> {x}
              </label>
            );
          })}
        </div>
      </div>

      <div className="row">
        <label className="label" htmlFor="r-content"><span>Content required *</span></label>
        <textarea id="r-content" className="input" rows={7} value={f.content} maxLength={8000} required
          placeholder="Everything the design needs: wording, job details, links, sizes, where it’s going, any specific instructions or extra notes."
          onChange={(e) => set("content", e.target.value)} />
      </div>

      <div className="row">
        <label className="label"><span>Upload files <span className="opt">(up to {MAX_FILES})</span></span></label>
        <label className="slt-add" style={{ display: "inline-block", cursor: files.length >= MAX_FILES ? "not-allowed" : "pointer", opacity: files.length >= MAX_FILES ? 0.5 : 1 }}>
          <input type="file" multiple hidden disabled={files.length >= MAX_FILES}
            onChange={(e) => { const add = Array.from(e.target.files || []); setFiles((x) => [...x, ...add].slice(0, MAX_FILES)); e.target.value = ""; }} />
          + Add files
        </label>
        {files.map((x, i) => (
          <div key={i} className="req-file">
            <span>📎 {x.name} <span className="opt">({(x.size / 1048576).toFixed(1)} MB)</span></span>
            <button type="button" className="slt-x" title="Remove" onClick={() => setFiles((y) => y.filter((_, j) => j !== i))}>×</button>
          </div>
        ))}
        <div className="hint">Each file up to {MAX_FILE_MB} MB (big photos are shrunk for you). For anything larger, put a link under Content required.</div>
      </div>

      {err ? <p className="hint warn">{err}{/connected to monday/.test(err) ? <> For now please use the <a href="https://wkf.ms/40FLbHD" target="_blank" rel="noopener noreferrer">monday.com form</a> instead.</> : null}</p> : null}
      <div className="actions">
        <button type="submit" className="btn btn-primary" disabled={!!busy}>{busy || "Submit Request"}</button>
      </div>
    </form>
  );
}

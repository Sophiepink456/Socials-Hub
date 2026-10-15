"use client";

// Saved designs: a folder for each person with their signed-off proposals and candidate packs
// and the social designs they've downloaded.
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { HEADSHOTS } from "../../lib/photos";
import { buildSocialFile, saveBlob } from "../../lib/socialFiles";
import { fileName } from "../../lib/text";

const day = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
const headshot = (name) => {
  const n = String(name || "").trim().toLowerCase();
  const h = HEADSHOTS.find((x) => x.name.toLowerCase() === n);
  return h ? h.path : "";
};

export default function Library() {
  const person = useSearchParams().get("person");
  return person ? <Folder slug={person} /> : <People />;
}

function People() {
  const [people, setPeople] = useState(null);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  useEffect(() => {
    fetch("/api/library", { cache: "no-store" }).then((r) => r.json()).then((j) => { if (j.error) setErr(j.error); setPeople(j.people || []); })
      .catch(() => { setErr("Couldn't open the saved designs."); setPeople([]); });
  }, []);
  const shown = (people || []).filter((p) => !q.trim() || p.name.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <>
      <a href="/" className="back">← Marketing Hub</a>
      <h1 className="h1">Saved designs<span className="g">.</span></h1>
      <p className="lede">A folder for each person: their proposals and candidate packs once they’ve been signed off, and every social design they’ve downloaded.</p>
      {err ? <p className="hint warn">{err}</p> : null}
      {people === null ? <p className="hint">Opening the folders…</p> : null}
      {people && people.length > 8 ? <input className="input" placeholder="Find a person" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 320, marginBottom: 24 }} /> : null}
      {people && !people.length && !err ? <p className="hint">Nothing saved yet. Social designs are saved here when they’re downloaded, and proposals and candidate packs once they’re sent back to the consultant.</p> : null}
      <div className="people-grid">
        {shown.map((p) => {
          const hs = headshot(p.name);
          return (
            <a key={p.slug} href={`/saved?person=${encodeURIComponent(p.slug)}`} className="person-card">
              <span className="person-pic">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {hs ? <img src={hs} alt="" /> : <FolderIcon />}
              </span>
              <span>
                <span className="person-name">{p.name}</span>
                <span className="card-meta" style={{ display: "block", marginTop: 4 }}>
                  {[p.proposals && plural(p.proposals, "proposal"), p.packs && plural(p.packs, "candidate pack"), p.socials && plural(p.socials, "social design")].filter(Boolean).join(" · ") || "Empty"}
                </span>
              </span>
            </a>
          );
        })}
      </div>
    </>
  );
}

function Folder({ slug }) {
  const [f, setF] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState({});
  useEffect(() => {
    fetch(`/api/library?person=${encodeURIComponent(slug)}`, { cache: "no-store" }).then((r) => r.json()).then((j) => { if (j.error) setErr(j.error); else setF(j); })
      .catch(() => setErr("Couldn't open this folder."));
  }, [slug]);

  async function download(s) {
    try {
      const blob = await buildSocialFile(s.urls, s, (m) => setBusy((b) => ({ ...b, [s.id]: m })));
      saveBlob(blob, fileName(s.title || s.designTitle, s.format));
    } catch { alert("Sorry, that didn't download. Try again in a moment."); }
    setBusy((b) => ({ ...b, [s.id]: "" }));
  }
  async function remove(s) {
    if (!confirm(`Take “${s.title || s.designTitle}” out of this folder?`)) return;
    const r = await fetch(`/api/library?person=${encodeURIComponent(slug)}&id=${s.id}`, { method: "DELETE" });
    if (r.ok) setF((cur) => ({ ...cur, socials: cur.socials.filter((x) => x.id !== s.id) }));
    else alert("Couldn't take it out. Try again in a moment.");
  }

  const docs = (list, word) => (
    <>
      <h2 className="section-title">{word}<span className="g">.</span></h2>
      {list.length ? (
        <table className="table">
          <thead><tr><th>Client – role</th><th>Signed off</th><th></th></tr></thead>
          <tbody>
            {list.map((d) => (
              <tr key={d.id}>
                <td>{d.title}</td>
                <td>{day(d.date)}</td>
                <td style={{ textAlign: "right" }}><a href={d.pdf} target="_blank" rel="noreferrer">Open PDF</a> · <a href={d.pdf} download={d.pdfName || true}>Download</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : <p className="hint">None signed off yet.</p>}
    </>
  );

  return (
    <>
      <a href="/saved" className="back">← All folders</a>
      <h1 className="h1">{f ? f.name : "Folder"}<span className="g">.</span></h1>
      <p className="lede">Proposals and candidate packs appear here once they’ve been sent back signed off. Social designs are saved each time one is downloaded.</p>
      {err ? <p className="hint warn">{err}</p> : null}
      {!f && !err ? <p className="hint">Opening…</p> : null}
      {f ? (
        <>
          {docs(f.proposals, "Proposals")}
          {docs(f.packs, "Candidate packs")}
          <h2 className="section-title">Social designs<span className="g">.</span></h2>
          {f.socials.length ? (
            <div className="grid">
              {f.socials.map((s) => (
                <div key={s.id} className="card" style={{ cursor: "default" }}>
                  <h3 className="card-title">{s.title || s.designTitle}</h3>
                  <div className="card-img" style={{ aspectRatio: `${s.width} / ${s.height}` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.urls[0]} alt="" loading="lazy" />
                  </div>
                  <div className="card-meta">{s.designTitle}{s.urls.length > 1 ? ` · ${s.urls.length} slides` : ""} · {day(s.createdAt)}</div>
                  <div className="actions" style={{ marginTop: 10 }}>
                    <button type="button" className="btn btn-ghost btn-small" onClick={() => download(s)} disabled={!!busy[s.id]}>{busy[s.id] || (s.format === "pdf" ? "Download PDF" : "Download PNG")}</button>
                    <button type="button" className="link muted" onClick={() => remove(s)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="hint">No social designs saved yet.</p>}
        </>
      ) : null}
    </>
  );
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round">
      <path d="M5 13a3 3 0 0 1 3-3h10l4 5h18a3 3 0 0 1 3 3v19a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V13Z" />
      <path d="M5 20h38" />
    </svg>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { proposalPages } from "../../lib/proposal/pages";
import {
  APPROACH, CONSULTANTS, LIMITS, PHOTO_SLOTS, STOCK_PHOTOS, blankProposal, emailFor, normalise,
} from "../../lib/proposal/data";

const DRAFT_KEY = "proposal-draft-v1";

// ---- small helpers -----------------------------------------------------------

function setIn(obj, path, value) {
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
const getIn = (obj, path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);

// Shrink a picked file to a sensible size so the proposal stays quick to send.
function readImage(file, maxSide = 2200, type = "image/jpeg") {
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

function Count({ value, max }) {
  if (!max) return null;
  const n = String(value || "").length;
  return <span className={"count" + (n >= max ? " over" : n > max * 0.9 ? " near" : "")}>{n}/{max}</span>;
}

function Text({ label, path, p, set, max, page, setPage, placeholder, multiline, rows = 4, hint, optional, type = "text" }) {
  const v = getIn(p, path) || "";
  const common = {
    id: path,
    className: "input",
    value: v,
    placeholder,
    maxLength: max || undefined,
    spellCheck: true,
    lang: "en-GB",
    onFocus: () => page && setPage(page),
    onChange: (e) => set(path, max ? e.target.value.slice(0, max) : e.target.value),
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

function Check({ label, path, p, set, page, setPage, hint }) {
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

function Section({ title, children, open, onToggle, done }) {
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

// ---- the editor --------------------------------------------------------------

export default function ProposalEditor() {
  const [p, setP] = useState(() => blankProposal());
  const [page, setPage] = useState("title");
  const [open, setOpen] = useState("client");
  const [busy, setBusy] = useState("");
  const loaded = useRef(false);

  // Keep a draft in this browser so nothing is lost on refresh.
  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
      if (d) setP(normalise(d));
    } catch {}
    loaded.current = true;
  }, []);
  useEffect(() => {
    if (!loaded.current) return;
    const t = setTimeout(() => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(p)); } catch {} }, 400);
    return () => clearTimeout(t);
  }, [p]);

  const set = (path, value) => setP((cur) => setIn(cur, path, value));
  const f = { p, set, setPage };

  const pages = useMemo(() => proposalPages(p), [p]);
  const current = pages.find((x) => x.key === page) || pages[0];

  function pickConsultant(which, name) {
    setP((cur) => {
      let next = setIn(cur, which === 1 ? "consultant1" : "consultant2", name);
      const c = which === 1 ? "c1" : "c2";
      const prev = cur[c];
      next = setIn(next, `${c}.name`, name);
      if (!prev.email || prev.email === emailFor(prev.name)) next = setIn(next, `${c}.email`, emailFor(name));
      return next;
    });
  }

  async function downloadPdf() {
    setBusy("Building PDF…");
    try {
      const res = await fetch("/api/proposals/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposal: p }),
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const name = `Proposal - ${(p.clientName || "Client").trim()} - ${(p.roleTitle || "Role").trim()}.pdf`.replace(/[\\/:*?"<>|]+/g, "");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) {
      alert("Sorry, the PDF didn't build. Try again in a moment.");
    } finally {
      setBusy("");
    }
  }

  function startAgain() {
    if (!confirm("Clear this proposal and start a new one?")) return;
    setP(blankProposal());
    setPage("title");
    setOpen("client");
  }

  const two = !!p.twoConsultants;
  const toggle = (k) => setOpen((o) => (o === k ? "" : k));
  const benefits = p.benefits && p.benefits.length ? p.benefits : [""];

  return (
    <div className="peditor">
      <div className="pform">
        <Section title="1. Client & role" open={open === "client"} onToggle={() => toggle("client")} done={!!(p.clientName && p.roleTitle)}>
          <Text label="Client name" path="clientName" max={LIMITS.clientName} page="title" placeholder="e.g. Westmarq" {...f} />
          <Text label="Role title" path="roleTitle" page="title" placeholder="e.g. Chief Technology Officer" {...f}
            hint="Shown on the title page as “For the Appointment of …”." />
          <Text label="Client website" path="clientWebsite" type="url" page="title" placeholder="e.g. https://www.westmarq.co.uk" {...f}
            hint="Coming next: the hub will pull the client’s logo and photos from here. For now, add the logo below and choose photos in section 11." />
          <div className="row">
            <label className="label"><span>Client logo <span className="opt">(PNG or SVG with a clear background)</span></span></label>
            <input type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp" onChange={async (e) => {
              const file = e.target.files && e.target.files[0];
              if (!file) return;
              set("clientLogo", await readImage(file, 1200, "image/png"));
              setPage("title");
            }} />
            {p.clientLogo ? (
              <div className="logo-row">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.clientLogo} alt="Client logo" />
                <button type="button" className="link" onClick={() => set("clientLogo", "")}>Remove</button>
              </div>
            ) : null}
          </div>
          <Check label="Keep the logo’s own colours (otherwise it’s shown in white)" path="logoColour" page="title" {...f} />
          <Check label="Is this an NDA-led confidential search?" path="nda" page="contents" {...f}
            hint="Removes the Branded Campaigns page and “Branded Media Adverts”, and renumbers the contents." />
        </Section>

        <Section title="2. Consultant(s)" open={open === "consultants"} onToggle={() => toggle("consultants")} done={!!p.consultant1}>
          <div className="row">
            <label className="label" htmlFor="consultant1"><span>Consultant</span></label>
            <select id="consultant1" className="select" value={p.consultant1} onFocus={() => setPage("title")} onChange={(e) => pickConsultant(1, e.target.value)}>
              <option value="">Select a consultant</option>
              {CONSULTANTS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <Check label="Two consultants on this proposal" path="twoConsultants" page="title" {...f}
            hint="The title page then shows both names (no email), and the Credentials page shows two profiles." />
          {two ? (
            <div className="row">
              <label className="label" htmlFor="consultant2"><span>Second consultant</span></label>
              <select id="consultant2" className="select" value={p.consultant2} onFocus={() => setPage("title")} onChange={(e) => pickConsultant(2, e.target.value)}>
                <option value="">Select a consultant</option>
                {CONSULTANTS.filter((n) => n !== p.consultant1).map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          ) : null}
          {!two ? <Text label="Email on the title page" path="c1.email" max={LIMITS.email} page="title" {...f} /> : null}
        </Section>

        <Section title="3. Our Understanding" open={open === "understanding"} onToggle={() => toggle("understanding")} done={!!p.understanding}>
          <Text label="Our understanding of the brief" path="understanding" max={LIMITS.understanding} multiline rows={12} page="understanding" {...f}
            hint="Start a new line for a new paragraph." />
        </Section>

        <Section title={`4. About ${p.clientName || "the client"}`} open={open === "about"} onToggle={() => toggle("about")} done={!!p.about}>
          <Text label="About the client" path="about" max={LIMITS.about} multiline rows={12} page="about" {...f} hint="Start a new line for a new paragraph." />
        </Section>

        <Section title="5. Role Profile" open={open === "role"} onToggle={() => toggle("role")} done={!!(p.jobTitle && p.roleProfile)}>
          <Text label="Job title" path="jobTitle" max={LIMITS.jobTitle} page="role" {...f} />
          <Text label="Location" path="location" max={LIMITS.location} page="role" placeholder="e.g. Barnsley, 3–4 days per week on site" {...f} />
          <Text label="Reporting to" path="reportingTo" max={LIMITS.reportingTo} page="role" {...f} />
          {!p.noDirectReports ? <Text label="Direct reports" path="directReports" max={LIMITS.directReports} page="role" {...f} /> : null}
          <Check label="No direct reports (remove this line)" path="noDirectReports" page="role" {...f} />
          <Text label="Salary" path="salary" max={LIMITS.salary} page="role" placeholder="e.g. £90,000–£110,000" {...f} />
          <Text label="Contract" path="contract" max={LIMITS.contract} page="role" placeholder="e.g. Permanent, full-time" {...f} />
          <div className="row">
            <label className="label"><span>Benefits</span><span className="count">{benefits.filter((b) => b.trim()).length}/{LIMITS.benefits}</span></label>
            {benefits.map((b, i) => (
              <div key={i} className="bullet-row">
                <input className="input" value={b} maxLength={LIMITS.benefit} spellCheck lang="en-GB" placeholder={`Benefit ${i + 1}`}
                  onFocus={() => setPage("role")}
                  onChange={(e) => set("benefits", benefits.map((x, j) => (j === i ? e.target.value : x)))} />
                {benefits.length > 1 ? <button type="button" className="link" onClick={() => set("benefits", benefits.filter((_, j) => j !== i))}>Remove</button> : null}
              </div>
            ))}
            {benefits.length < LIMITS.benefits ? (
              <button type="button" className="btn btn-ghost btn-small" onClick={() => { set("benefits", [...benefits, ""]); setPage("role"); }}>+ Add a benefit</button>
            ) : null}
          </div>
          <Text label="Role profile" path="roleProfile" max={LIMITS.roleProfile} multiline rows={12} page="role" {...f} hint="Leave a blank line between paragraphs." />
        </Section>

        <Section title="6. Our Approach" open={open === "approach"} onToggle={() => toggle("approach")} done>
          <p className="hint" style={{ marginTop: 0 }}>Our standard wording is already in. Change it if this search needs something different.</p>
          {APPROACH.map((a) => (
            <div key={a.key}>
              <Text label={a.title} path={a.key} max={LIMITS.approach} multiline rows={5} page="approach" {...f} />
              {p[a.key] !== a.text ? <button type="button" className="link" style={{ marginTop: -10, marginBottom: 16 }} onClick={() => set(a.key, a.text)}>Reset to standard wording</button> : null}
            </div>
          ))}
        </Section>

        {!p.nda ? (
          <Section title="7. Branded Campaigns" open={open === "branded"} onToggle={() => toggle("branded")} done>
            <p className="hint" style={{ marginTop: 0 }}>Coming next: pick one of our branded ads for the first tile. Until then the page shows our standard examples.</p>
            <button type="button" className="btn btn-ghost btn-small" onClick={() => setPage("branded")}>Show this page</button>
          </Section>
        ) : null}

        <Section title={`${p.nda ? 7 : 8}. Search Process`} open={open === "search"} onToggle={() => toggle("search")} done>
          <Text label="Projected timeframe" path="timeframe" max={LIMITS.timeframe} page="search" {...f} />
        </Section>

        <Section title={`${p.nda ? 8 : 9}. Credentials`} open={open === "credentials"} onToggle={() => toggle("credentials")} done={!!p.c1.about}>
          {[1, ...(two ? [2] : [])].map((n) => {
            const c = `c${n}`;
            const name = n === 1 ? p.consultant1 : p.consultant2;
            return (
              <div key={n} className="subgroup">
                <h3 className="group-title">{name || (n === 1 ? "Consultant" : "Second consultant")}</h3>
                {!name ? <p className="hint">Choose the consultant in section 2 first; their headshot is added automatically.</p> : null}
                <Text label="Job title" path={`${c}.title`} max={LIMITS.consultantTitle} page="credentials" placeholder="e.g. Senior Business Director" {...f} />
                <Text label="Email" path={`${c}.email`} max={LIMITS.email} page="credentials" {...f} />
                <Text label="Phone" path={`${c}.phone`} max={LIMITS.phone} page="credentials" placeholder="e.g. 07710 096 839" {...f} />
                <Text label="About me" path={`${c}.about`} max={two ? LIMITS.aboutTwo : LIMITS.aboutOne} multiline rows={two ? 6 : 10} page="credentials" {...f} />
                {two ? (
                  <Text label="Recent placements" path={`${c}.placements`} max={LIMITS.placements} page="credentials" {...f}
                    placeholder="Managing Director | Commercial Manager | Sales Manager"
                    hint="Put a | (the key above Enter, with Shift) between each role, with a space either side." />
                ) : null}
              </div>
            );
          })}
        </Section>

        <Section title={`${p.nda ? 9 : 10}. Terms & Fees`} open={open === "terms"} onToggle={() => toggle("terms")} done>
          <Text label="Fee" path="fee" max={LIMITS.fee} page="terms" placeholder="25%" {...f} hint="Shown as “Fee | 25% + VAT of package.”" />
        </Section>

        <Section title={`${p.nda ? 10 : 11}. Appendices`} open={open === "appendices"} onToggle={() => toggle("appendices")} done>
          <Check label="Add an Appendices page" path="appendicesOn" page="appendices" {...f} />
          {p.appendicesOn ? (
            <>
              {(p.appendices || []).map((a, i) => (
                <div key={i} className="subgroup">
                  <Text label={`Appendix ${i + 1} title`} path={`appendices.${i}.title`} max={LIMITS.appendixTitle} page="appendices" {...f} />
                  <Text label="Link to the document" path={`appendices.${i}.link`} type="url" page="appendices" placeholder="https://…" {...f}
                    hint="Coming next: upload the document here instead of pasting a link." />
                  <button type="button" className="link" onClick={() => set("appendices", p.appendices.filter((_, j) => j !== i))}>Remove appendix</button>
                </div>
              ))}
              {(p.appendices || []).length < 6 ? (
                <button type="button" className="btn btn-ghost btn-small" onClick={() => set("appendices", [...(p.appendices || []), { title: "", link: "" }])}>+ Add an appendix</button>
              ) : null}
            </>
          ) : null}
        </Section>

        <Section title={`${p.nda ? 11 : 12}. Pictures`} open={open === "pictures"} onToggle={() => toggle("pictures")} done>
          <p className="hint" style={{ marginTop: 0 }}>Coming next: these fill automatically from the client’s website. For now, choose one of our photos or upload one.</p>
          {PHOTO_SLOTS.map((s) => (
            <div key={s.key} className="row">
              <label className="label"><span>{s.label}</span></label>
              <div className="photo-pick">
                {STOCK_PHOTOS.map((src) => (
                  <button key={src} type="button" className={"thumb" + (p[s.key] === src ? " on" : "")}
                    onClick={() => { set(s.key, src); setPage(s.key === "photoTitle" ? "title" : s.key === "photoUnderstanding" ? "understanding" : s.key === "photoAbout" ? "about" : s.key === "photoRole" ? "role" : "approach"); }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" loading="lazy" />
                  </button>
                ))}
                <label className="thumb upload" title="Upload a photo">
                  <input type="file" accept="image/*" onChange={async (e) => {
                    const file = e.target.files && e.target.files[0];
                    if (file) set(s.key, await readImage(file));
                  }} />
                  +
                </label>
              </div>
            </div>
          ))}
        </Section>

        <div className="actions">
          <button type="button" className="btn btn-primary" onClick={downloadPdf} disabled={!!busy}>{busy || "Download PDF"}</button>
          <button type="button" className="btn btn-ghost" onClick={startAgain}>Start a new proposal</button>
        </div>
        <p className="hint">Your work is saved in this browser as you go. Sending to proof-reading is coming next.</p>
      </div>

      <div className="ppreview">
        <div className="ptabs">
          {pages.map((pg, i) => (
            <button key={pg.key} type="button" className={"tab" + (pg.key === current.key ? " on" : "")} onClick={() => setPage(pg.key)}>
              {i + 1}. {pg.label}
            </button>
          ))}
        </div>
        <ScaledPage>{current.el}</ScaledPage>
        <div className="preview-note">Page {pages.indexOf(current) + 1} of {pages.length} · 1920 × 1080</div>
      </div>
    </div>
  );
}

// Shows a 1920 x 1080 page shrunk to fit the column.
function ScaledPage({ children }) {
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

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { proposalPages } from "../../lib/proposal/pages";
import {
  APPROACH, CONSULTANTS, LIMITS, PHOTO_SLOTS, STOCK_PHOTOS, blankProposal, emailFor, normalise,
  assignPhotos, photoFits, textFields, fieldName,
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

export default function ProposalEditor({ mode = "new", record = null, onRecord }) {
  const review = mode === "review";
  const [p, setP] = useState(() => (record ? normalise(record.data) : blankProposal()));
  const [page, setPage] = useState("title");
  const [open, setOpen] = useState(review ? "" : "client");
  const [busy, setBusy] = useState("");
  const [siteState, setSiteState] = useState({ busy: false, msg: "" });
  const [aboutState, setAboutState] = useState({ busy: false, msg: "", draft: "" });
  const [issues, setIssues] = useState(null); // null = not checked yet
  const [checkBusy, setCheckBusy] = useState(false);
  const [submit, setSubmit] = useState(null); // {name, email} while the send panel is open
  const [done, setDone] = useState("");
  const [sendTo, setSendTo] = useState(record ? (record.submittedBy && record.submittedBy.email) || "" : "");
  const loaded = useRef(false);

  // Keep a draft in this browser so nothing is lost on refresh.
  useEffect(() => {
    if (review) return;
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
      if (d) setP(normalise(d));
    } catch {}
    loaded.current = true;
  }, []);
  useEffect(() => {
    if (!loaded.current || review) return;
    const t = setTimeout(() => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(p)); } catch {} }, 400);
    return () => clearTimeout(t);
  }, [p]);

  const set = (path, value) => setP((cur) => setIn(cur, path, value));
  const pRef = useRef(p);
  pRef.current = p;
  const f = { p, set, setPage };

  // Links used in the PDF (e.g. "View Media"), so they also work in the preview.
  const [ctx, setCtx] = useState({});
  useEffect(() => {
    fetch("/api/proposals/context", { cache: "no-store" }).then((r) => r.json()).then((j) => setCtx(j || {})).catch(() => {});
  }, []);
  const pages = useMemo(() => proposalPages(p, ctx), [p, ctx]);
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

  // ---- client website: photos + logo ----
  async function findFromWebsite() {
    if (!p.clientWebsite.trim()) { setSiteState({ busy: false, msg: "Add the client's website address first." }); return; }
    setSiteState({ busy: true, msg: "Reading the website and picking photos… this takes up to a minute." });
    draftAboutFromWebsite();
    try {
      const res = await fetch("/api/proposals/scrape", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: p.clientWebsite, company: p.clientName }),
      });
      const r = await res.json();
      if (!res.ok) throw new Error(r.error || "Couldn't read that website.");
      setP((cur) => {
        let next = { ...cur, sitePhotos: r.photos || [] };
        next = { ...next, ...assignPhotos(r.photos || []) };
        if (r.logo && !cur.clientLogo) next.clientLogo = r.logo;
        return next;
      });
      const n = (r.photos || []).length;
      const slotsFilled = Object.keys(assignPhotos(r.photos || [])).length;
      setSiteState({
        busy: false,
        msg: `${n ? `Found ${n} usable photo${n === 1 ? "" : "s"} and placed ${slotsFilled} of ${PHOTO_SLOTS.length}.` : "No usable photos on that site, so our own photos stay in."}${slotsFilled < PHOTO_SLOTS.length && n ? " The other spots keep our photos, as the site didn't have enough suitable pictures big enough to stay sharp." : ""} ${r.logo ? `Logo found (${r.logoSource}).` : "No logo found. Please upload it below."} Swap any picture in section ${p.nda ? 11 : 12}.`,
      });
      setPage("title");
    } catch (e) {
      setSiteState({ busy: false, msg: e.message });
    }
  }

  // ---- client website: About section draft ----
  async function draftAboutFromWebsite() {
    if (!p.clientWebsite.trim()) { setAboutState({ busy: false, msg: "Add the client's website address first (section 1).", draft: "" }); return; }
    setAboutState({ busy: true, msg: "Writing the About section from the client's website…", draft: "" });
    try {
      const res = await fetch("/api/proposals/about", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: p.clientWebsite, company: p.clientName }),
      });
      const r = await res.json();
      if (!res.ok) throw new Error(r.error || "Couldn't write the About section.");
      if (!(pRef.current.about || "").trim()) {
        set("about", r.about);
        setAboutState({ busy: false, msg: "Drafted from the client's website. Read it through and edit anything that isn't right.", draft: "" });
      } else {
        setAboutState({ busy: false, msg: "A new draft from the website is ready. Your current text has been kept.", draft: r.about });
      }
    } catch (e) {
      setAboutState({ busy: false, msg: e.message, draft: "" });
    }
  }

  // ---- spelling and grammar ----
  async function runCheck() {
    setCheckBusy(true);
    try {
      const res = await fetch("/api/proposals/proofread", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: textFields(p) }),
      });
      const r = await res.json();
      if (!res.ok) throw new Error(r.error);
      setIssues(r.issues || []);
      return r.issues || [];
    } catch (e) {
      alert(e.message || "The check didn't work this time.");
      return null;
    } finally {
      setCheckBusy(false);
    }
  }
  function applyFix(i) {
    const it = issues[i];
    const cur = String(getIn(p, it.field) || "");
    set(it.field, cur.replace(it.find, it.replace));
    setIssues(issues.filter((_, j) => j !== i));
  }

  // ---- sending ----
  async function sendForProofing() {
    if (!submit.email.trim()) { alert("Add your email so the finished proposal can come back to you."); return; }
    setBusy("Sending…");
    try {
      const res = await fetch("/api/proposals/submit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposal: p, submitter: submit }),
      });
      const r = await res.json();
      if (!res.ok) throw new Error(r.error);
      setSubmit(null);
      setDone("Sent for proof-reading. You'll get the finished PDF by email once it's been checked.");
    } catch (e) {
      alert(e.message || "Sorry, it didn't send. Try again in a moment.");
    } finally {
      setBusy("");
    }
  }

  async function reviewAction(action, label) {
    if (action === "send-consultant" && !sendTo.trim()) { alert("Add the consultant's email."); return; }
    setBusy(label);
    try {
      const res = await fetch(`/api/proposals/${record.id}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ k: record.key, action, data: p, to: sendTo }),
      });
      const r = await res.json();
      if (!res.ok) throw new Error(r.error);
      onRecord && onRecord(r);
      setDone(action === "save" ? "Changes saved and the PDF updated." : action === "send-check" ? "Sent to the final checker." : `Sent to ${sendTo}.`);
    } catch (e) {
      alert(e.message || "Something went wrong.");
    } finally {
      setBusy("");
    }
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
          <Text label="Client website" path="clientWebsite" type="url" page="title" placeholder="e.g. www.westmarq.co.uk" {...f} />
          <div className="row">
            <button type="button" className="btn btn-ghost btn-small" onClick={findFromWebsite} disabled={siteState.busy}>
              {siteState.busy ? "Looking…" : "Get photos, logo & About text from the website"}
            </button>
            {siteState.msg ? <div className="hint">{siteState.msg}</div> : <div className="hint">Pulls the client’s logo and general photos (no headshots or news pictures) and places them on the pages, and drafts the About section from their website.</div>}
          </div>
          <div className="row">
            <label className="label"><span>Client logo <span className="opt">(found automatically, or upload a PNG/SVG)</span></span></label>
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
          {p.clientLogo ? (
            <div className="row">
              <label className="label" htmlFor="logoSize"><span>Logo size <span className="opt">({Number(p.logoSize) || 100}%)</span></span></label>
              <input id="logoSize" type="range" min={60} max={250} step={5} value={Number(p.logoSize) || 100} style={{ width: "100%" }}
                onChange={(e) => { set("logoSize", Number(e.target.value)); setPage("title"); }} />
              {(Number(p.logoSize) || 100) !== 100 ? <button type="button" className="link" onClick={() => set("logoSize", 100)}>Back to standard size</button> : null}
            </div>
          ) : null}
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
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginTop: -6 }}>
            <button type="button" className="btn btn-ghost btn-small" onClick={draftAboutFromWebsite} disabled={aboutState.busy}>
              {aboutState.busy ? "Writing…" : p.about ? "Redraft from the website" : "Draft from the website"}
            </button>
            {aboutState.draft ? (
              <button type="button" className="btn btn-primary btn-small" onClick={() => { set("about", aboutState.draft); setAboutState({ busy: false, msg: "Replaced with the website draft. Edit as needed.", draft: "" }); setPage("about"); }}>
                Use the new draft
              </button>
            ) : null}
          </div>
          {aboutState.msg ? <div className="hint">{aboutState.msg}</div> : null}
          {aboutState.draft ? <div className="hint" style={{ whiteSpace: "pre-line", background: "#f6f6f6", padding: 10, borderRadius: 8 }}>{aboutState.draft}</div> : null}
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
            <BrandedAdPicker p={p} set={set} setPage={setPage} />
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
                  <div className="row">
                    <label className="label"><span>Document</span></label>
                    <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*" onChange={async (e) => {
                      const file = e.target.files && e.target.files[0];
                      if (!file) return;
                      if (file.size > 4 * 1024 * 1024) { alert("Please keep documents under 4 MB."); return; }
                      const fd = new FormData(); fd.append("file", file);
                      const res = await fetch("/api/proposals/upload", { method: "POST", body: fd });
                      const r = await res.json();
                      if (!res.ok) { alert(r.error || "Upload failed."); return; }
                      set(`appendices.${i}.link`, r.url); set(`appendices.${i}.file`, r.name); setPage("appendices");
                    }} />
                    {a.link ? <div className="hint">Linked: {a.file || a.link} <button type="button" className="link" onClick={() => { set(`appendices.${i}.link`, ""); set(`appendices.${i}.file`, ""); }}>Remove</button></div>
                      : <div className="hint">The “View” button in the PDF opens this document. Or paste a link instead:</div>}
                    {!a.link ? <input className="input" style={{ marginTop: 6 }} placeholder="https://…" defaultValue="" onBlur={(e) => e.target.value.trim() && set(`appendices.${i}.link`, e.target.value.trim())} /> : null}
                  </div>
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
          <p className="hint" style={{ marginTop: 0 }}>Photos from the client’s website come first, then ours. Faded ones are too small for that spot and would look blurry.</p>
          {PHOTO_SLOTS.map((s) => (
            <div key={s.key} className="row">
              <label className="label"><span>{s.label}</span></label>
              <div className="photo-pick">
                {(p.sitePhotos || []).map((ph) => {
                  const fits = photoFits(ph, s);
                  return (
                    <button key={ph.url} type="button" disabled={!fits} title={fits ? "From the client’s website" : "Too small for this spot"}
                      className={"thumb site" + (p[s.key] === ph.url ? " on" : "") + (fits ? "" : " small")}
                      onClick={() => { set(s.key, ph.url); setPage(s.key === "photoTitle" ? "title" : s.key === "photoUnderstanding" ? "understanding" : s.key === "photoAbout" ? "about" : s.key === "photoRole" ? "role" : "approach"); }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ph.url} alt="" loading="lazy" />
                    </button>
                  );
                })}
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

        {issues ? (
          <div className="issues">
            <div className="issues-head">{issues.length ? `${issues.length} thing${issues.length === 1 ? "" : "s"} to check` : "No spelling or grammar mistakes found."}</div>
            {issues.map((it, i) => (
              <div key={i} className="issue">
                <div className="issue-field">{fieldName(it.field)}</div>
                <div><s>{it.find}</s> → <b>{it.replace}</b></div>
                {it.why ? <div className="hint" style={{ marginTop: 2 }}>{it.why}</div> : null}
                <div className="issue-actions">
                  <button type="button" className="link" onClick={() => applyFix(i)}>Fix it</button>
                  <button type="button" className="link muted" onClick={() => setIssues(issues.filter((_, j) => j !== i))}>Ignore</button>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {done ? <div className="done-msg">{done}</div> : null}

        {submit && !review ? (
          <div className="psec open send-panel">
            <div className="psec-body" style={{ borderTop: 0 }}>
              <h3 className="group-title" style={{ marginTop: 0 }}>Send for proof-reading</h3>
              <div className="row"><label className="label"><span>Your name</span></label>
                <input className="input" value={submit.name} onChange={(e) => setSubmit({ ...submit, name: e.target.value })} /></div>
              <div className="row"><label className="label"><span>Your email (the finished PDF comes back here)</span></label>
                <input className="input" type="email" value={submit.email} onChange={(e) => setSubmit({ ...submit, email: e.target.value })} /></div>
              {issues && issues.length ? <div className="hint warn">There are still {issues.length} spelling or grammar point{issues.length === 1 ? "" : "s"} above. You can fix them first or send anyway.</div> : null}
              <div className="actions">
                <button type="button" className="btn btn-primary" onClick={sendForProofing} disabled={!!busy}>{busy || "Send"}</button>
                <button type="button" className="btn btn-ghost" onClick={() => setSubmit(null)}>Cancel</button>
              </div>
            </div>
          </div>
        ) : null}

        {review ? (
          <>
            <div className="actions">
              <button type="button" className="btn btn-ghost" onClick={runCheck} disabled={checkBusy}>{checkBusy ? "Checking…" : "Check spelling & grammar"}</button>
              <button type="button" className="btn btn-ghost" onClick={() => reviewAction("save", "Saving…")} disabled={!!busy}>Save changes</button>
            </div>
            <div className="actions">
              <button type="button" className="btn btn-primary" onClick={() => reviewAction("send-check", "Sending…")} disabled={!!busy}>{busy || "Send to final checker"}</button>
            </div>
            <div className="row" style={{ marginTop: 10 }}>
              <label className="label"><span>Consultant’s email</span></label>
              <input className="input" type="email" value={sendTo} onChange={(e) => setSendTo(e.target.value)} />
            </div>
            <div className="actions">
              <button type="button" className="btn btn-primary" onClick={() => { if (confirm(`Send the finished proposal to ${sendTo}?`)) reviewAction("send-consultant", "Sending…"); }} disabled={!!busy}>Send to consultant</button>
              <button type="button" className="btn btn-ghost" onClick={downloadPdf} disabled={!!busy}>Download PDF</button>
            </div>
          </>
        ) : (
          <>
            <div className="actions">
              <button type="button" className="btn btn-ghost" onClick={runCheck} disabled={checkBusy}>{checkBusy ? "Checking…" : "Check spelling & grammar"}</button>
              <button type="button" className="btn btn-ghost" onClick={downloadPdf} disabled={!!busy}>{busy && !submit ? busy : "Download PDF"}</button>
            </div>
            <div className="actions">
              <button type="button" className="btn btn-primary" disabled={!!busy || checkBusy} onClick={async () => {
                setDone("");
                const found = issues === null ? await runCheck() : issues;
                if (found === null && !confirm("The spelling check didn't run. Send anyway?")) return;
                setSubmit({ name: p.consultant1 || "", email: p.c1.email || emailFor(p.consultant1) || "" });
              }}>Send for proof-reading</button>
              <button type="button" className="btn btn-ghost" onClick={startAgain}>Start a new proposal</button>
            </div>
            <p className="hint">Your work is saved in this browser as you go.</p>
          </>
        )}
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
// Dropdown of our branded ads from the Drive folder, labelled "Client – Job title", A–Z by client.
function BrandedAdPicker({ p, set, setPage }) {
  const [state, setState] = useState({ loading: true, ads: [], pending: 0, error: "" });
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let stop = false;
    async function load(tries = 0) {
      try {
        const r = await fetch("/api/proposals/ads", { cache: "no-store" });
        const j = await r.json();
        if (stop) return;
        if (!r.ok) throw new Error(j.error);
        setState({ loading: false, ads: j.ads || [], pending: j.pending || 0, error: "" });
        // New ads are read in batches; keep going until every one has a label.
        if (j.pending && tries < 20) load(tries + 1);
      } catch (e) {
        if (!stop) setState((s) => ({ ...s, loading: false, error: e.message || "Couldn't load the branded ads." }));
      }
    }
    load();
    return () => { stop = true; };
  }, []);

  async function choose(id) {
    setMsg("");
    if (!id) { set("brandedAdId", ""); set("brandedAd", ""); return; }
    const ad = state.ads.find((a) => a.id === id);
    setBusy(true);
    try {
      const r = await fetch("/api/proposals/ads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, updated: ad && ad.updated }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      set("brandedAdId", id);
      set("brandedAd", j.url);
      setPage("branded");
    } catch (e) { setMsg(e.message || "Couldn't fetch that ad."); } finally { setBusy(false); }
  }

  const q = filter.trim().toLowerCase();
  const shown = q ? state.ads.filter((a) => a.label.toLowerCase().includes(q) || a.id === p.brandedAdId) : state.ads;
  return (
    <div className="row">
      <label className="label" htmlFor="ad"><span>Branded ad for the first tile</span></label>
      {state.ads.length > 12 ? (
        <input className="input" placeholder="Type to filter by client or job title" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ marginBottom: 8 }} />
      ) : null}
      <select id="ad" className="input" value={p.brandedAdId || ""} disabled={busy || state.loading} onChange={(e) => choose(e.target.value)}>
        <option value="">{state.loading ? "Loading our branded ads…" : "None – keep our standard example"}</option>
        {shown.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
      </select>
      <div className="hint">
        {busy ? "Fetching the ad…" : state.error ? <span className="warn">{state.error}</span>
          : state.pending ? `Reading ${state.pending} new ad${state.pending === 1 ? "" : "s"} to label them. Some may show a file name for a minute.`
          : `${state.ads.length} ads from the Drive folder. New ones appear automatically.`}
        {msg ? <> <span className="warn">{msg}</span></> : null}
      </div>
      {p.brandedAd ? (
        <div style={{ marginTop: 12 }}>
          <div className="label"><span>How it sits in the tile</span></div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
            {[["fill", "Fill – centred"], ["top", "Fill – keep the top"], ["bottom", "Fill – keep the bottom"], ["whole", "Show the whole ad"]].map(([v, l]) => (
              <button key={v} type="button" className={"btn btn-small " + ((p.brandedFit || "fill") === v ? "btn-primary" : "btn-ghost")}
                onClick={() => { set("brandedFit", v); setPage("branded"); }}>{l}</button>
            ))}
          </div>
          <div className="hint">If anything is cut off, try “keep the top”, “keep the bottom” or “Show the whole ad”.</div>
        </div>
      ) : null}
    </div>
  );
}

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

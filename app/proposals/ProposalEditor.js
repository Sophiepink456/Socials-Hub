"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { proposalPages } from "../../lib/proposal/pages";
import { EXTRA_STYLES, styleById, defaultsFor } from "../../lib/proposal/extra";
import {
  APPROACH, CONSULTANTS, LIMITS, PHOTO_SLOTS, STOCK_PHOTOS, blankProposal, emailFor, normalise, PAYMENT_TERMS, PAYMENT_NOTE,
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

// Tell the editor a box went over its limit (it shows the popup).
function limitHit(label, max, tried) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("proposal-limit", { detail: { label, max, tried } }));
}

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
  const [savedDraft, setSavedDraft] = useState(null); // an unfinished proposal from last time
  const [draft, setDraft] = useState(null); // { id, k, link } once saved to the hub
  const [draftPanel, setDraftPanel] = useState(null); // { name, email } while asking who it belongs to
  const [draftMsg, setDraftMsg] = useState("");
  const [limitMsg, setLimitMsg] = useState(null); // {label, max, tried} when a box goes over its limit
  useEffect(() => {
    const on = (e) => setLimitMsg((cur) => cur || e.detail);
    window.addEventListener("proposal-limit", on);
    return () => window.removeEventListener("proposal-limit", on);
  }, []);
  const [sendTo, setSendTo] = useState(record ? (record.submittedBy && record.submittedBy.email) || "" : "");
  const loaded = useRef(false);

  // Keep a draft in this browser so nothing is lost on refresh.
  useEffect(() => {
    if (review) return;
    try {
      // Opened from a "Carry on with the draft" link: load that saved draft.
      const qs = new URLSearchParams(window.location.search);
      if (qs.get("draft") && qs.get("k")) {
        fetch(`/api/proposals/draft?id=${encodeURIComponent(qs.get("draft"))}&k=${encodeURIComponent(qs.get("k"))}`, { cache: "no-store" })
          .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
          .then(({ ok, j }) => {
            if (!ok) { setDraftMsg(j.error || "That draft link isn't valid any more."); return; }
            setP(normalise(j.data));
            setDraft({ id: j.id, k: j.k, link: window.location.href, savedBy: j.savedBy });
            setDraftMsg(j.submitted ? "This draft has already been sent for proof-reading. Any changes here would need sending again." : `Draft opened. Last saved ${new Date(j.updatedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}.`);
          }).catch(() => setDraftMsg("Couldn't open that draft. Try the link again."));
        return;
      }
      // Always open on a clean proposal. An unfinished one is kept aside and offered back,
      // so nothing is lost if the page was closed by mistake.
      const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
      if (d && (d.clientName || d.roleTitle || d.about || d.understanding)) setSavedDraft(d);
    } catch {}
  }, []);
  useEffect(() => {
    // Only start saving once something has been typed into this new proposal.
    if (!loaded.current) { loaded.current = JSON.stringify(p) !== JSON.stringify(blankProposal()); if (!loaded.current) return; }
    if (review) return;
    const t = setTimeout(() => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(p)); } catch {} }, 400);
    return () => clearTimeout(t);
  }, [p]);

  const set = (path, value) => setP((cur) => setIn(cur, path, value));
  const pickPhoto = (key, url) => setP((cur) => ({ ...cur, [key]: url, photoPos: { ...(cur.photoPos || {}), [key]: undefined } }));
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

  // ---- save a draft to the hub (with a link to come back to it) ----
  async function saveDraft(who) {
    setBusy("Saving draft…"); setDraftMsg("");
    try {
      const res = await fetch("/api/proposals/draft", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: draft && draft.id, key: draft && draft.k, proposal: p, name: who && who.name, email: who && who.email }),
      });
      const r = await res.json();
      if (!res.ok) throw new Error(r.error);
      setDraft({ id: r.id, k: r.k, link: r.link, savedBy: (draft && draft.savedBy) || who });
      setDraftPanel(null);
      try { window.history.replaceState(null, "", `/proposals?draft=${r.id}&k=${r.k}`); } catch {}
      try { localStorage.removeItem(DRAFT_KEY); } catch {}
      const t = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      setDraftMsg(r.emailed ? `Draft saved at ${t}. We've emailed you a link so you can carry on from any computer.` : `Draft saved at ${t}.`);
    } catch (e) {
      setDraftMsg(e.message || "Couldn't save the draft. Try again in a moment.");
    } finally { setBusy(""); }
  }

  function startAgain() {
    if (!confirm("Clear this proposal and start a new one?")) return;
    setP(blankProposal());
    setPage("title");
    setOpen("client");
    setDraft(null); setDraftMsg("");
    try { window.history.replaceState(null, "", "/proposals"); } catch {}
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
      if (!r.about || !r.about.trim()) throw new Error("The draft came back empty. Please try again.");
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
        body: JSON.stringify({ proposal: p, submitter: submit, draft: draft ? { id: draft.id, k: draft.k } : null }),
      });
      const r = await res.json();
      if (!res.ok) throw new Error(r.error);
      setSubmit(null);
      try { localStorage.removeItem(DRAFT_KEY); } catch {}
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
  // Opening a section also shows its page in the preview.
  const SECTION_PAGE = { client: "title", consultants: "title", understanding: "understanding", about: "about", role: "role", approach: "approach",
    branded: "branded", candidate: "candidate", search: "search", credentials: "credentials", terms: "terms", appendices: "appendices", pictures: "title" };
  const toggle = (k) => {
    if (open !== k && SECTION_PAGE[k]) setPage(SECTION_PAGE[k]);
    setOpen((o) => (o === k ? "" : k));
  };
  const benefits = p.benefits && p.benefits.length ? p.benefits : [""];

  return (
    <div className="peditor">
      {limitMsg ? (
        <div className="modal-back" role="dialog" aria-modal="true" onClick={() => setLimitMsg(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Character limit reached</h3>
            <p><strong>{limitMsg.label}</strong> can be up to {limitMsg.max.toLocaleString("en-GB")} characters so it fits on the page.
              {limitMsg.tried > limitMsg.max + 1 ? ` The text was ${limitMsg.tried.toLocaleString("en-GB")} characters, so everything after the limit has been cut off.` : " Anything more won't fit."}</p>
            <p className="hint">Shorten the wording to make room for anything else you want to say.</p>
            <div className="actions"><button className="btn btn-primary" type="button" onClick={() => setLimitMsg(null)} autoFocus>OK</button></div>
          </div>
        </div>
      ) : null}
      <div className="pform">
        {savedDraft && !review ? (
          <div className="done-msg" style={{ marginBottom: 14 }}>
            You have an unfinished proposal{savedDraft.clientName ? ` for ${savedDraft.clientName}` : ""}{savedDraft.roleTitle ? ` (${savedDraft.roleTitle})` : ""}.{" "}
            <button type="button" className="link" onClick={() => { setP(normalise(savedDraft)); setSavedDraft(null); }}>Carry on with it</button>
            {" or "}
            <button type="button" className="link" onClick={() => { try { localStorage.removeItem(DRAFT_KEY); } catch {} setSavedDraft(null); }}>start fresh</button>.
          </div>
        ) : null}
        <Section title="1. Client & role" open={open === "client"} onToggle={() => toggle("client")} done={!!(p.clientName && p.roleTitle)}>
          <Text label="Client name" path="clientName" max={LIMITS.clientName} page="title" placeholder="e.g. Westmarq" {...f} />
          <Text label="Role title" path="roleTitle" page="title" placeholder="e.g. Chief Technology Officer" {...f}
            hint="Shown on the title page as “For the Appointment of …”." />
          <Text label="Client website" path="clientWebsite" type="url" page="title" placeholder="e.g. www.westmarq.co.uk" {...f} />
          <div className="row">
            <button type="button" className="btn btn-ghost btn-small" onClick={findFromWebsite} disabled={siteState.busy}>
              {siteState.busy ? "Looking…" : "Get photos, logo & About text from the website"}
            </button>
            {siteState.msg ? <div className="hint">{siteState.msg}{!siteState.busy && /photo/i.test(siteState.msg) ? <div style={{ marginTop: 6 }}><strong>Note: Marketing will finalise all imagery and upload more images should there not be enough from the client’s website.</strong></div> : null}</div> : <div className="hint">Pulls the client’s logo and general photos (no headshots or news pictures) and places them on the pages, and drafts the About section from their website.</div>}
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
                <input className="input" value={b} spellCheck lang="en-GB" placeholder={`Benefit ${i + 1}`}
                  onFocus={() => setPage("role")}
                  onChange={(e) => {
                    let v = e.target.value;
                    if (v.length > LIMITS.benefit) { limitHit(`Benefit ${i + 1}`, LIMITS.benefit, v.length); v = v.slice(0, LIMITS.benefit); }
                    set("benefits", benefits.map((x, j) => (j === i ? v : x)));
                  }} />
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

        {review ? (
          <Section title="Back-office pictures" open={open === "candidate"} onToggle={() => toggle("candidate")} done>
            <CandidatePictures p={p} set={set} setP={setP} setPage={setPage} />
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
          <Text label="Payment terms" path="paymentTerms" max={LIMITS.paymentTerms} multiline rows={4} page="terms" {...f} hint="One bullet point per line (up to 5)." />
          {p.paymentTerms !== PAYMENT_TERMS ? <button type="button" className="link" style={{ marginTop: -10, marginBottom: 16 }} onClick={() => set("paymentTerms", PAYMENT_TERMS)}>Reset to standard wording</button> : null}
          <Text label="Note under the payment terms" path="paymentNote" max={LIMITS.paymentNote} multiline rows={2} page="terms" {...f} optional />
          {p.paymentNote !== PAYMENT_NOTE ? <button type="button" className="link" style={{ marginTop: -10, marginBottom: 16 }} onClick={() => set("paymentNote", PAYMENT_NOTE)}>Reset to standard wording</button> : null}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 160px" }}><Text label="Guarantee period (weeks)" path="guaranteeWeeks" max={LIMITS.weeks} page="terms" placeholder="16" {...f} /></div>
            <div style={{ flex: "1 1 160px" }}><Text label="Payment due (days from invoice)" path="paymentDays" max={LIMITS.days} page="terms" placeholder="30" {...f} /></div>
          </div>
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
                      onClick={() => { pickPhoto(s.key, ph.url); setPage(slotPage(s.key)); }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ph.url} alt="" loading="lazy" />
                    </button>
                  );
                })}
                {STOCK_PHOTOS.map((src) => (
                  <button key={src} type="button" className={"thumb" + (p[s.key] === src ? " on" : "")}
                    onClick={() => { pickPhoto(s.key, src); setPage(slotPage(s.key)); }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" loading="lazy" />
                  </button>
                ))}
                <label className="thumb upload" title="Upload a photo">
                  <input type="file" accept="image/*" onChange={async (e) => {
                    const file = e.target.files && e.target.files[0];
                    if (file) pickPhoto(s.key, await readImage(file));
                  }} />
                  +
                </label>
              </div>
              {p[s.key] ? (
                <PhotoFramer src={p[s.key]} slot={s} pos={(p.photoPos || {})[s.key]}
                  onChange={(pos) => { setP((cur) => ({ ...cur, photoPos: { ...(cur.photoPos || {}), [s.key]: pos } })); setPage(slotPage(s.key)); }} />
              ) : null}
            </div>
          ))}
        </Section>

        {review ? (
          <Section title={`Add or remove pages${(p.extraPages || []).length || (p.hiddenPages || []).length ? ` (${(p.extraPages || []).length} added, ${(p.hiddenPages || []).length} removed)` : ""} (back office only)`} open={open === "extra"} onToggle={() => toggle("extra")} done>
            <ExtraPages p={p} setP={setP} setPage={setPage} pages={pages} />
          </Section>
        ) : null}

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
              <button type="button" className="btn btn-ghost" disabled={!!busy} onClick={() => {
                if (draft) saveDraft(null);
                else setDraftPanel({ name: p.consultant1 || "", email: p.c1.email || emailFor(p.consultant1) || "" });
              }}>{busy === "Saving draft…" ? busy : "Save draft"}</button>
            </div>
            {draftPanel ? (
              <div className="psec open send-panel">
                <div className="psec-body" style={{ borderTop: 0 }}>
                  <h3 className="group-title" style={{ marginTop: 0 }}>Save draft</h3>
                  <p className="hint" style={{ marginTop: 0 }}>We’ll email you a link so you can carry on from any computer.</p>
                  <div className="row"><label className="label"><span>Your name</span></label>
                    <input className="input" value={draftPanel.name} onChange={(e) => setDraftPanel({ ...draftPanel, name: e.target.value })} /></div>
                  <div className="row"><label className="label"><span>Your email</span></label>
                    <input className="input" type="email" value={draftPanel.email} onChange={(e) => setDraftPanel({ ...draftPanel, email: e.target.value })} /></div>
                  <div className="actions">
                    <button type="button" className="btn btn-primary" onClick={() => saveDraft(draftPanel)} disabled={!!busy || !draftPanel.email.trim()}>{busy === "Saving draft…" ? busy : "Save draft"}</button>
                    <button type="button" className="btn btn-ghost" onClick={() => setDraftPanel(null)}>Cancel</button>
                  </div>
                </div>
              </div>
            ) : null}
            {draftMsg ? (
              <div className="done-msg">
                {draftMsg}
                {draft && draft.link ? <> <button type="button" className="link" onClick={() => { navigator.clipboard && navigator.clipboard.writeText(draft.link); setDraftMsg("Link copied. Paste it anywhere to come back to this draft."); }}>Copy the link</button></> : null}
              </div>
            ) : null}
            <div className="actions">
              <button type="button" className="btn btn-primary" disabled={!!busy || checkBusy} onClick={async () => {
                setDone("");
                const found = issues === null ? await runCheck() : issues;
                if (found === null && !confirm("The spelling check didn't run. Send anyway?")) return;
                setSubmit({ name: p.consultant1 || "", email: p.c1.email || emailFor(p.consultant1) || "" });
              }}>Send for proof-reading</button>
              <button type="button" className="btn btn-ghost" onClick={startAgain}>Start a new proposal</button>
            </div>
            <p className="hint">{draft ? "Press Save draft to update your saved copy." : "Your work is kept in this browser as you go. Save draft keeps a copy you can open from any computer."}</p>
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

// Which preview page each photo space is on.
const slotPage = (key) => ({ photoTitle: "title", photoUnderstanding: "understanding", photoAbout: "about", photoRole: "role", photoApproach: "approach", photoTerms: "terms" })[key] || "title";

// Drag a photo around inside its space. It always covers the space, so moving it only changes
// which part of the photo shows; it can't leave a gap.
function PhotoFramer({ src, slot, pos, onChange }) {
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

// Back office only: swap pictures that consultants can't change.
const BO_GROUPS = [
  { title: "Candidate Packs page", page: "candidate", slots: [
    { field: "candidatePack", pk: "cp.back", key: "back", w: 594, h: 334, label: "Back screen (top left, tilted)", hint: "Landscape 16:9, e.g. 1920 × 1080.", ratio: "16 / 9" },
    { field: "candidatePack", pk: "cp.front", key: "front", w: 594, h: 334, label: "Front screen (middle, tilted)", hint: "Landscape 16:9, e.g. 1920 × 1080.", ratio: "16 / 9" },
    { field: "candidatePack", pk: "cp.ipad", key: "ipad", w: 490, h: 656, label: "iPad screen", hint: "Portrait about 3:4, e.g. 1470 × 1968. Shown from the top.", ratio: "490 / 656", top: true },
  ] },
  { title: "Search Process page", page: "search", slots: [
    { field: "boPhotos", pk: "bo.search", key: "search", w: 1920, h: 340, label: "Banner", hint: "Wide, at least 1920 × 340. The title is added on top.", ratio: "1920 / 340" },
  ] },
  { title: "Next Steps page", page: "next", slots: [
    { field: "boPhotos", pk: "bo.next", key: "next", w: 993, h: 520, label: "Bottom-left photo", hint: "Landscape, at least 993 × 520.", ratio: "993 / 520" },
  ] },
  { title: "Appendices page", page: "appendices", slots: [
    { field: "boPhotos", pk: "bo.appendix", key: "appendix", w: 912, h: 980, label: "Right circle photo", hint: "Portrait-ish, at least 912 × 980.", ratio: "912 / 980", circle: "right" },
  ] },
  { title: "End page", page: "end", slots: [
    { field: "boPhotos", pk: "bo.end", key: "end", w: 1024, h: 864, label: "Left circle photo", hint: "At least 1024 × 864.", ratio: "1024 / 864", circle: "left" },
  ] },
];

function CandidatePictures({ p, set, setP, setPage }) {
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  async function upload(slot, page, file) {
    if (!file) return;
    const id = slot.field + slot.key;
    setBusy(id); setMsg("");
    try {
      const dataUrl = await readImage(file, 2400);
      const r = await fetch("/api/proposals/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataUrl }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setP((cur) => ({ ...cur, [slot.field]: { ...(cur[slot.field] || {}), [slot.key]: j.url }, photoPos: { ...(cur.photoPos || {}), [slot.pk]: undefined } }));
      setPage(page);
      setMsg("Picture added. Press Save changes to keep it.");
    } catch (e) { setMsg(e.message || "Couldn't upload that picture."); } finally { setBusy(""); }
  }
  return (
    <>
      <p className="hint" style={{ marginTop: 0 }}>Swap pictures that consultants can’t change. Anything left alone keeps the standard picture. Consultants don’t see this section.</p>
      {BO_GROUPS.filter((g) => g.page !== "appendices" || p.appendicesOn).map((g) => (
        <div key={g.title} style={{ marginBottom: 18 }}>
          <h4 className="group-title" style={{ fontSize: 15, marginTop: 6 }}>
            {g.title} <button type="button" className="link" style={{ fontWeight: 400, marginLeft: 6 }} onClick={() => setPage(g.page)}>Show page</button>
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
            {g.slots.map((s) => {
              const cur = (p[s.field] || {})[s.key];
              const id = s.field + s.key;
              return (
                <div key={id}>
                  <div className="label"><span>{s.label}</span></div>
                  {!cur ? (
                    <div style={{ aspectRatio: s.ratio, maxHeight: 200, background: "#eee", borderRadius: s.circle ? "50%" : 8, overflow: "hidden", border: "1px solid #ddd", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span className="hint">Standard picture</span>
                    </div>
                  ) : null}
                  {cur ? (
                    <PhotoFramer src={cur} slot={{ w: s.w, h: s.h }} pos={(p.photoPos || {})[s.pk] || (s.top ? { x: 50, y: 0 } : undefined)}
                      onChange={(pos) => { setP((c) => ({ ...c, photoPos: { ...(c.photoPos || {}), [s.pk]: pos } })); setPage(g.page); }} />
                  ) : null}
                  <div className="hint">{s.hint}</div>
                  <div className="actions" style={{ marginTop: 6 }}>
                    <label className="btn btn-ghost btn-small" style={{ cursor: "pointer" }}>
                      {busy === id ? "Uploading…" : "Upload picture"}
                      <input type="file" accept="image/*" style={{ display: "none" }} disabled={!!busy} onChange={(e) => { upload(s, g.page, e.target.files && e.target.files[0]); e.target.value = ""; }} />
                    </label>
                    {cur ? <button type="button" className="link" onClick={() => { setP((c) => ({ ...c, [s.field]: { ...(c[s.field] || {}), [s.key]: "" }, photoPos: { ...(c.photoPos || {}), [s.pk]: undefined } })); setPage(g.page); }}>Back to standard</button> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {msg ? <div className="hint" style={{ marginTop: 8 }}>{msg}</div> : null}
    </>
  );
}

// ---- Back office: add extra pages ------------------------------------------------
// Pick how many, choose a page style for each, edit every word and picture on it, and choose
// where it goes. Page numbers and the Contents page update themselves.
function ExtraPages({ p, setP, setPage, pages }) {
  const [howMany, setHowMany] = useState(1);
  const [openId, setOpenId] = useState("");
  const [busy, setBusy] = useState("");
  const list = p.extraPages || [];
  const update = (id, fn) => setP((cur) => ({ ...cur, extraPages: (cur.extraPages || []).map((e) => (e.id === id ? fn(e) : e)) }));

  function add() {
    const fresh = Array.from({ length: howMany }, () => ({ id: Math.random().toString(36).slice(2, 10), style: "", after: "lastSection", name: "", desc: "", v: {}, photoPos: {} }));
    setP((cur) => ({ ...cur, extraPages: [...(cur.extraPages || []), ...fresh] }));
    setOpenId(fresh[0].id);
  }
  function remove(id) {
    if (!confirm("Remove this added page?")) return;
    // Anything placed after it moves to where it was.
    setP((cur) => {
      const gone = (cur.extraPages || []).find((e) => e.id === id);
      return { ...cur, extraPages: (cur.extraPages || []).filter((e) => e.id !== id).map((e) => (e.after === `x-${id}` ? { ...e, after: gone ? gone.after : "lastSection" } : e)) };
    });
  }
  function chooseStyle(e, styleId) {
    const st = styleById(styleId);
    update(e.id, (x) => ({ ...x, style: styleId, v: defaultsFor(styleId, p), photoPos: {}, name: x.name || (st ? st.label.replace(/ style.*$/, "") : "") }));
    setPage(`x-${e.id}`);
  }
  async function upload(e, f, file) {
    if (!file) return;
    setBusy(e.id + f.k);
    try {
      const dataUrl = await readImage(file, 2400);
      const r = await fetch("/api/proposals/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataUrl }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      update(e.id, (x) => ({ ...x, v: { ...x.v, [f.k]: j.url }, photoPos: { ...(x.photoPos || {}), [f.posKey]: undefined } }));
      setPage(`x-${e.id}`);
    } catch (err) { alert(err.message || "Couldn't upload that picture."); } finally { setBusy(""); }
  }

  const hidden = new Set(p.hiddenPages || []);
  const STANDARD = [
    ["title", "Title"], ["contents", "Contents"], ["understanding", "Our Understanding"], ["about", "About"], ["role", "Role Profile"],
    ["approach", "Our Approach"], ["branded", "Branded Campaigns"], ["candidate", "Candidate Packs"], ["search", "Search Process"],
    ["credentials", "Credentials"], ["terms", "Terms & Fees"], ["next", "Next Steps"], ["appendices", "Appendices"], ["end", "End"],
  ].filter(([k]) => k !== "branded" || !p.nda).filter(([k]) => k !== "appendices" || p.appendicesOn);
  function toggleStd(k, keep) {
    setP((cur) => {
      const h = new Set(cur.hiddenPages || []);
      if (keep) h.delete(k); else h.add(k);
      return { ...cur, hiddenPages: [...h] };
    });
    if (keep) setPage(k);
  }
  return (
    <>
      <h4 className="group-title" style={{ fontSize: 15, marginTop: 0 }}>Standard pages</h4>
      <p className="hint" style={{ marginTop: 0 }}>Untick a page to remove it from this proposal. Page numbers and the Contents page update automatically. Tick it again to put it back.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "4px 16px", marginBottom: 18 }}>
        {STANDARD.map(([k, label]) => (
          <label key={k} className="check" style={{ opacity: hidden.has(k) ? 0.55 : 1 }}>
            <input type="checkbox" checked={!hidden.has(k)} onChange={(ev) => toggleStd(k, ev.target.checked)} />
            {label}{hidden.has(k) ? " (removed)" : ""}
          </label>
        ))}
      </div>
      <h4 className="group-title" style={{ fontSize: 15 }}>Added pages</h4>
      <p className="hint" style={{ marginTop: 0 }}>Add pages using any of the proposal’s page designs. Every word and picture on them can be changed, and you choose where each one goes. Page numbers and the Contents page update automatically. Consultants don’t see this section.</p>
      <div className="row" style={{ flexDirection: "row", alignItems: "flex-end", gap: 10, flexWrap: "wrap" }}>
        <div>
          <label className="label" htmlFor="howmany"><span>How many pages to add?</span></label>
          <select id="howmany" className="input" style={{ width: 120 }} value={howMany} onChange={(e) => setHowMany(Number(e.target.value))}>
            {Array.from({ length: 10 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
          </select>
        </div>
        <button type="button" className="btn btn-primary btn-small" onClick={add}>Add {howMany === 1 ? "page" : `${howMany} pages`}</button>
      </div>

      {list.map((e, n) => {
        const st = styleById(e.style);
        const isOpen = openId === e.id;
        const where = pages.filter((pg) => pg.key !== `x-${e.id}` && pg.key !== "end");
        const label = (pages.find((pg) => pg.key === `x-${e.id}`) || {}).label;
        const pageNo = pages.findIndex((pg) => pg.key === `x-${e.id}`) + 1;
        return (
          <div key={e.id} className="panel" style={{ padding: 16, marginTop: 14 }}>
            <div className="row" style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <button type="button" className="link" style={{ fontWeight: 700, textAlign: "left" }} onClick={() => { setOpenId(isOpen ? "" : e.id); if (st) setPage(`x-${e.id}`); }}>
                {isOpen ? "–" : "+"} Added page {n + 1}{st ? `: ${e.name || label || st.label}` : " (choose a style)"}{pageNo > 0 ? ` · page ${pageNo} of ${pages.length}` : ""}
              </button>
              <button type="button" className="link muted" onClick={() => remove(e.id)}>Remove</button>
            </div>
            {isOpen ? (
              <div style={{ marginTop: 12 }}>
                <div className="row">
                  <label className="label"><span>Page style</span></label>
                  <select className="input" value={e.style} onChange={(ev) => chooseStyle(e, ev.target.value)}>
                    <option value="">Choose a page style…</option>
                    {EXTRA_STYLES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                  {e.style ? <div className="hint">Changing the style starts this page again with that style’s wording.</div> : null}
                </div>
                {st ? (
                  <>
                    <div className="row">
                      <label className="label"><span>Where it goes</span></label>
                      <select className="input" value={e.after || "lastSection"} onChange={(ev) => { const val = ev.target.value; update(e.id, (x) => ({ ...x, after: val })); setPage(`x-${e.id}`); }}>
                        <option value="lastSection">Before the end page</option>
                        {where.map((pg) => <option key={pg.key} value={pg.key}>After page {pages.indexOf(pg) + 1}: {pg.label}</option>)}
                      </select>
                    </div>
                    {st.numbered === false ? null : (
                      <>
                        <div className="row">
                          <label className="label"><span>Name on the Contents page and footer</span></label>
                          <input className="input" value={e.name || ""} onChange={(ev) => { const val = ev.target.value; update(e.id, (x) => ({ ...x, name: val })); }} />
                        </div>
                        <div className="row">
                          <label className="label"><span>Line under it on the Contents page</span></label>
                          <input className="input" value={e.desc || ""} placeholder="Leave blank to use the style’s standard line" onChange={(ev) => { const val = ev.target.value; update(e.id, (x) => ({ ...x, desc: val })); }} />
                          <div className="hint">Only shows on the Contents page if this page comes after it.</div>
                        </div>
                      </>
                    )}
                    <h4 className="group-title" style={{ fontSize: 15 }}>Text and pictures on this page</h4>
                    {st.fields.map((f) => {
                      const val = e.v && e.v[f.k] !== undefined ? e.v[f.k] : "";
                      // Body text has the same limits as the original page, with the same cut-off and popup.
                      const setVal = (nv) => {
                        if (f.max && typeof nv === "string" && nv.length > f.max) { limitHit(f.label, f.max, nv.length); nv = nv.slice(0, f.max); }
                        update(e.id, (x) => ({ ...x, v: { ...x.v, [f.k]: nv } }));
                      };
                      if (f.kind === "image") {
                        return (
                          <div key={f.k} className="row">
                            <label className="label"><span>{f.label}</span></label>
                            {val ? (
                              <PhotoFramer src={val} slot={{ w: f.w, h: f.h }} pos={(e.photoPos || {})[f.posKey]}
                                onChange={(pos) => { update(e.id, (x) => ({ ...x, photoPos: { ...(x.photoPos || {}), [f.posKey]: pos } })); setPage(`x-${e.id}`); }} />
                            ) : <div className="hint">No picture.</div>}
                            <div className="actions" style={{ marginTop: 6 }}>
                              <label className="btn btn-ghost btn-small" style={{ cursor: "pointer" }}>
                                {busy === e.id + f.k ? "Uploading…" : "Upload picture"}
                                <input type="file" accept="image/*" style={{ display: "none" }} disabled={!!busy} onChange={(ev) => { upload(e, f, ev.target.files && ev.target.files[0]); ev.target.value = ""; }} />
                              </label>
                              {(p.sitePhotos || []).length ? (
                                <select className="input" style={{ width: "auto" }} value="" onChange={(ev) => { if (ev.target.value) { setVal(ev.target.value); setPage(`x-${e.id}`); } }}>
                                  <option value="">…or use a website photo</option>
                                  {(p.sitePhotos || []).map((ph, i) => <option key={ph.url} value={ph.url}>Website photo {i + 1}</option>)}
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
                            ? <input id={`${e.id}-${f.k}`} className="input" value={val} spellCheck lang="en-GB" onFocus={() => setPage(`x-${e.id}`)} onChange={(ev) => setVal(ev.target.value)} />
                            : <textarea id={`${e.id}-${f.k}`} className="input" rows={f.kind === "lines" ? 4 : 5} value={val} spellCheck lang="en-GB" onFocus={() => setPage(`x-${e.id}`)} onChange={(ev) => setVal(ev.target.value)} />}
                        </div>
                      );
                    })}
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
      {list.length ? <p className="hint" style={{ marginTop: 12 }}>Press <b>Save changes</b> to keep added pages with the proposal and its PDF.</p> : null}
    </>
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

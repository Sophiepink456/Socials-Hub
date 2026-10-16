"use client";

// The candidate pack form: fill in each section and the pack builds alongside.
// Same route as proposals: Save draft, send for proof-reading, then the back office checks it.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { packPages } from "../../lib/candidate/pages";
import {
  CONSULTANTS, PACK_LIMITS as L, PACK_TEXT, PACK_WORDING, PACK_PHOTO_SLOTS, DEFAULT_ACCENT, DEFAULT_DARK,
  blankPack, normalisePack, emailFor, packTextFields, packFieldName, packPhotoFits, assignPackPhotos,
} from "../../lib/candidate/data";
import { STOCK_PHOTOS } from "../../lib/proposal/data";
import { PACK_STYLES, packStyle, packStyleDefaults, CORE_PACK_PAGES } from "../../lib/candidate/extra";
import { setIn, getIn, readImage, limitHit, Count, Text, Check, Section, PhotoFramer, ScaledPage, LimitModal, StartFrom, LinesBox } from "./kit";

const DRAFT_KEY = "pack-draft-v1";
const PATH = "/proposals/candidate-pack";

export default function CandidateEditor({ mode = "new", record = null, onRecord }) {
  const review = mode === "review";
  const [p, setP] = useState(() => (record ? normalisePack(record.data) : blankPack()));
  const [page, setPage] = useState("title");
  const [open, setOpen] = useState(review ? "" : "start");
  const [busy, setBusy] = useState("");
  const [siteState, setSiteState] = useState({ busy: false, msg: "" });
  const [extrasState, setExtrasState] = useState({ busy: false, msg: "" });
  const [aboutState, setAboutState] = useState({ busy: false, msg: "", draft: "" });
  const [issues, setIssues] = useState(null);
  const [checkBusy, setCheckBusy] = useState(false);
  const [submit, setSubmit] = useState(null);
  const [done, setDone] = useState("");
  const [savedDraft, setSavedDraft] = useState(null);
  const [draft, setDraft] = useState(null);
  const [draftPanel, setDraftPanel] = useState(null);
  const [draftMsg, setDraftMsg] = useState("");
  const [sendTo, setSendTo] = useState(record ? (record.submittedBy && record.submittedBy.email) || "" : "");
  const loaded = useRef(false);
  const pRef = useRef(p);
  pRef.current = p;

  useEffect(() => {
    if (review) return;
    try {
      const qs = new URLSearchParams(window.location.search);
      if (qs.get("draft") && qs.get("k")) {
        fetch(`/api/proposals/draft?id=${encodeURIComponent(qs.get("draft"))}&k=${encodeURIComponent(qs.get("k"))}`, { cache: "no-store" })
          .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
          .then(({ ok, j }) => {
            if (!ok) { setDraftMsg(j.error || "That draft link isn't valid any more."); return; }
            loading.current = true; setP(normalisePack(j.data));
            setDraft({ id: j.id, k: j.k, link: window.location.href, savedBy: j.savedBy });
            setDraftMsg(j.copy ? `You’re editing the saved copy “${j.name}”. Save draft updates the saved copy; to make a new one from it, use “Start from” on a new form instead.` : j.submitted ? "This draft has already been sent for proof-reading. Any changes here would need sending again." : `Draft opened. Last saved ${new Date(j.updatedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}.`);
          }).catch(() => setDraftMsg("Couldn't open that draft. Try the link again."));
        return;
      }
      const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
      if (d && (d.clientName || d.roleTitle || d.about)) setSavedDraft(d);
    } catch {}
  }, []);
  useEffect(() => {
    if (!loaded.current) { loaded.current = JSON.stringify(p) !== JSON.stringify(blankPack()); if (!loaded.current) return; }
    if (review) return;
    const t = setTimeout(() => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(p)); } catch {} }, 400);
    return () => clearTimeout(t);
  }, [p]);

  const set = (path, value) => setP((cur) => setIn(cur, path, value));
  const pickPhoto = (key, url) => setP((cur) => ({ ...cur, [key]: url, photoPos: { ...(cur.photoPos || {}), [key]: undefined } }));
  const f = { p, set, setPage };
  const pages = useMemo(() => packPages(p), [p]);
  const current = pages.find((x) => x.key === page) || pages[0];

  // Pages with a text column that can fill up: every page is laid out off screen and measured.
  // If a change makes a column overflow, the change is undone and the "page is full" popup shows.
  const measureRef = useRef(null);
  const lastGood = useRef(p);
  const lastFit = useRef({});
  // A whole pack being opened (draft, proposal copy, start again) is taken as it is, even if a page
  // is already too full; only later edits that make it fuller are stopped.
  const loading = useRef(true);
  useLayoutEffect(() => {
    const root = measureRef.current;
    if (!root) return;
    // How far each column runs past its space (0 = fits).
    const now = {};
    root.querySelectorAll("[data-fit]").forEach((box) => {
      const inner = box.querySelector("[data-fit-inner]");
      const k = box.getAttribute("data-fit") + "|" + (box.closest("[data-page]") || {}).getAttribute?.("data-page");
      now[k] = inner ? Math.max(0, inner.offsetHeight - box.clientHeight) : 0;
    });
    // Only a change that makes a column run further over is undone. Anything else (colours,
    // pictures, other pages, or shortening text on a page that was already too full) goes through.
    const before = lastFit.current;
    const worse = Object.keys(now).find((k) => now[k] > 1 && now[k] > (before[k] ?? 0) + 1);
    if (worse && lastGood.current !== p && !loading.current) {
      setP(lastGood.current);
      window.dispatchEvent(new CustomEvent("proposal-limit", { detail: { full: true, label: worse.split("|")[0] } }));
      return;
    }
    loading.current = false;
    lastGood.current = p;
    lastFit.current = now;
  }, [p]);

  function pickConsultant(which, name) {
    setP((cur) => {
      const c = which === 1 ? "c1" : "c2";
      const prev = cur[c];
      let next = setIn(cur, which === 1 ? "consultant1" : "consultant2", name);
      next = setIn(next, `${c}.name`, name);
      if (!prev.email || prev.email === emailFor(prev.name)) next = setIn(next, `${c}.email`, emailFor(name));
      return next;
    });
    setPage("contact");
  }

  // "Start from…": a proposal fills what matches; a pack or saved copy is copied in full.
  function startFrom(data, item) {
    loading.current = true;
    setPage("title");
    if (item.from === "candidate") {
      setP(normalisePack(data));
      return `Copied “${item.name || `${item.client} – ${item.role}`}” in full. Change the details for this role.`;
    }
    setP((cur) => normalisePack({ ...cur, ...data, coloursAuto: true }));
    // A proposal doesn't have the brand colours or homepage picture, so fetch those.
    if (data.clientWebsite) getExtras(data.clientWebsite, data.clientLogo);
    return "Copied the client, logo, About text, role details, salary, benefits, consultant and photos. Now add the parts only a candidate pack has.";
  }

  // Homepage picture for the laptop + brand colours.
  const [colourMsg, setColourMsg] = useState("");
  const [big, setBig] = useState(false);
  async function pickColoursAgain() {
    setColourMsg("Picking the brand colours…");
    try {
      const r = await fetch("/api/proposals/site-extras", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: p.clientWebsite, logo: p.clientLogo, coloursOnly: true }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      if (!j.colours) { setColourMsg("Couldn’t find brand colours on the logo or website. Choose them with the colour boxes."); return; }
      setP((cur) => ({ ...cur, accent: j.colours.accent, dark: j.colours.dark, coloursAuto: true }));
      setColourMsg(j.colours.source === "homepage" ? "Colours picked from the homepage picture." : "Colours picked from the website’s menus, backgrounds, buttons and logo.");
      setPage("about");
    } catch (e) { setColourMsg(e.message || "Couldn’t pick the colours. Try again in a moment."); }
  }

  async function getExtras(url, logo) {
    setExtrasState({ busy: true, msg: "Taking a picture of the homepage and picking the brand colours…" });
    try {
      const r = await fetch("/api/proposals/site-extras", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, logo }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setP((cur) => {
        let next = { ...cur };
        if (j.siteShot) next.siteShot = j.siteShot;
        if (j.colours && cur.coloursAuto !== false) next = { ...next, accent: j.colours.accent, dark: j.colours.dark, coloursAuto: true };
        return next;
      });
      const shotMsg = !url ? "" : j.siteShot ? "Homepage added to the About page laptop." : j.shotError || "Couldn't take a picture of the homepage.";
      const colMsg = j.colours ? (url ? "Brand colours picked." : "Brand colours picked from the logo.") : "Couldn't pick brand colours, so ours are used. Choose them below if needed.";
      setExtrasState({ busy: false, msg: `${shotMsg} ${colMsg}`.trim() });
    } catch (e) { setExtrasState({ busy: false, msg: e.message || "Couldn't read the homepage." }); }
  }

  async function findFromWebsite() {
    if (!p.clientWebsite.trim()) { setSiteState({ busy: false, msg: "Add the client's website address first." }); return; }
    setSiteState({ busy: true, msg: "Reading the website and picking photos… this takes up to a minute." });
    draftAbout();
    const extras = getExtras(p.clientWebsite, p.clientLogo);
    try {
      const res = await fetch("/api/proposals/scrape", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: p.clientWebsite, company: p.clientName }) });
      const r = await res.json();
      if (!res.ok) throw new Error(r.error || "Couldn't read that website.");
      const placed = assignPackPhotos(r.photos || []);
      setP((cur) => ({ ...cur, sitePhotos: r.photos || [], ...placed, ...(r.logo && !cur.clientLogo ? { clientLogo: r.logo } : {}) }));
      const n = (r.photos || []).length, k = Object.keys(placed).length;
      setSiteState({ busy: false, msg: `${n ? `Found ${n} usable photo${n === 1 ? "" : "s"} and placed ${k} of ${PACK_PHOTO_SLOTS.length}.` : "No usable photos on that site, so our own photos stay in."} ${r.logo ? `Logo found (${r.logoSource}).` : "No logo found. Please upload it below."} Swap any picture in section 10.` });
      // Colours are best taken from the logo, which may only just have been found.
      await extras;
      if (r.logo && !p.clientLogo) getExtras("", r.logo).then(() => {}).catch(() => {});
      setPage("title");
    } catch (e) { setSiteState({ busy: false, msg: e.message }); }
  }

  async function draftAbout() {
    if (!p.clientWebsite.trim()) { setAboutState({ busy: false, msg: "Add the client's website address first (section 2).", draft: "" }); return; }
    setAboutState({ busy: true, msg: "Writing the About section from the client's website…", draft: "" });
    try {
      const res = await fetch("/api/proposals/about", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: p.clientWebsite, company: p.clientName }) });
      const r = await res.json();
      if (!res.ok) throw new Error(r.error || "Couldn't write the About section.");
      if (!r.about || !r.about.trim()) throw new Error("The draft came back empty. Please try again.");
      if (!(pRef.current.about || "").trim()) { set("about", r.about.slice(0, L.about)); setAboutState({ busy: false, msg: "Drafted from the client's website. Read it through and edit anything that isn't right.", draft: "" }); }
      else setAboutState({ busy: false, msg: "A new draft from the website is ready. Your current text has been kept.", draft: r.about.slice(0, L.about) });
    } catch (e) { setAboutState({ busy: false, msg: e.message, draft: "" }); }
  }

  async function saveDraft(who) {
    setBusy("Saving draft…"); setDraftMsg("");
    try {
      const res = await fetch("/api/proposals/draft", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: draft && draft.id, key: draft && draft.k, proposal: p, name: who && who.name, email: who && who.email }) });
      const r = await res.json();
      if (!res.ok) throw new Error(r.error);
      setDraft({ id: r.id, k: r.k, link: r.link, savedBy: (draft && draft.savedBy) || who });
      setDraftPanel(null);
      try { window.history.replaceState(null, "", `${PATH}?draft=${r.id}&k=${r.k}`); } catch {}
      try { localStorage.removeItem(DRAFT_KEY); } catch {}
      const t = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      setDraftMsg(r.emailed ? `Draft saved at ${t}. We've emailed you a link so you can carry on from any computer.` : `Draft saved at ${t}.`);
    } catch (e) { setDraftMsg(e.message || "Couldn't save the draft. Try again in a moment."); } finally { setBusy(""); }
  }

  function startAgain() {
    if (!confirm("Clear this candidate pack and start a new one?")) return;
    loading.current = true; setP(blankPack()); setPage("title"); setOpen("start"); setDraft(null); setDraftMsg(""); setIssues(null);
    try { window.history.replaceState(null, "", PATH); } catch {}
  }

  async function runCheck() {
    setCheckBusy(true);
    try {
      const res = await fetch("/api/proposals/proofread", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields: packTextFields(p) }) });
      const r = await res.json();
      if (!res.ok) throw new Error(r.error);
      setIssues(r.issues || []);
      return r.issues || [];
    } catch (e) { alert(e.message || "The check didn't work this time."); return null; } finally { setCheckBusy(false); }
  }
  function applyFix(i) {
    const it = issues[i];
    set(it.field, String(getIn(p, it.field) || "").replace(it.find, it.replace));
    setIssues(issues.filter((_, j) => j !== i));
  }

  async function sendForProofing() {
    if (!submit.email.trim()) { alert("Add your email so the finished pack can come back to you."); return; }
    setBusy("Sending…");
    try {
      const res = await fetch("/api/proposals/submit", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposal: p, submitter: submit, draft: draft ? { id: draft.id, k: draft.k } : null }) });
      const r = await res.json();
      if (!res.ok) throw new Error(r.error);
      setSubmit(null);
      try { localStorage.removeItem(DRAFT_KEY); } catch {}
      setDone("Sent for proof-reading. You'll get the finished PDF by email once it's been checked.");
    } catch (e) { alert(e.message || "Sorry, it didn't send. Try again in a moment."); } finally { setBusy(""); }
  }

  async function reviewAction(action, label) {
    if (action === "send-consultant" && !sendTo.trim()) { alert("Add the consultant's email."); return; }
    setBusy(label);
    try {
      const res = await fetch(`/api/proposals/${record.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ k: record.key, action, data: p, to: sendTo }) });
      const r = await res.json();
      if (!res.ok) throw new Error(r.error);
      onRecord && onRecord(r);
      setDone(action === "save" ? "Changes saved and the PDF updated." : action === "send-check" ? "Sent to the final checker." : `Sent to ${sendTo}.`);
    } catch (e) { alert(e.message || "Something went wrong."); } finally { setBusy(""); }
  }

  async function downloadPdf() {
    setBusy("Building PDF…");
    try {
      const res = await fetch("/api/proposals/pdf", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ proposal: p }) });
      if (!res.ok) throw new Error(await res.text());
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url; a.download = `Candidate Pack - ${(p.clientName || "Client").trim()} - ${(p.roleTitle || "Role").trim()}.pdf`.replace(/[\\/:*?"<>|]+/g, "");
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch { alert("Sorry, the PDF didn't build. Try again in a moment."); } finally { setBusy(""); }
  }

  const two = !!p.twoConsultants;
  const SECTION_PAGE = { start: "title", client: "title", consultants: "contact", about: "about", role: "role", key: "key", looking: "looking", offer: "offer", opportunity: "opportunity", pictures: "title", wording: "next", pages: "title" };
  const toggle = (k) => { if (open !== k && SECTION_PAGE[k]) setPage(SECTION_PAGE[k]); setOpen((o) => (o === k ? "" : k)); };
  const setColour = (k, v) => setP((cur) => ({ ...cur, [k]: v, coloursAuto: false }));

  return (
    <div className="peditor">
      <LimitModal />
      <div className="pform">
        {savedDraft && !review ? (
          <div className="done-msg" style={{ marginBottom: 14 }}>
            You have an unfinished candidate pack{savedDraft.clientName ? ` for ${savedDraft.clientName}` : ""}{savedDraft.roleTitle ? ` (${savedDraft.roleTitle})` : ""}.{" "}
            <button type="button" className="link" onClick={() => { loading.current = true; setP(normalisePack(savedDraft)); setSavedDraft(null); }}>Carry on with it</button>
            {" or "}
            <button type="button" className="link" onClick={() => { try { localStorage.removeItem(DRAFT_KEY); } catch {} setSavedDraft(null); }}>start fresh</button>.
          </div>
        ) : null}

        {!review ? (
          <Section title="1. Start from one already made (optional)" open={open === "start"} onToggle={() => toggle("start")} done>
            <p className="hint" style={{ marginTop: 0 }}>Start from a candidate pack or saved copy (copies everything), or from a proposal for the same client and role (copies the client, logo, About text, role details, salary, benefits, consultant and photos).</p>
            <StartFrom target="candidate" onPick={startFrom} />
          </Section>
        ) : null}

        <Section title={`${review ? 1 : 2}. Client & role`} open={open === "client"} onToggle={() => toggle("client")} done={!!(p.clientName && p.roleTitle)}>
          <Text label="Client name" path="clientName" max={L.clientName} page="about" placeholder="e.g. Mail Metrics" {...f} />
          <Text label="Role title" path="roleTitle" max={L.roleTitle} page="title" placeholder="e.g. Manufacturing Manager" {...f} hint="The big heading on the title page." />
          <Text label="Client website" path="clientWebsite" type="url" page="title" placeholder="e.g. www.mailmetrics.com" {...f} />
          <div className="row">
            <button type="button" className="btn btn-ghost btn-small" onClick={findFromWebsite} disabled={siteState.busy}>
              {siteState.busy ? "Looking…" : "Get photos, logo, colours & About text from the website"}
            </button>
            {siteState.msg ? (
              <div className="hint">{siteState.msg}{!siteState.busy && /photo/i.test(siteState.msg) ? <div style={{ marginTop: 6 }}><strong>Note: Marketing will finalise all imagery and upload more images should there not be enough from the client’s website.</strong></div> : null}</div>
            ) : <div className="hint">Pulls the client’s logo and photos, takes a picture of their homepage for the About page, picks their brand colours and drafts the About section.</div>}
            {extrasState.msg ? <div className="hint">{extrasState.msg}</div> : null}
          </div>
          <div className="row">
            <label className="label"><span>Client logo <span className="opt">(found automatically, or upload a PNG/SVG)</span></span></label>
            <input type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp" onChange={async (e) => {
              const file = e.target.files && e.target.files[0];
              if (!file) return;
              set("clientLogo", await readImage(file, 1200, "image/png")); setPage("title");
            }} />
            {p.clientLogo ? (
              <div className="logo-row" style={{ background: "#333" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.clientLogo} alt="Client logo" />
                <button type="button" className="link" style={{ color: "#fff" }} onClick={() => set("clientLogo", "")}>Remove</button>
              </div>
            ) : null}
          </div>
          {p.clientLogo ? (
            <div className="row">
              <label className="label" htmlFor="logoSize"><span>Logo size <span className="opt">({Number(p.logoSize) || 100}%)</span></span></label>
              <input id="logoSize" type="range" min={60} max={250} step={5} value={Number(p.logoSize) || 100} style={{ width: "100%" }} onChange={(e) => { set("logoSize", Number(e.target.value)); setPage("title"); }} />
            </div>
          ) : null}
          <Check label="Keep the logo’s own colours (otherwise it’s shown in white)" path="logoColour" page="title" {...f}
            hint="The logo sits on a dark background, so use white if the logo has dark lettering." />
          <div className="row">
            <label className="label"><span>Brand colours</span></label>
            <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "center" }}>
              <label className="check" style={{ gap: 8 }}>
                <ColourBox value={p.accent || DEFAULT_ACCENT} onPick={(v) => { setColour("accent", v); setPage("role"); }} />
                Accent <span className="opt">(full stops, icons, lines)</span>
              </label>
              <label className="check" style={{ gap: 8 }}>
                <ColourBox value={p.dark || DEFAULT_DARK} onPick={(v) => { setColour("dark", v); setPage("about"); }} />
                Dark <span className="opt">(About panel, End page)</span>
              </label>
            </div>
            <div className="hint">
              {p.coloursAuto ? "Picked automatically from the client’s logo or website. " : ""}
              <button type="button" className="link" disabled={colourMsg === "Picking the brand colours…" || !(p.clientWebsite || p.clientLogo)} onClick={pickColoursAgain}>Pick from the website again</button>
              {" · "}
              <button type="button" className="link" onClick={() => setP((c) => ({ ...c, accent: DEFAULT_ACCENT, dark: DEFAULT_DARK, coloursAuto: false }))}>Use Elevation colours</button>
              {colourMsg ? <div style={{ marginTop: 4 }}>{colourMsg}</div> : null}
            </div>
          </div>
        </Section>

        <Section title={`${review ? 2 : 3}. Consultant(s)`} open={open === "consultants"} onToggle={() => toggle("consultants")} done={!!p.consultant1}>
          <div className="row">
            <label className="label" htmlFor="pc1"><span>Consultant</span></label>
            <select id="pc1" className="select" value={p.consultant1} onChange={(e) => pickConsultant(1, e.target.value)}>
              <option value="">Select a consultant</option>
              {CONSULTANTS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <Check label="Two consultants on this pack" path="twoConsultants" page="contact" {...f} />
          {two ? (
            <div className="row">
              <label className="label" htmlFor="pc2"><span>Second consultant</span></label>
              <select id="pc2" className="select" value={p.consultant2} onChange={(e) => pickConsultant(2, e.target.value)}>
                <option value="">Select a consultant</option>
                {CONSULTANTS.filter((n) => n !== p.consultant1).map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          ) : null}
          {[1, ...(two ? [2] : [])].map((n) => (
            <div key={n} className="subgroup">
              <h3 className="group-title">{(n === 1 ? p.consultant1 : p.consultant2) || (n === 1 ? "Consultant" : "Second consultant")}</h3>
              <Text label="Job title" path={`c${n}.title`} max={L.consultantTitle} page="contact" placeholder="e.g. Associate Director" {...f} />
              <Text label="Phone" path={`c${n}.phone`} max={L.phone} page="contact" placeholder="e.g. 07740 406 126" {...f} />
              <Text label="Email" path={`c${n}.email`} max={L.email} page="contact" {...f} />
            </div>
          ))}
          <div className="hint">Headshots are added automatically.</div>
        </Section>

        <Section title={`${review ? 3 : 4}. About ${p.clientName || "the client"}`} open={open === "about"} onToggle={() => toggle("about")} done={!!p.about}>
          <Text label="About the client" path="about" max={L.about} multiline rows={12} page="about" {...f} hint="Start a new line for a new paragraph." />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginTop: -6 }}>
            <button type="button" className="btn btn-ghost btn-small" onClick={draftAbout} disabled={aboutState.busy}>{aboutState.busy ? "Writing…" : p.about ? "Redraft from the website" : "Draft from the website"}</button>
            {aboutState.draft ? <button type="button" className="btn btn-primary btn-small" onClick={() => { set("about", aboutState.draft); setAboutState({ busy: false, msg: "Replaced with the website draft. Edit as needed.", draft: "" }); setPage("about"); }}>Use the new draft</button> : null}
          </div>
          {aboutState.msg ? <div className="hint">{aboutState.msg}</div> : null}
          {aboutState.draft ? <div className="hint" style={{ whiteSpace: "pre-line", background: "#f6f6f6", padding: 10, borderRadius: 8 }}>{aboutState.draft}</div> : null}
          <div className="row" style={{ marginTop: 14 }}>
            <label className="label"><span>Homepage on the laptop</span></label>
            {p.siteShot ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.siteShot} alt="" style={{ width: 240, borderRadius: 6, border: "1px solid #ddd", display: "block" }} />
            ) : <div className="hint">Added automatically when you use the website button.</div>}
            <div className="actions" style={{ marginTop: 6 }}>
              <label className="btn btn-ghost btn-small" style={{ cursor: "pointer" }}>Upload a screenshot instead
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={async (e) => { const file = e.target.files && e.target.files[0]; if (file) { set("siteShot", await readImage(file, 1800)); setPage("about"); } e.target.value = ""; }} />
              </label>
              {p.clientWebsite ? <button type="button" className="link" disabled={extrasState.busy} onClick={() => getExtras(p.clientWebsite, "")}>{extrasState.busy ? "Taking it…" : "Take it again"}</button> : null}
            </div>
          </div>
        </Section>

        <Section title={`${review ? 4 : 5}. The Opportunity`} open={open === "opportunity"} onToggle={() => toggle("opportunity")} done={!!p.opportunity}>
          <Text label="The opportunity" path="opportunity" max={L.opportunity} multiline rows={10} page="opportunity" {...f}
            hint="Why the role exists and why it’s a good move. Start a new line for a new paragraph." />
        </Section>

        <Section title={`${review ? 5 : 6}. The Role`} open={open === "role"} onToggle={() => toggle("role")} done={!!(p.jobTitle && p.roleProfile)}>
          <Text label="Job title" path="jobTitle" max={L.jobTitle} page="role" {...f} />
          <Text label="Location" path="location" max={L.location} page="role" placeholder="e.g. Huddersfield or Leicester" {...f} />
          <Text label="Reporting to" path="reportingTo" max={L.reportingTo} page="role" {...f} />
          {!p.noDirectReports ? <Text label="Direct reports" path="directReports" max={L.directReports} page="role" {...f} /> : null}
          <Check label="No direct reports (remove this line)" path="noDirectReports" page="role" {...f} />
          <Text label="Role profile" path="roleProfile" max={L.roleProfile} multiline rows={10} page="role" {...f} hint="Start a new line for a new paragraph." />
        </Section>

        <Section title={`${review ? 6 : 7}. Key Responsibilities`} open={open === "key"} onToggle={() => toggle("key")} done={(p.keyPoints || []).some((x) => String(x).trim())}>
          <Text label="Intro paragraph" path="keyText" max={L.keyText} multiline rows={4} page="key" optional {...f} hint="Shown above the bullet points. The page stops taking more text once it’s full." />
          <LinesBox label="Responsibilities" path="keyPoints" max={L.points} each={L.point} placeholder="Responsibility" page="key" {...f} />
        </Section>

        <Section title={`${review ? 7 : 8}. What We’re Looking For`} open={open === "looking"} onToggle={() => toggle("looking")} done={(p.lookingPoints || []).some((x) => String(x).trim())}>
          <Text label="Intro paragraph" path="lookingText" max={L.lookingText} multiline rows={4} page="looking" optional {...f} hint="Shown above the bullet points. The page stops taking more text once it’s full." />
          <LinesBox label="Skills and attributes" path="lookingPoints" max={L.points} each={L.point} placeholder="Point" page="looking" {...f} />
          <Text label="Closing line under the points" path="lookingOutro" max={L.lookingOutro} multiline rows={3} page="looking" optional {...f}
            placeholder="e.g. Experience within food manufacturing would be particularly beneficial." />
        </Section>

        <Section title={`${review ? 8 : 9}. What’s on Offer`} open={open === "offer"} onToggle={() => toggle("offer")} done={!!(p.salary && p.why)}>
          <Text label="Salary" path="salary" max={L.salary} page="offer" placeholder="e.g. £80,000 - £90,000" {...f} />
          <Text label="Contract" path="contract" max={L.contract} multiline rows={2} page="offer" placeholder="e.g. Permanent afternoon shift: Monday–Thursday, 2pm–Midnight" {...f} hint="Longer lines wrap underneath on the page." />
          <LinesBox label="Benefits" path="benefits" max={L.benefits} each={L.benefit} placeholder="Benefit" page="offer" {...f} />
          <Text label="Why this role stands out" path="why" max={L.why} multiline rows={7} page="offer" {...f} />
        </Section>

        <Section title={`${review ? 9 : 10}. Pictures`} open={open === "pictures"} onToggle={() => toggle("pictures")} done>
          <p className="hint" style={{ marginTop: 0 }}>Photos from the client’s website come first, then ours. Faded ones are too small for that spot and would look blurry.</p>
          {PACK_PHOTO_SLOTS.map((s) => (
            <div key={s.key} className="row">
              <label className="label"><span>{s.label}</span></label>
              <div className="photo-pick">
                {(p.sitePhotos || []).map((ph) => {
                  const fits = packPhotoFits(ph, s);
                  return (
                    <button key={ph.url} type="button" disabled={!fits} title={fits ? "From the client’s website" : "Too small for this spot"}
                      className={"thumb site" + (p[s.key] === ph.url ? " on" : "") + (fits ? "" : " small")} onClick={() => { pickPhoto(s.key, ph.url); setPage(s.page); }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ph.url} alt="" loading="lazy" />
                    </button>
                  );
                })}
                {STOCK_PHOTOS.map((src) => (
                  <button key={src} type="button" className={"thumb" + (p[s.key] === src ? " on" : "")} onClick={() => { pickPhoto(s.key, src); setPage(s.page); }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" loading="lazy" />
                  </button>
                ))}
                <label className="thumb upload" title="Upload a photo">
                  <input type="file" accept="image/*" onChange={async (e) => { const file = e.target.files && e.target.files[0]; if (file) { pickPhoto(s.key, await readImage(file)); setPage(s.page); } }} />
                  +
                </label>
              </div>
              {p[s.key] ? <PhotoFramer src={p[s.key]} slot={s} pos={(p.photoPos || {})[s.key]} onChange={(pos) => { setP((cur) => ({ ...cur, photoPos: { ...(cur.photoPos || {}), [s.key]: pos } })); setPage(s.page); }} /> : null}
            </div>
          ))}
        </Section>

        {review ? (
          <Section title={`Edit page wording${Object.keys(p.pageText || {}).length ? ` (${Object.keys(p.pageText).length} changed)` : ""} (back office only)`} open={open === "wording"} onToggle={() => toggle("wording")} done>
            <PackWording p={p} setP={setP} setPage={setPage} />
          </Section>
        ) : null}
        {review ? (
          <Section title={`Add or remove pages${(p.extraPages || []).length || (p.hiddenPages || []).length ? ` (${(p.extraPages || []).length} added, ${(p.hiddenPages || []).length} removed)` : ""} (back office only)`} open={open === "pages"} onToggle={() => toggle("pages")} done>
            <PackPagesEditor p={p} setP={setP} setPage={setPage} pages={pages} />
          </Section>
        ) : null}

        {issues ? (
          <div className="issues">
            <div className="issues-head">{issues.length ? `${issues.length} thing${issues.length === 1 ? "" : "s"} to check` : "No spelling or grammar mistakes found."}</div>
            {issues.map((it, i) => (
              <div key={i} className="issue">
                <div className="issue-field">{packFieldName(it.field)}</div>
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
              <div className="row"><label className="label"><span>Your name</span></label><input className="input" value={submit.name} onChange={(e) => setSubmit({ ...submit, name: e.target.value })} /></div>
              <div className="row"><label className="label"><span>Your email (the finished PDF comes back here)</span></label><input className="input" type="email" value={submit.email} onChange={(e) => setSubmit({ ...submit, email: e.target.value })} /></div>
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
            <div className="actions"><button type="button" className="btn btn-primary" onClick={() => reviewAction("send-check", "Sending…")} disabled={!!busy}>{busy || "Send to final checker"}</button></div>
            <div className="row" style={{ marginTop: 10 }}>
              <label className="label"><span>Consultant’s email</span></label>
              <input className="input" type="email" value={sendTo} onChange={(e) => setSendTo(e.target.value)} />
            </div>
            <div className="actions">
              <button type="button" className="btn btn-primary" onClick={() => { if (confirm(`Send the finished candidate pack to ${sendTo}?`)) reviewAction("send-consultant", "Sending…"); }} disabled={!!busy}>Send to consultant</button>
              <button type="button" className="btn btn-ghost" onClick={downloadPdf} disabled={!!busy}>Download PDF</button>
            </div>
          </>
        ) : (
          <>
            <div className="actions">
              <button type="button" className="btn btn-ghost" onClick={runCheck} disabled={checkBusy}>{checkBusy ? "Checking…" : "Check spelling & grammar"}</button>
              <button type="button" className="btn btn-ghost" disabled={!!busy} onClick={() => { if (draft) saveDraft(null); else setDraftPanel({ name: p.consultant1 || "", email: p.c1.email || emailFor(p.consultant1) || "" }); }}>
                {busy === "Saving draft…" ? busy : "Save draft"}
              </button>
            </div>
            {draftPanel ? (
              <div className="psec open send-panel">
                <div className="psec-body" style={{ borderTop: 0 }}>
                  <h3 className="group-title" style={{ marginTop: 0 }}>Save draft</h3>
                  <p className="hint" style={{ marginTop: 0 }}>We’ll email you a link so you can carry on from any computer.</p>
                  <div className="row"><label className="label"><span>Your name</span></label><input className="input" value={draftPanel.name} onChange={(e) => setDraftPanel({ ...draftPanel, name: e.target.value })} /></div>
                  <div className="row"><label className="label"><span>Your email</span></label><input className="input" type="email" value={draftPanel.email} onChange={(e) => setDraftPanel({ ...draftPanel, email: e.target.value })} /></div>
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
              <button type="button" className="btn btn-ghost" onClick={startAgain}>Start a new pack</button>
            </div>
            <p className="hint">{draft ? "Press Save draft to update your saved copy." : "Your work is kept in this browser as you go. Save draft keeps a copy you can open from any computer."}</p>
          </>
        )}
      </div>

      <div className="ppreview">
        <div className="ptabs">
          {pages.map((pg, i) => (
            <button key={pg.key} type="button" className={"tab" + (pg.key === current.key ? " on" : "")} onClick={() => setPage(pg.key)}>{i + 1}. {pg.label}</button>
          ))}
        </div>
        <ScaledPage>{current.el}</ScaledPage>
        <div aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, overflow: "hidden", visibility: "hidden", pointerEvents: "none" }}>
          <div ref={measureRef} style={{ width: 1920 }}>{pages.map((pg) => <div key={pg.key} data-page={pg.key}>{pg.el}</div>)}</div>
        </div>
        <div className="preview-note">Page {pages.indexOf(current) + 1} of {pages.length} · 1920 × 1080 · <button type="button" className="link" onClick={() => setBig(true)}>View full size</button></div>
        {big ? <FullSize onClose={() => setBig(false)}>{current.el}</FullSize> : null}
      </div>
    </div>
  );
}

// The page at (nearly) its real size. Small previews make thin text look heavier on some
// screens, so this is the way to check the typography against the design.
function FullSize({ onClose, children }) {
  useEffect(() => {
    const k = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div role="dialog" aria-label="Full size page" onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.82)", overflow: "auto", padding: 20, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: "min(1920px, 100%)", flex: "none" }} onClick={(e) => e.stopPropagation()}>
        <ScaledPage>{children}</ScaledPage>
      </div>
      <button type="button" className="btn btn-ghost" style={{ marginTop: 14, background: "#fff" }} onClick={onClose}>Close</button>
    </div>
  );
}

// Back office: change the standard wording on any page of this pack. Blank = standard.
function PackWording({ p, setP, setPage }) {
  const [openKey, setOpenKey] = useState("");
  const tx = p.pageText || {};
  function setField(k, v) {
    setP((cur) => {
      const next = { ...(cur.pageText || {}) };
      if (!String(v).trim() || v === PACK_TEXT[k]) delete next[k]; else next[k] = v;
      return { ...cur, pageText: next };
    });
  }
  return (
    <>
      <p className="hint" style={{ marginTop: 0 }}>Each box starts with the standard wording. Change it for this pack only; clear a box to go back to the standard. In headings, put * around the words shown in the client’s colour, e.g. Key *Responsibilities*. Press <b>Save changes</b> to keep it.</p>
      {PACK_WORDING.filter((w) => w.fields.length).map((w) => {
        const changed = w.fields.filter(([k]) => tx[k] != null).length;
        const isOpen = openKey === w.page;
        return (
          <div key={w.page} className="panel" style={{ padding: 14, marginTop: 10 }}>
            <div className="row" style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 0 }}>
              <button type="button" className="link" style={{ fontWeight: 700, textAlign: "left" }} onClick={() => { setOpenKey(isOpen ? "" : w.page); setPage(w.page); }}>
                {isOpen ? "–" : "+"} {w.label}{changed ? ` · ${changed} change${changed === 1 ? "" : "s"}` : ""}
              </button>
              {changed ? <button type="button" className="link muted" onClick={() => setP((cur) => { const next = { ...(cur.pageText || {}) }; w.fields.forEach(([k]) => delete next[k]); return { ...cur, pageText: next }; })}>Reset page</button> : null}
            </div>
            {isOpen ? (
              <div style={{ marginTop: 12 }}>
                {w.fields.map(([k, label, max, area]) => {
                  const val = tx[k] != null ? tx[k] : PACK_TEXT[k];
                  const onChange = (v) => { if (v.length > max) { limitHit(label, max, v.length); v = v.slice(0, max); } setField(k, v); };
                  return (
                    <div key={k} className="row">
                      <label className="label" htmlFor={`pw-${k}`}><span>{label}{tx[k] != null ? " · changed" : ""}</span><Count value={val} max={max} /></label>
                      {area ? <textarea id={`pw-${k}`} className="input" rows={3} value={val} spellCheck lang="en-GB" onFocus={() => setPage(w.page)} onChange={(e) => onChange(e.target.value)} />
                        : <input id={`pw-${k}`} className="input" value={val} spellCheck lang="en-GB" onFocus={() => setPage(w.page)} onChange={(e) => onChange(e.target.value)} />}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
}

// Back office: take standard pages out, and add pages built from the pack's own page designs.
function PackPagesEditor({ p, setP, setPage, pages }) {
  const [howMany, setHowMany] = useState(1);
  const [openId, setOpenId] = useState("");
  const [busy, setBusy] = useState("");
  const list = p.extraPages || [];
  const hidden = new Set(p.hiddenPages || []);
  const update = (id, fn) => setP((cur) => ({ ...cur, extraPages: (cur.extraPages || []).map((e) => (e.id === id ? fn(e) : e)) }));

  function add() {
    const fresh = Array.from({ length: howMany }, () => ({ id: Math.random().toString(36).slice(2, 10), style: "", after: "beforeEnd", name: "", v: {}, photoPos: {} }));
    setP((cur) => ({ ...cur, extraPages: [...(cur.extraPages || []), ...fresh] }));
    setOpenId(fresh[0].id);
  }
  function remove(id) {
    if (!confirm("Remove this added page?")) return;
    setP((cur) => {
      const gone = (cur.extraPages || []).find((e) => e.id === id);
      return { ...cur, extraPages: (cur.extraPages || []).filter((e) => e.id !== id).map((e) => (e.after === id ? { ...e, after: gone ? gone.after : "beforeEnd" } : e)) };
    });
  }
  function chooseStyle(e, style) {
    if (e.style && Object.keys(e.v || {}).length && !confirm("Changing the design starts this page again with that page’s wording. Carry on?")) return;
    update(e.id, (x) => ({ ...x, style, v: style ? packStyleDefaults(style, p) : {}, photoPos: {} }));
    if (style) setPage(`x-${e.id}`);
  }
  async function upload(e, f, file) {
    if (!file) return;
    setBusy(e.id + f.k);
    try {
      const dataUrl = await readImage(file, 2400);
      const r = await fetch("/api/proposals/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataUrl }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      update(e.id, (x) => ({ ...x, v: { ...x.v, [f.k]: j.url }, photoPos: { ...(x.photoPos || {}), [f.k]: undefined } }));
      setPage(`x-${e.id}`);
    } catch (err) { alert(err.message || "Couldn't upload that picture."); } finally { setBusy(""); }
  }
  return (
    <>
      <h4 className="group-title" style={{ fontSize: 15, marginTop: 0 }}>Standard pages</h4>
      <p className="hint" style={{ marginTop: 0 }}>Untick a page to leave it out of this pack. Tick it again to put it back.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "4px 16px", marginBottom: 18 }}>
        {CORE_PACK_PAGES.map(([k, label]) => (
          <label key={k} className="check" style={{ opacity: hidden.has(k) ? 0.55 : 1 }}>
            <input type="checkbox" checked={!hidden.has(k)} disabled={k === "title"} onChange={(ev) => {
              const keep = ev.target.checked;
              setP((cur) => { const h = new Set(cur.hiddenPages || []); if (keep) h.delete(k); else h.add(k); return { ...cur, hiddenPages: [...h] }; });
              if (keep) setPage(k);
            }} />
            {label}{hidden.has(k) ? " (removed)" : ""}
          </label>
        ))}
      </div>
      <h4 className="group-title" style={{ fontSize: 15 }}>Added pages</h4>
      <p className="hint" style={{ marginTop: 0 }}>Add pages using any of the candidate pack’s page designs. Each new page starts as a copy of that page in this pack; change any words and pictures, and choose where it goes.</p>
      <div className="row" style={{ flexDirection: "row", alignItems: "flex-end", gap: 10, flexWrap: "wrap" }}>
        <div>
          <label className="label" htmlFor="pack-howmany"><span>How many pages to add?</span></label>
          <select id="pack-howmany" className="input" style={{ width: 120 }} value={howMany} onChange={(ev) => setHowMany(Number(ev.target.value))}>
            {Array.from({ length: 10 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
          </select>
        </div>
        <button type="button" className="btn btn-primary btn-small" onClick={add}>Add {howMany === 1 ? "page" : `${howMany} pages`}</button>
      </div>
      {list.map((e, n) => {
        const st = packStyle(e.style);
        const isOpen = openId === e.id;
        const key = `x-${e.id}`;
        const pageNo = pages.findIndex((pg) => pg.key === key) + 1;
        const where = pages.filter((pg) => pg.key !== key && pg.key !== "end");
        return (
          <div key={e.id} className="panel" style={{ padding: 16, marginTop: 14 }}>
            <div className="row" style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 0 }}>
              <button type="button" className="link" style={{ fontWeight: 700, textAlign: "left" }} onClick={() => { setOpenId(isOpen ? "" : e.id); if (st) setPage(key); }}>
                {isOpen ? "–" : "+"} Added page {n + 1}{st ? `: ${e.name || st.label}` : " (choose a design)"}{pageNo > 0 ? ` · page ${pageNo} of ${pages.length}` : ""}
              </button>
              <button type="button" className="link muted" onClick={() => remove(e.id)}>Remove</button>
            </div>
            {isOpen ? (
              <div style={{ marginTop: 12 }}>
                <div className="row">
                  <label className="label"><span>Page design</span></label>
                  <select className="input" value={e.style} onChange={(ev) => chooseStyle(e, ev.target.value)}>
                    <option value="">Choose a page design…</option>
                    {PACK_STYLES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
                {st ? (
                  <>
                    <div className="row">
                      <label className="label"><span>Where it goes</span></label>
                      <select className="input" value={e.after || "beforeEnd"} onChange={(ev) => { const val = ev.target.value; update(e.id, (x) => ({ ...x, after: val })); setPage(key); }}>
                        <option value="beforeEnd">Before the end page</option>
                        {where.map((pg) => <option key={pg.key} value={pg.key.startsWith("x-") ? pg.key.slice(2) : pg.key}>After page {pages.indexOf(pg) + 1}: {pg.label}</option>)}
                      </select>
                    </div>
                    <div className="row">
                      <label className="label"><span>Name on the page tab</span></label>
                      <input className="input" value={e.name || ""} placeholder={st.label} maxLength={40} onChange={(ev) => { const val = ev.target.value; update(e.id, (x) => ({ ...x, name: val })); }} />
                    </div>
                    <h4 className="group-title" style={{ fontSize: 15 }}>Words and pictures on this page</h4>
                    {st.fields.map((f) => {
                      const val = e.v && e.v[f.k] !== undefined ? e.v[f.k] : f.def(p);
                      const setVal = (nv) => {
                        if (f.max && typeof nv === "string" && nv.length > f.max) { limitHit(f.label, f.max, nv.length); nv = nv.slice(0, f.max); }
                        update(e.id, (x) => ({ ...x, v: { ...x.v, [f.k]: nv } }));
                      };
                      if (f.kind === "image") {
                        return (
                          <div key={f.k} className="row">
                            <label className="label"><span>{f.label}</span></label>
                            {val ? <PhotoFramer src={val} slot={{ w: f.w, h: f.h }} pos={(e.photoPos || {})[f.k]}
                              onChange={(pos) => { update(e.id, (x) => ({ ...x, photoPos: { ...(x.photoPos || {}), [f.k]: pos } })); setPage(key); }} /> : <div className="hint">No picture.</div>}
                            <div className="actions" style={{ marginTop: 6 }}>
                              <label className="btn btn-ghost btn-small" style={{ cursor: "pointer" }}>
                                {busy === e.id + f.k ? "Uploading…" : "Upload picture"}
                                <input type="file" accept="image/*" style={{ display: "none" }} disabled={!!busy} onChange={(ev) => { upload(e, f, ev.target.files && ev.target.files[0]); ev.target.value = ""; }} />
                              </label>
                              {[...(p.sitePhotos || []).map((ph) => ph.url), ...STOCK_PHOTOS].length && f.k !== "siteShot" ? (
                                <select className="input" style={{ width: "auto" }} value="" onChange={(ev) => { if (ev.target.value) { setVal(ev.target.value); setPage(key); } }}>
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
                            ? <input id={`${e.id}-${f.k}`} className="input" value={val} spellCheck lang="en-GB" onFocus={() => setPage(key)} onChange={(ev) => setVal(ev.target.value)} />
                            : <textarea id={`${e.id}-${f.k}`} className="input" rows={f.kind === "lines" ? 6 : 4} value={val} spellCheck lang="en-GB" onFocus={() => setPage(key)} onChange={(ev) => setVal(ev.target.value)} />}
                        </div>
                      );
                    })}
                    {e.style === "contact" ? <div className="hint">The consultants and their details come from section 2.</div> : null}
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
      {list.length ? <p className="hint" style={{ marginTop: 12 }}>Press <b>Save changes</b> to keep added pages with the pack and its PDF.</p> : null}
    </>
  );
}

// A colour box. Dragging round the colour picker updates the pack a moment after you stop,
// so the preview keeps up instead of redrawing every page on every tiny move.
function ColourBox({ value, onPick }) {
  const [v, setV] = useState(value);
  const t = useRef(null);
  useEffect(() => { setV(value); }, [value]);
  useEffect(() => () => clearTimeout(t.current), []);
  return (
    <input type="color" value={v} style={{ width: 44, height: 32, padding: 0, border: 0, background: "none", cursor: "pointer" }}
      onChange={(e) => { const nv = e.target.value; setV(nv); clearTimeout(t.current); t.current = setTimeout(() => onPick(nv), 150); }} />
  );
}

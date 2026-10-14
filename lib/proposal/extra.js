// Extra pages added in the back office. Each one copies an existing page style; every piece of
// text and every picture on it can be changed, and it can go anywhere in the document.
// Page numbers and the Contents page include them automatically.
import { APPROACH, APPROACH_INTRO, SEARCH, TERMS_POINTS, NEXT_STEPS, PAYMENT_TERMS, PAYMENT_NOTE, SECTIONS, LIMITS, sectionsFor, appendices } from "./data";

const sectionDesc = (id) => (SECTIONS.find((s) => s.id === id) || {}).desc || "";

// Field kinds: text (one line), area (paragraphs), lines (one item per line), image.
// `to` says where the value goes: tx.* = page wording, p.* = the proposal field the style reads,
// bo.* / cp.* = back-office pictures, c1.* / c2.* = consultant details.
export const EXTRA_STYLES = [
  { id: "title", label: "Title page", numbered: false, fields: [
    { k: "title1", label: "Heading (green part)", kind: "text", to: "tx.title1", def: () => "Recruitment" },
    { k: "title2", label: "Heading (white part)", kind: "text", to: "tx.title2", def: () => "Proposal" },
    { k: "sub", label: "Line under the heading", kind: "text", to: "tx.sub", def: (p) => `For the Appointment of ${p.roleTitle || "Job Title"}` },
    { k: "badge", label: "Box text", kind: "text", to: "tx.badge", def: () => "PRIVATE AND STRICTLY CONFIDENTIAL" },
    { k: "footer", label: "Footer text", kind: "text", to: "tx.footer", def: (p) => `Prepared by ${p.consultant1 || "Consultant"}` },
    { k: "photo", label: "Background photo", kind: "image", to: "p.photoTitle", posKey: "photoTitle", w: 1920, h: 1080, def: (p) => p.photoTitle },
  ] },
  { id: "understanding", label: "Our Understanding style", fields: [
    { k: "heading", label: "Heading", kind: "text", to: "tx.heading", def: () => "Our Understanding" },
    { k: "text", label: "Text", kind: "area", max: LIMITS.understanding, to: "p.understanding", def: (p) => p.understanding },
    { k: "photo", label: "Photo (right panel)", kind: "image", to: "p.photoUnderstanding", posKey: "photoUnderstanding", w: 793, h: 1080, def: (p) => p.photoUnderstanding },
  ] },
  { id: "about", label: "About style", fields: [
    { k: "heading", label: "Heading", kind: "text", to: "tx.heading", def: (p) => `About ${p.clientName || "Client"}` },
    { k: "text", label: "Text", kind: "area", max: LIMITS.about, to: "p.about", def: (p) => p.about },
    { k: "photo", label: "Photo (left)", kind: "image", to: "p.photoAbout", posKey: "photoAbout", w: 833, h: 980, def: (p) => p.photoAbout },
  ] },
  { id: "role", label: "Role Profile style", fields: [
    { k: "roleBox", label: "Box heading", kind: "text", to: "tx.roleBox", def: () => "The Role" },
    { k: "l1", label: "Row 1 label", kind: "text", to: "tx.l1", def: () => "Job Title" },
    { k: "v1", label: "Row 1", kind: "text", to: "p.jobTitle", def: (p) => p.jobTitle },
    { k: "l2", label: "Row 2 label", kind: "text", to: "tx.l2", def: () => "Location" },
    { k: "v2", label: "Row 2", kind: "text", to: "p.location", def: (p) => p.location },
    { k: "l3", label: "Row 3 label", kind: "text", to: "tx.l3", def: () => "Reporting to" },
    { k: "v3", label: "Row 3", kind: "text", to: "p.reportingTo", def: (p) => p.reportingTo },
    { k: "l4", label: "Row 4 label (leave the value blank to hide it)", kind: "text", to: "tx.l4", def: () => "Direct Reports" },
    { k: "v4", label: "Row 4", kind: "text", to: "p.directReports", def: (p) => (p.noDirectReports ? "" : p.directReports) },
    { k: "offer", label: "Offer heading", kind: "text", to: "tx.offer", def: () => "What’s on offer." },
    { k: "salary", label: "Offer line 1", kind: "text", to: "p.salary", def: (p) => p.salary },
    { k: "contract", label: "Offer line 2", kind: "text", to: "p.contract", def: (p) => p.contract },
    { k: "benefitsTitle", label: "List heading", kind: "text", to: "tx.benefitsTitle", def: () => "Benefits" },
    { k: "benefits", label: "List (one per line)", kind: "lines", to: "p.benefits", def: (p) => (p.benefits || []).filter(Boolean).join("\n") },
    { k: "heading", label: "Right-hand heading", kind: "text", to: "tx.heading", def: () => "Role Profile" },
    { k: "text", label: "Right-hand text", kind: "area", max: LIMITS.roleProfile, to: "p.roleProfile", def: (p) => p.roleProfile },
    { k: "photo", label: "Photo (left)", kind: "image", to: "p.photoRole", posKey: "photoRole", w: 908, h: 980, def: (p) => p.photoRole },
  ] },
  { id: "approach", label: "Our Approach style", fields: [
    { k: "heading", label: "Heading", kind: "text", to: "tx.heading", def: () => "Our Approach" },
    { k: "intro", label: "Line under the heading", kind: "area", max: 300, to: "tx.intro", def: () => APPROACH_INTRO },
    { k: "pill", label: "Green label", kind: "text", to: "tx.pill", def: () => "How we get it right" },
    ...APPROACH.flatMap((a, i) => [
      { k: `a${i}t`, label: `Box ${i + 1} heading`, kind: "text", to: `tx.a${i}t`, def: () => a.title },
      { k: `a${i}x`, label: `Box ${i + 1} text`, kind: "area", max: LIMITS.approach, to: `p.${a.key}`, def: (p) => p[a.key] },
    ]),
    { k: "photo", label: "Banner photo", kind: "image", to: "p.photoApproach", posKey: "photoApproach", w: 1920, h: 340, def: (p) => p.photoApproach },
  ] },
  { id: "search", label: "Search Process style", fields: [
    { k: "heading", label: "Heading", kind: "text", to: "tx.heading", def: () => "Search Process" },
    { k: "sub", label: "Line under the heading", kind: "area", max: 180, to: "tx.sub", def: () => SEARCH.intro },
    ...SEARCH.stages.flatMap((s, i) => [
      { k: `pill${i + 1}`, label: `Stage ${i + 1} label`, kind: "text", to: `tx.pill${i + 1}`, def: () => `Stage ${i + 1}` },
      { k: `s${i}t`, label: `Stage ${i + 1} heading`, kind: "text", to: `tx.s${i}t`, def: () => s.title },
      { k: `s${i}i`, label: `Stage ${i + 1} points (one per line)`, kind: "lines", max: i === 1 ? 480 : 170, to: `tx.s${i}i`, def: () => s.items.join("\n") },
    ]),
    { k: "tfLabel", label: "Timeframe label", kind: "text", to: "tx.tfLabel", def: () => "Projected Timeframe:" },
    { k: "timeframe", label: "Timeframe", kind: "text", to: "p.timeframe", def: (p) => p.timeframe },
    { k: "photo", label: "Banner photo", kind: "image", to: "bo.search", posKey: "bo.search", w: 1920, h: 340, def: (p) => p.photoApproach },
  ] },
  { id: "credentials", label: "Credentials style (1 person)", fields: [
    { k: "heading", label: "Heading", kind: "text", to: "tx.heading", def: () => "Your Specialist" },
    { k: "name", label: "Name", kind: "text", to: "c1.name", def: (p) => p.c1.name || p.consultant1 },
    { k: "title", label: "Job title", kind: "text", to: "c1.title", def: (p) => p.c1.title },
    { k: "email", label: "Email", kind: "text", to: "c1.email", def: (p) => p.c1.email },
    { k: "phone", label: "Phone", kind: "text", to: "c1.phone", def: (p) => p.c1.phone },
    { k: "aboutMe", label: "Text heading", kind: "text", to: "tx.aboutMe", def: () => "About me" },
    { k: "about", label: "Text", kind: "area", max: LIMITS.aboutOne, to: "c1.about", def: (p) => p.c1.about },
    { k: "photo", label: "Photo (blank = their headshot)", kind: "image", to: "c1.photo", posKey: "c1.photo", w: 447, h: 680, def: () => "" },
  ] },
  { id: "credentials2", label: "Credentials style (2 people)", fields: [
    { k: "heading", label: "Heading", kind: "text", to: "tx.heading", def: () => "Your Contacts" },
    ...["c1", "c2"].flatMap((c, i) => [
      { k: `${c}name`, label: `Person ${i + 1} name`, kind: "text", to: `${c}.name`, def: (p) => p[c].name || p[i ? "consultant2" : "consultant1"] },
      { k: `${c}title`, label: `Person ${i + 1} job title`, kind: "text", to: `${c}.title`, def: (p) => p[c].title },
      { k: `${c}email`, label: `Person ${i + 1} email`, kind: "text", to: `${c}.email`, def: (p) => p[c].email },
      { k: `${c}phone`, label: `Person ${i + 1} phone`, kind: "text", to: `${c}.phone`, def: (p) => p[c].phone },
      { k: `${c}placements`, label: `Person ${i + 1} recent placements`, kind: "text", max: LIMITS.placements, to: `${c}.placements`, def: (p) => p[c].placements },
      { k: `${c}about`, label: `Person ${i + 1} text`, kind: "area", max: LIMITS.aboutTwo, to: `${c}.about`, def: (p) => p[c].about },
      { k: `${c}photo`, label: `Person ${i + 1} photo (blank = headshot)`, kind: "image", to: `${c}.photo`, posKey: `${c}.photo`, w: 282, h: 381, def: () => "" },
    ]),
    { k: "placements", label: "Placements heading", kind: "text", to: "tx.placements", def: () => "Recent Placements" },
    { k: "aboutMe", label: "Text heading", kind: "text", to: "tx.aboutMe", def: () => "About me" },
  ] },
  { id: "terms", label: "Terms & Fees style", fields: [
    { k: "heading", label: "Heading", kind: "text", to: "tx.heading", def: () => "Terms & Fee Structure" },
    { k: "feeLine", label: "Fee line", kind: "text", to: "tx.feeLine", def: (p) => `Fee | ${p.fee || "25%"} + VAT of package` },
    { k: "ptTitle", label: "Payment heading", kind: "text", to: "tx.ptTitle", def: () => "Payment Terms." },
    { k: "pt", label: "Payment points (one per line)", kind: "lines", max: LIMITS.paymentTerms, to: "p.paymentTerms", def: (p) => p.paymentTerms ?? PAYMENT_TERMS },
    { k: "note", label: "Small print", kind: "area", max: LIMITS.paymentNote, to: "p.paymentNote", def: (p) => p.paymentNote ?? PAYMENT_NOTE },
    { k: "covTitle", label: "Ticks heading", kind: "text", to: "tx.covTitle", def: () => "Everything Covered." },
    { k: "covered", label: "Ticks (one per line)", kind: "lines", max: 90, to: "tx.covered", def: (p) => [!p.nda ? "Branded Media Adverts" : null, "Candidate Pack", "NDA Led Search"].filter(Boolean).join("\n") },
    ...TERMS_POINTS.flatMap((t, i) => [
      { k: `tp${i}t`, label: `Bottom box ${i + 1} heading`, kind: "text", to: `tx.tp${i}t`, def: () => t.title },
      { k: `tp${i}x`, label: `Bottom box ${i + 1} text`, kind: "area", max: 130, to: `tx.tp${i}x`, def: (p) => t.text.replace("{weeks}", p.guaranteeWeeks || "16").replace("{days}", p.paymentDays || "30") + (t.bold || "") },
    ]),
    { k: "photo", label: "Photo (top right)", kind: "image", to: "p.photoTerms", posKey: "photoTerms", w: 1361, h: 580, def: (p) => p.photoTerms },
  ] },
  { id: "next", label: "Next Steps style", fields: [
    { k: "heading", label: "Heading", kind: "text", to: "tx.heading", def: () => "Next Steps" },
    { k: "points", label: "Numbered points (one per line)", kind: "lines", max: 80, to: "tx.points", def: () => NEXT_STEPS.points.join("\n") },
    { k: "agTitle", label: "Green heading", kind: "text", to: "tx.agTitle", def: () => "Agreement of terms" },
    { k: "agText", label: "Text", kind: "area", max: 240, to: "tx.agText", def: () => NEXT_STEPS.text },
    { k: "signed", label: "Signature line", kind: "text", to: "tx.signed", def: (p) => `Signed on behalf of ${p.clientName || ""}` },
    { k: "photo", label: "Photo (bottom left)", kind: "image", to: "bo.next", posKey: "bo.next", w: 993, h: 520, def: (p) => (p.boPhotos && p.boPhotos.next) || "/proposal/next-steps-photo.jpg" },
  ] },
  { id: "appendices", label: "Appendices style", fields: [
    { k: "heading", label: "Heading", kind: "text", to: "tx.heading", def: () => "Appendices" },
    { k: "items", label: "Lines (one per line; add a web address to a line to give it a View button)", kind: "lines", max: 400, to: "tx.items",
      def: (p) => appendices(p).map((a, i) => `Appendix ${i + 1} | ${a.title}${a.link && /^https?:/.test(a.link) ? ` ${a.link}` : ""}`).join("\n") },
    { k: "photo", label: "Circle photo (right)", kind: "image", to: "bo.appendix", posKey: "bo.appendix", w: 912, h: 980, def: (p) => (p.boPhotos && p.boPhotos.appendix) || "/proposal/appendix-photo.jpg" },
  ] },
  { id: "end", label: "End page style", numbered: false, fields: [
    { k: "line1", label: "Green line", kind: "text", to: "tx.line1", def: () => "Begin your search" },
    { k: "line2", label: "Black line", kind: "text", to: "tx.line2", def: () => "journey today" },
    { k: "photo", label: "Circle photo (left)", kind: "image", to: "bo.end", posKey: "bo.end", w: 1024, h: 864, def: (p) => (p.boPhotos && p.boPhotos.end) || "/proposal/end-photo.jpg" },
  ] },
];

export const styleById = (id) => EXTRA_STYLES.find((s) => s.id === id);

// Fill a new page's fields from what's already in the proposal, so it starts looking finished.
export function defaultsFor(styleId, p) {
  const st = styleById(styleId);
  if (!st) return {};
  return Object.fromEntries(st.fields.map((f) => [f.k, f.def ? (f.def(p) ?? "") : ""]));
}

// The proposal as this extra page sees it: the page's own text and pictures laid over a copy.
export function extraProps(p, ep) {
  const st = styleById(ep.style);
  const q = {
    ...p, tx: {}, c1: { ...p.c1 }, c2: { ...p.c2 },
    boPhotos: { ...(p.boPhotos || {}) }, photoPos: { ...(p.photoPos || {}), ...(ep.photoPos || {}) },
  };
  if (!st) return q;
  const v = ep.v || {};
  for (const f of st.fields) {
    let val = v[f.k];
    if (val === undefined) continue;
    const [scope, key] = f.to.split(".");
    if (scope === "tx") q.tx[key] = val;
    else if (scope === "bo") q.boPhotos[key] = val;
    else if (scope === "c1" || scope === "c2") q[scope][key] = val;
    else if (scope === "p") q[key] = key === "benefits" ? String(val).split("\n").map((x) => x.trim()).filter(Boolean) : val;
  }
  if (ep.style === "role") q.noDirectReports = !String(v.v4 || "").trim();
  if (ep.style === "credentials2") q.twoConsultants = true;
  if (ep.style === "credentials") q.twoConsultants = false;
  // Show the page's own wording even where it matches the standard (keeps added pages independent).
  q.tx.__extra = "1";
  return q;
}

// Every page in order, with added pages slotted in after the page they were placed after.
// Pages between Contents and End get numbers and appear on the Contents page.
export function pagePlan(p) {
  const core = sectionsFor(p);
  const plan = [{ key: "title" }, { key: "contents" }, ...core.map((s) => ({ key: s.id, core: s })), { key: "end" }];
  const extras = (p.extraPages || []).filter((e) => e && styleById(e.style));
  let pending = extras.slice();
  for (let pass = 0; pass < extras.length + 1 && pending.length; pass++) {
    const next = [];
    for (const e of pending) {
      const anchor = e.after || "lastSection";
      let i = anchor === "lastSection" ? plan.findIndex((x) => x.key === "end") - 1 : plan.findIndex((x) => x.key === anchor);
      if (i < 0) { next.push(e); continue; }
      // After the anchor and after any pages already placed after it, so they keep their order.
      let j = i + 1;
      while (j < plan.length && plan[j].after === anchor && plan[j].extra) j++;
      if (plan[j - 1] && plan[j - 1].key === "end") j = plan.length - 1;
      plan.splice(Math.min(j, plan.length - 1), 0, { key: `x-${e.id}`, extra: e, after: anchor });
    }
    pending = next;
  }
  for (const e of pending) plan.splice(plan.length - 1, 0, { key: `x-${e.id}`, extra: e, after: "lastSection" });

  // Standard pages removed in the back office. Done after placing added pages, so a page placed
  // after a removed one simply takes its spot.
  const hidden = new Set(p.hiddenPages || []);
  for (let i = plan.length - 1; i >= 0; i--) if (!plan[i].extra && hidden.has(plan[i].key)) plan.splice(i, 1);

  // Numbers: everything after Contents (or the title page if Contents was removed) up to the End page
  // (core sections, and added pages unless their style is unnumbered).
  let ci = plan.findIndex((x) => x.key === "contents");
  if (ci < 0) ci = plan.findIndex((x) => x.key === "title");
  let n = 0;
  plan.forEach((x, i) => {
    if (i <= ci || x.key === "end") return;
    if (x.core) { n++; x.sec = { ...x.core, num: String(n).padStart(2, "0") }; }
    else if (x.extra) {
      const st = styleById(x.extra.style);
      if (st.numbered === false) return;
      n++;
      x.sec = {
        id: x.key, extra: true, num: String(n).padStart(2, "0"),
        name: String(x.extra.name || "").trim() || st.label.replace(/ style.*$/, ""),
        desc: String(x.extra.desc || "").trim() || sectionDesc(x.extra.style),
        inContents: x.extra.inContents !== false,
      };
    }
  });
  return plan;
}

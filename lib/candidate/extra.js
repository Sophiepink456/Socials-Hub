// Back office: extra pages in a candidate pack, each using one of the pack's own page designs
// with its own wording and pictures, placed anywhere in the pack.
import { PACK_TEXT, PACK_LIMITS as L } from "./data";

const stripDot = (x) => String(x || "").replace(/\*/g, "").trim().replace(/\.+$/, "");

// `pt` = the standard-wording key it replaces (normally the same as k).
const tx = (k, label, max, area, pt = k) => ({ k, pt, label, kind: area ? "area" : "text", max, def: (p) => (p.pageText && p.pageText[pt]) || PACK_TEXT[pt] });
const fld = (k, label, kind, max, extra = {}) => ({ k, label, kind, max, def: (p) => (Array.isArray(p[k]) ? p[k].filter((x) => String(x).trim()).join("\n") : p[k] || ""), ...extra });
const img = (k, label, w, h) => ({ k, label, kind: "image", w, h, def: (p) => p[k] || "" });

export const PACK_STYLES = [
  { id: "title", label: "Title page", fields: [fld("roleTitle", "Heading", "text", L.roleTitle), tx("sub", "Line under the heading", 60), img("photoTitle", "Background photo", 1920, 864)] },
  { id: "about", label: "About (laptop) page", fields: [fld("clientName", "Line under “About.”", "text", L.clientName), fld("about", "Text", "area", L.about),
    img("siteShot", "Picture on the laptop screen", 1440, 903)] },
  { id: "opportunity", label: "The Opportunity page", fields: [tx("oppTitle", "Heading (put * around the coloured words)", 40), fld("opportunity", "Text", "area", L.opportunity),
    img("photoOpportunity", "Right photo", 946, 980)] },
  { id: "role", label: "The Role page", fields: [tx("roleBox", "Box heading (put * around the coloured words)", 30), tx("l1", "Row 1 label", 25), fld("jobTitle", "Row 1 text", "text", L.jobTitle),
    tx("l2", "Row 2 label", 25), fld("location", "Row 2 text", "text", L.location), tx("l3", "Row 3 label", 25), fld("reportingTo", "Row 3 text", "text", L.reportingTo),
    tx("l4", "Row 4 label", 25), fld("directReports", "Row 4 text (leave blank to hide the row)", "text", L.directReports),
    tx("roleHeading (put * around the coloured words)", "Right-hand heading (put * around the coloured words)", 40, false, "roleProfile"), fld("roleProfile", "Right-hand text", "area", L.roleProfile), img("photoRole", "Left photo", 1135, 977)] },
  { id: "key", label: "Points page (Key Responsibilities design)", fields: [tx("keyTitle", "Heading (put * around the coloured words)", 40), tx("keyIntro", "Text under the heading (left)", 220, true), fld("keyText", "Intro paragraph above the points", "area", L.keyText), tx("keyListTitle", "Line above the bullet points", 60),
    fld("keyPoints", "Points (one per line, up to 20)", "lines", 4600), img("photoKey", "Left photo", 833, 980)] },
  { id: "looking", label: "Points page (What We’re Looking For design)", fields: [tx("lookingTitle", "Heading (put * around the coloured words)", 40), tx("lookingIntro", "Text under the heading (left)", 160, true), fld("lookingText", "Intro paragraph above the points", "area", L.lookingText), tx("lookingListTitle", "Line above the bullet points", 60),
    fld("lookingPoints", "Points (one per line, up to 20)", "lines", 4600), fld("lookingOutro", "Closing line under the points (optional)", "area", L.lookingOutro), img("photoLooking", "Left photo", 833, 980)] },
  { id: "offer", label: "What’s on Offer page", fields: [tx("offer", "Box heading (put * around the coloured words)", 30), fld("salary", "Tick line 1", "text", L.salary), fld("contract", "Tick line 2", "text", L.contract),
    tx("benefitsTitle", "List heading", 30), fld("benefits", "List (one per line, up to 8)", "lines", 500), tx("whyTitle", "Right-hand heading (put * around the coloured words)", 40),
    fld("why", "Right-hand text", "area", L.why), img("photoOffer", "Left photo", 999, 980)] },
  { id: "next", label: "Next Steps page", fields: [tx("nextTitle", "Heading (put * around the coloured words)", 20), tx("next1", "First paragraph (bold)", 200, true), tx("next2", "Second paragraph", 400, true),
    tx("step1t", "Step 1 heading", 30), tx("step1x", "Step 1 text", 260, true), tx("step2t", "Step 2 heading", 30), tx("step2x", "Step 2 text", 260, true),
    tx("step3t", "Step 3 heading", 30), tx("step3x", "Step 3 text", 260, true), img("photoNext", "Bottom photo", 1920, 512)] },
  { id: "contact", label: "Contact page", fields: [tx("contactOne", "Heading (one consultant)", 30), tx("contactTwo1", "Heading, first word (two consultants)", 15),
    tx("contactTwo2", "Heading, coloured word (two consultants)", 15), tx("contactText", "Text", 200, true),
    tx("proc1t", "Step 1 heading", 20), tx("proc1x", "Step 1 text", 100, true), tx("proc2t", "Step 2 heading", 20), tx("proc2x", "Step 2 text", 100, true),
    tx("proc3t", "Step 3 heading", 20), tx("proc3x", "Step 3 text", 100, true), tx("proc4t", "Step 4 heading", 20), tx("proc4x", "Step 4 text", 100, true)] },
  { id: "end", label: "End page", fields: [tx("end1", "Heading line 1", 25), tx("end2", "Heading line 2", 25), tx("endText", "Text", 260, true), img("photoEnd", "Faint circle photo", 1064, 1080)] },
];
export const packStyle = (id) => PACK_STYLES.find((s) => s.id === id) || null;

// A new page starts as a copy of that page in this pack.
export function packStyleDefaults(id, p) {
  const st = packStyle(id);
  return st ? Object.fromEntries(st.fields.map((f) => [f.k, f.def(p)])) : {};
}

// The pack as the added page should see it: its own wording, content and pictures.
export function packExtraProps(p, ep) {
  const st = packStyle(ep.style);
  const q = { ...p, pageText: { ...(p.pageText || {}) }, photoPos: { ...(ep.photoPos || {}) } };
  for (const f of st ? st.fields : []) {
    const v = ep.v && ep.v[f.k] !== undefined ? ep.v[f.k] : f.def(p);
    if (f.kind === "lines") q[f.k] = String(v || "").split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 20);
    else if (f.pt) q.pageText[f.pt] = v;
    else q[f.k] = v;
  }
  // "Row 4 text" left blank hides that row, as on the standard page.
  if (ep.style === "role") q.noDirectReports = !String(q.directReports || "").trim();
  return q;
}

export const CORE_PACK_PAGES = [
  ["title", "Title"], ["about", "About"], ["opportunity", "The Opportunity"], ["role", "The Role"], ["key", "Key Responsibilities"], ["looking", "Looking For"],
  ["offer", "The Offer"], ["next", "Next Steps"], ["contact", "Contact"], ["end", "End"],
];

// Page order: standard pages, added pages after their chosen page, then removed pages taken out.
export function packPlan(p) {
  const plan = CORE_PACK_PAGES.map(([key, label]) => ({ key, label }));
  for (const e of (p.extraPages || []).filter((x) => x && packStyle(x.style))) {
    const anchor = e.after || "beforeEnd";
    let i = anchor === "beforeEnd" ? plan.findIndex((x) => x.key === "end") - 1 : plan.findIndex((x) => x.key === anchor || x.key === `x-${anchor}`);
    if (i < 0) i = plan.findIndex((x) => x.key === "end") - 1;
    let j = i + 1;
    while (j < plan.length && plan[j].extra && plan[j].after === anchor) j++;
    plan.splice(j, 0, { key: `x-${e.id}`, label: String(e.name || "").trim() || stripDot((e.v && (e.v.keyTitle || e.v.lookingTitle || e.v.nextTitle || e.v.roleBox || e.v.offer)) || "") || packStyle(e.style).label.replace(/ page.*$/, ""), extra: e, after: anchor });
  }
  const hidden = new Set(p.hiddenPages || []);
  // The Opportunity page only appears once it has some text.
  if (!String(p.opportunity || "").trim()) hidden.add("opportunity");
  return plan.filter((x) => x.extra || !hidden.has(x.key));
}

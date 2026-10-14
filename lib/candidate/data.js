// Candidate pack content: fields, standard wording (from the Candidate Pack Design (Live)
// Figma file) and form limits. A pack is saved like a proposal, with kind: "candidate".
import { CONSULTANTS, emailFor, headshotUrl, STOCK_PHOTOS } from "../proposal/data";

export { CONSULTANTS, emailFor, headshotUrl };

export const PACK_LIMITS = {
  clientName: 40,
  roleTitle: 50,
  about: 1500,
  jobTitle: 60,
  location: 50,
  reportingTo: 60,
  directReports: 110,
  roleProfile: 1000,
  keyIntro: 220,
  point: 230,
  points: 8,
  lookingIntro: 160,
  salary: 40,
  contract: 40,
  benefit: 60,
  benefits: 8,
  why: 700,
  consultantTitle: 45,
  phone: 20,
  email: 45,
};

// Standard wording (editable in the back office per pack).
export const PACK_TEXT = {
  sub: "Candidate Information Pack",
  keyTitle: "Key Responsibilities",
  keyIntro: "The successful candidate will take ownership of a range of important functions within the business. Key responsibilities for this role are outlined below, though not limited to the following:",
  lookingTitle: "What We’re Looking For",
  lookingIntro: "Here is an overview of the key skills and attributes we consider essential, as well as those that would be advantageous.",
  roleBox: "The Role",
  l1: "Job Title", l2: "Location", l3: "Reporting to", l4: "Direct Reports",
  roleProfile: "Role Profile",
  offer: "Whats on offer",
  benefitsTitle: "Benefits",
  whyTitle: "Why This Role Stands Out",
  nextTitle: "Next Steps",
  next1: "Elevation Recruitment Group has been appointed as exclusive recruitment partner and will manage the full end to end recruitment process.",
  next2: "Our role is to ensure a thorough, structured and fair assessment, with clear communication and support throughout. We'll guide you through each stage and are on hand for any questions. The process typically follows the steps below, though some adjustments may be needed depending on availability or wider business requirements.",
  step1t: "Telephone Screening",
  step1x: "Elevation will conduct an initial telephone screening exploring your background, motivations, key achievements and alignment with the role's core requirements. It's also your chance to ask questions and learn more about the opportunity.",
  step2t: "Interview",
  step2x: "Candidates who progress are invited to an interview with Elevation, conducted against the role's specific criteria and competency framework. This ensures a consistent, objective assessment of experience, technical capability, leadership style and cultural fit.",
  step3t: "Shortlist",
  step3x: "On completion of interviews, we will carefully select the best shortlist to meet our client's needs, and provide detailed feedback to everyone in the process. Successful candidates will then receive further preparation ahead of the next stage.",
  contactOne: "Your Contact",
  contactTwo1: "Your",
  contactTwo2: "Contacts",
  contactText: "We will keep you fully informed throughout and provide clear, timely feedback at each stage. If you have any questions at any point, please do get in touch.",
  proc1t: "Application", proc1x: "Confirm your interest and provide an up-to-date CV.",
  proc2t: "Screening", proc2x: "Meet with Elevation to discuss the vacancy in detail and your suitability for the role.",
  proc3t: "Interviews", proc3x: "Elevation will arrange all interviews and make sure you have all the details you need.",
  proc4t: "Feedback", proc4x: "Receive final feedback and agreement of next steps.",
  end1: "Begin your new",
  end2: "chapter today",
  endText: "We understand that considering a move like this is a big decision, and we’re here to support you with honest, straightforward advice at every stage from a confidential initial chat through to your first day in the role.",
};

// The back-office wording editor: which standard text sits on which page.
export const PACK_WORDING = [
  { page: "title", label: "Title page", fields: [["sub", "Line under the role title", 60]] },
  { page: "about", label: "About", fields: [] },
  { page: "role", label: "The Role", fields: [["roleBox", "Box heading", 30], ["l1", "Row 1 label", 25], ["l2", "Row 2 label", 25], ["l3", "Row 3 label", 25], ["l4", "Row 4 label", 25], ["roleProfile", "Right-hand heading", 40]] },
  { page: "key", label: "Key Responsibilities", fields: [["keyTitle", "Heading", 40]] },
  { page: "looking", label: "What We’re Looking For", fields: [["lookingTitle", "Heading", 40]] },
  { page: "offer", label: "What’s on Offer", fields: [["offer", "Heading", 30], ["benefitsTitle", "Benefits heading", 30], ["whyTitle", "Right-hand heading", 40]] },
  { page: "next", label: "Next Steps", fields: [["nextTitle", "Heading", 20], ["next1", "First paragraph (bold)", 200, true], ["next2", "Second paragraph", 400, true],
    ["step1t", "Step 1 heading", 30], ["step1x", "Step 1 text", 260, true], ["step2t", "Step 2 heading", 30], ["step2x", "Step 2 text", 260, true], ["step3t", "Step 3 heading", 30], ["step3x", "Step 3 text", 260, true]] },
  { page: "contact", label: "Contact", fields: [["contactOne", "Heading (one consultant)", 30], ["contactTwo1", "Heading, first word (two consultants)", 15], ["contactTwo2", "Heading, coloured word (two consultants)", 15],
    ["contactText", "Text", 200, true], ["proc1t", "Step 1 heading", 20], ["proc1x", "Step 1 text", 100, true], ["proc2t", "Step 2 heading", 20], ["proc2x", "Step 2 text", 100, true],
    ["proc3t", "Step 3 heading", 20], ["proc3x", "Step 3 text", 100, true], ["proc4t", "Step 4 heading", 20], ["proc4x", "Step 4 text", 100, true]] },
  { page: "end", label: "End page", fields: [["end1", "Heading line 1", 25], ["end2", "Heading line 2", 25], ["endText", "Text", 260, true]] },
];

// Picture spaces filled from the client's website (or our photos until then).
export const PACK_PHOTO_SLOTS = [
  { key: "photoTitle", label: "Title page background", w: 1920, h: 864, page: "title" },
  { key: "photoRole", label: "The Role (left)", w: 903, h: 980, page: "role" },
  { key: "photoKey", label: "Key Responsibilities (left)", w: 833, h: 980, page: "key" },
  { key: "photoLooking", label: "What We’re Looking For (left)", w: 833, h: 980, page: "looking" },
  { key: "photoOffer", label: "What’s on Offer (left)", w: 1181, h: 980, page: "offer" },
  { key: "photoNext", label: "Next Steps (bottom)", w: 1920, h: 512, page: "next" },
  { key: "photoEnd", label: "End page (faint circle)", w: 1064, h: 1080, page: "end" },
];

export const DEFAULT_ACCENT = "#93bf20";
export const DEFAULT_DARK = "#1e1e24";

export function blankPack() {
  return {
    kind: "candidate",
    clientName: "",
    clientWebsite: "",
    clientLogo: "",
    logoSize: 100,
    logoColour: true,
    accent: DEFAULT_ACCENT,
    dark: DEFAULT_DARK,
    coloursAuto: true, // still the colours picked automatically (so a new website read can update them)
    siteShot: "", // the client's homepage, shown on the laptop
    roleTitle: "",
    twoConsultants: false,
    consultant1: "",
    consultant2: "",
    c1: { name: "", title: "", email: "", phone: "" },
    c2: { name: "", title: "", email: "", phone: "" },
    about: "",
    jobTitle: "",
    location: "",
    reportingTo: "",
    directReports: "",
    noDirectReports: false,
    roleProfile: "",
    keyIntro: PACK_TEXT.keyIntro,
    keyPoints: [""],
    lookingIntro: PACK_TEXT.lookingIntro,
    lookingPoints: [""],
    salary: "",
    contract: "",
    benefits: [""],
    why: "",
    photoPos: {},
    pageText: {},
    sitePhotos: [],
    ...Object.fromEntries(PACK_PHOTO_SLOTS.map((s, i) => [s.key, STOCK_PHOTOS[i % STOCK_PHOTOS.length]])),
  };
}

export function normalisePack(input) {
  const base = blankPack();
  const p = { ...base, ...(input || {}), kind: "candidate" };
  p.c1 = { ...base.c1, ...(input && input.c1) };
  p.c2 = { ...base.c2, ...(input && input.c2) };
  const list = (v, n) => (Array.isArray(v) ? v.slice(0, n) : []);
  p.keyPoints = list(p.keyPoints, PACK_LIMITS.points);
  p.lookingPoints = list(p.lookingPoints, PACK_LIMITS.points);
  p.benefits = list(p.benefits, PACK_LIMITS.benefits);
  p.pageText = p.pageText && typeof p.pageText === "object" ? p.pageText : {};
  return p;
}

// Start a pack from a proposal for the same client and role: copy everything that matches.
export function packFromProposal(pr) {
  const p = blankPack();
  const keep = ["clientName", "clientWebsite", "clientLogo", "logoSize", "roleTitle", "about", "jobTitle", "location", "reportingTo", "directReports", "noDirectReports",
    "salary", "contract", "twoConsultants", "consultant1", "consultant2", "sitePhotos"];
  for (const k of keep) if (pr[k] !== undefined) p[k] = pr[k];
  p.benefits = (pr.benefits || []).filter((b) => String(b).trim()).slice(0, PACK_LIMITS.benefits);
  if (!p.benefits.length) p.benefits = [""];
  p.roleProfile = String(pr.roleProfile || "").slice(0, PACK_LIMITS.roleProfile);
  for (const c of ["c1", "c2"]) {
    const s = pr[c] || {};
    p[c] = { name: s.name || "", title: s.title || "", email: s.email || "", phone: s.phone || "" };
  }
  if (pr.photoTitle) p.photoTitle = pr.photoTitle;
  if (pr.photoRole) p.photoRole = pr.photoRole;
  if (pr.photoAbout) p.photoKey = pr.photoAbout;
  if (pr.photoUnderstanding) p.photoLooking = pr.photoUnderstanding;
  if (pr.photoTerms) p.photoOffer = pr.photoTerms;
  if (pr.photoApproach) p.photoNext = pr.photoApproach;
  return p;
}

export function samplePack() {
  return {
    ...blankPack(),
    clientName: "Mail Metrics",
    roleTitle: "Manufacturing Manager",
    accent: "#88cdf6",
    dark: "#1e1933",
    consultant1: "Emma Noble",
    c1: { name: "Emma Noble", title: "Senior Business Director", email: "emman@elevationrecruitment.com", phone: "07710 096 839" },
    about: "Mail Metrics is a market-leading provider of secure print and digital customer communications, helping organisations deliver compliant, customer-focused communications at scale. Employing approximately 600 people across four sites in Leicester, Huddersfield, Bangor and Dublin, the business generates annual turnover of approximately €220 million and serves a portfolio of around 400 clients across the UK and Ireland.\nTrusted by leading organisations in both the public and private sectors, Mail Metrics works with customers including NHS organisations, Lloyds, the BBC, LV= and Allianz. Many of these partnerships have been in place for more than 15 years, reflecting the company’s reputation for reliability, innovation and exceptional service.\nSpecialising in highly secure, GDPR-compliant communications rather than mass marketing print, Mail Metrics processes over 1.8 billion transactional customer communications each year, including around 400 million personalised mailings such as council tax bills, P60s, bank statements and NHS communications, where accuracy, compliance and data security are paramount.",
    jobTitle: "Head of Safety, Health and Environment (SHE)",
    location: "Huddersfield or Leicester",
    reportingTo: "Contracts Administrator",
    directReports: "Contracts Administrator",
    roleProfile: "The Commercial Contracts Manager is responsible for the drafting, review, negotiation and governance of all customer and, where requested/required, Supplier contracts. The role ensures that contractual arrangements are commercially robust, legally sound and aligned with Mail Metrics’ risk appetite.\nThis position plays a critical role in safeguarding the business by ensuring appropriate allocation of risk, minimising liability exposure and limiting indemnity obligations within highly regulated environments such as FCA and DORA.",
    keyPoints: [
      "Draft, review and maintain Customer and Supplier contracts, including master services agreements, schedules, statements of work and contractual variations.",
      "Ensure all documentation is clear, consistent and aligned with internal standards, risk frameworks and commercial objectives.",
      "Lead the negotiation of both Mail Metrics issued and Customer-drafted contracts.",
      "Secure commercially acceptable positions while maintaining appropriate risk control, particularly in relation to liabilities, indemnities and service commitments.",
      "Review and evaluate Customer issued tender documentation (RFPs, ITTs, frameworks), including associated contractual terms.",
      "Identify, assess and clearly articulate commercial and legal risks, supporting bid/ no-bid decisions and negotiation strategies.",
      "Ensure contractual provisions appropriately manage and mitigate risk, including liability caps, indemnities, warranties, service credits and termination rights.",
      "Ensure compliance with relevant Customer specified regulatory requirements (e.g. FCA, DORA), including operational resilience, data protection and audit obligations negotiating opt-outs where necessary.",
    ],
    lookingPoints: [
      "Pragmatic and balanced in their approach.",
      "Comfortable negotiating commercial terms while maintaining strong customer relationships.",
      "A confident communicator who can work across multiple departments.",
      "A legal qualification is not essential. Candidates with backgrounds in commercial contracts, financial services, the public sector or other regulated environments would all be of interest.",
      "Detail-oriented with the ability to review contracts carefully.",
      "The company is open to candidates at different stages of their career and offers genuine opportunities for long-term progression and development.",
    ],
    salary: "£80,000 - £90,000",
    contract: "Permanent, full-time",
    benefits: ["Car allowance £7.2k", "Holiday 30 days per annum", "Pension employers contribution 10%", "Company private health scheme (employee contributions)",
      "Bonus +25% opportunity (plus a +25% stretch opportunity)", "Death in service 4x salary", "Notice period 6 months"],
    why: "We're a developing and growing business with a strong, ambitious model. Our culture is built on high trust and flexibility, creating an environment where people can genuinely thrive. This is a commercially focused opportunity, ideally suited to a detail-oriented individual who wants to make a real impact. We also offer hybrid working, giving you the balance to perform at your best.",
  };
}

export function packTextFields(p) {
  const f = {
    roleTitle: p.roleTitle, about: p.about, jobTitle: p.jobTitle, location: p.location, reportingTo: p.reportingTo,
    directReports: p.noDirectReports ? "" : p.directReports, roleProfile: p.roleProfile, keyIntro: p.keyIntro, lookingIntro: p.lookingIntro,
    salary: p.salary, contract: p.contract, why: p.why,
  };
  (p.keyPoints || []).forEach((x, i) => { f[`keyPoints.${i}`] = x; });
  (p.lookingPoints || []).forEach((x, i) => { f[`lookingPoints.${i}`] = x; });
  (p.benefits || []).forEach((x, i) => { f[`benefits.${i}`] = x; });
  ["c1", ...(p.twoConsultants ? ["c2"] : [])].forEach((c) => { f[`${c}.title`] = p[c].title; });
  return Object.fromEntries(Object.entries(f).filter(([, v]) => String(v || "").trim()));
}

const PACK_FIELD_NAMES = {
  roleTitle: "Role title", about: "About the client", jobTitle: "Job title", location: "Location", reportingTo: "Reporting to", directReports: "Direct reports",
  roleProfile: "Role profile", keyIntro: "Key Responsibilities intro", lookingIntro: "What We’re Looking For intro", salary: "Salary", contract: "Contract",
  why: "Why this role stands out", "c1.title": "Consultant job title", "c2.title": "Second consultant job title",
};
export function packFieldName(k) {
  if (PACK_FIELD_NAMES[k]) return PACK_FIELD_NAMES[k];
  const [a, i] = k.split(".");
  const n = Number(i) + 1;
  if (a === "keyPoints") return `Key responsibility ${n}`;
  if (a === "lookingPoints") return `What we’re looking for ${n}`;
  if (a === "benefits") return `Benefit ${n}`;
  return k;
}

// Big enough to fill the space without being stretched more than 10%.
export function packPhotoFits(photo, slot) {
  if (!photo || !photo.w || !photo.h) return true;
  return Math.max(slot.w / photo.w, slot.h / photo.h) <= 1.1;
}

export function assignPackPhotos(photos) {
  const out = {};
  const used = new Set();
  const order = [...PACK_PHOTO_SLOTS].sort((a, b) => b.w * b.h - a.w * a.h);
  for (const slot of order) {
    let best = null, bestVal = -Infinity;
    for (const ph of photos) {
      if (used.has(ph.url) || !packPhotoFits(ph, slot)) continue;
      const ow = ph.origW || ph.w, oh = ph.origH || ph.h;
      const need = ow && oh ? Math.max(slot.w / ow, slot.h / oh) : 1;
      const val = (ph.score || 5) - 2.5 * Math.max(0, need - 1);
      if (val > bestVal) { best = ph; bestVal = val; }
    }
    if (best) { out[slot.key] = best.url; used.add(best.url); }
  }
  return out;
}

export const packPdfName = (p) => `Candidate Pack - ${p.clientName || "Client"} - ${p.roleTitle || "Role"}.pdf`.replace(/[^\w &().,'-]+/g, "").trim();

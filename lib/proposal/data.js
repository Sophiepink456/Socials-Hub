// Proposal content: the sections, their fixed wording and the form limits.
// Wording comes straight from the LIVE-TEMPLATE Figma file.
import manifest from "../manifest.json";

export const CONSULTANTS = (manifest.headshots || []).map((h) => h.name);

export const headshotUrl = (name) =>
  name ? `/proposal/headshots/${encodeURIComponent(String(name).trim())}.jpg` : "";

// "Emma Noble" -> "emman@elevationrecruitment.com" (first name + surname initial).
export function emailFor(name) {
  const parts = String(name || "").trim().toLowerCase().replace(/[^a-z\s'-]/g, "").split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  const first = parts[0].replace(/[^a-z]/g, "");
  const last = parts.length > 1 ? parts[parts.length - 1].replace(/[^a-z]/g, "")[0] || "" : "";
  return `${first}${last}@elevationrecruitment.com`;
}

// Character limits (including spaces). Inputs stop accepting text at the limit.
export const LIMITS = {
  clientName: 40,
  understanding: 1320,
  about: 1500, // measured: fills the About page without crowding the heading or footer
  jobTitle: 60,
  location: 50,
  reportingTo: 60,
  directReports: 110,
  salary: 40,
  contract: 40,
  benefit: 60,
  benefits: 8,
  roleProfile: 1320,
  approach: 520,
  timeframe: 40,
  consultantTitle: 45,
  phone: 20,
  email: 45,
  aboutOne: 1280,
  aboutTwo: 455,
  placements: 110,
  fee: 6,
  feeLine: 60, // "Fee | 25% + VAT of package" (up to two lines on the Terms page)
  paymentTerms: 150, // up to 5 lines, one bullet per line
  paymentNote: 110,
  weeks: 3,
  days: 3,
  appendixTitle: 45,
};

// "Multiple roles" on the Role Profile page: up to 4 roles, each with its own details and profile.
// The profiles share the right-hand side, so each one gets a smaller share of the characters.
export const MAX_ROLES = 4;
export const roleProfileLimit = (n) => [1320, 1320, 600, 380, 270][Math.max(1, Math.min(MAX_ROLES, n))];
export const blankRole = () => ({ jobTitle: "", location: "", reportingTo: "", directReports: "", noDirectReports: false, salary: "", contract: "", profile: "" });
// The roles on the page: the list when "Multiple roles" is ticked, otherwise the single role.
export function roleList(p) {
  if (p.multiRole && Array.isArray(p.roles) && p.roles.length) return p.roles;
  return [{ jobTitle: p.jobTitle, location: p.location, reportingTo: p.reportingTo, directReports: p.directReports, noDirectReports: p.noDirectReports,
    salary: p.salary, contract: p.contract, profile: p.roleProfile }];
}

export const APPROACH = [
  {
    key: "approach1",
    title: "Market Mapping & Headhunting",
    text: "Before the search begins, we'll agree the focus of our approach with you, based on your person specification. This will cover the specific job types and sectors we target, the individual candidates we identify and approach directly about the role, and a target list of organisations likely to be employing relevant people.",
  },
  {
    key: "approach2",
    title: "Online Attraction",
    text: "Advertising online reaches active and passive candidates nationwide. We would promote the role across the leading senior and executive job boards and on our own website, which sees over 7,000 monthly users, supported by daily posts to our 165,000-follower LinkedIn page. Our resourcing team then maps the wider market to build a full long list of potential candidates.",
  },
  {
    key: "approach3",
    title: "Maximising our Network",
    text: "With over 16 years established in the market, our network and database are second to none. We move quickly to target the most relevant candidates in your sector, delivering high-quality shortlists of proven individuals we can personally validate through our extensive knowledge of the market.",
  },
  {
    key: "approach4",
    title: "LinkedIn RPS & Insights",
    text: "Our LinkedIn access allows us to identify and approach relevant individuals directly, wherever they sit in the market. We also subscribe to LinkedIn Insights, giving us live data analytics on your competitors and detailed profiles of the people we want to target.",
  },
];

export const APPROACH_INTRO =
  "We will leave no stone unturned in finding the right person for your role, combining direct headhunting, market mapping and our established network to reach every credible candidate in the market, so that the shortlist you see is the best available, not simply the best who applied.";

export const BRANDED_TEXT =
  "Bespoke creative that gets seen. Our design work is built entirely around your brand voice, ensuring every static asset feels like a natural extension of your business. We then bring these visuals to life through animation, adding movement and personality that helps a role stand out in busy feeds. For a more personal, authentic touch, our video content is filmed on-site, capturing the real culture, people and environment of your business to give candidates a genuine feel for what it's like to work with you.";

export const CANDIDATE_PACK_TEXT =
  "To support candidates through their decision-making process, we produce bespoke candidate packs. These give a clear, compelling insight into the business behind the opportunity, including role profiles, company background and what makes working at your business unique. Fully branded to match your identity, each pack is polished and professional, ensuring candidates receive a consistent, high-quality first impression that reflects the calibre of the business they're being introduced to.";

export const SEARCH = {
  intro: "A structured three stage process that keeps momentum from day one, with timescales built around the urgency of the role and the realities of candidate availability.",
  stages: [
    { title: "Briefing & Consultation", items: ["Meet with all key stakeholders.", "Sign off job specification, candidate brief and marketing.", "Agree timeframes and commence search."] },
    { title: "Search, Screening & Shortlisting", items: [
      "Full market mapping through searching, headhunting, and networking, and contact any suitable candidates already registered, screened, and interviewed by us.",
      "Interview suitable candidates from our long list, subjecting each to rigorous screening and benchmarking against the agreed requirements.",
      "Hold regular update meetings backed by mandate reports, and present a shortlist of recommended candidates for first-stage interviews.",
    ] },
    { title: "Interview Process", items: ["Arrange all interviews.", "Organise testing or references on request.", "Manage the offer process from salary to notice period and start dates."] },
  ],
};

export const PAYMENT_TERMS = "1/3 on commencement\n1/3 on presentation of shortlist\n1/3 on start date";
export const PAYMENT_NOTE = "*Any variation to the salary and fee will be calculated in the final 3rd.";

export const TERMS_POINTS = [
  { title: "Guarantee Period", text: "Elevation will run a free replacement search if the candidate leaves within {weeks} weeks of their start date.", weight: 500 },
  { title: "Cancellation Fee", text: "If the search is cancelled for any reason outside of Elevations control a cancelation fee of 1/3 will be payable." },
  { title: "Direct Applications", text: "All applicants, whether direct or via a third party must be forwarded to Elevation to be managed within the process." },
  { title: "Payment Terms", text: "{days} days from invoice. Full terms & conditions can be viewed in ", bold: "Appendix 2." },
];

export const NEXT_STEPS = {
  points: ["Agreement to terms.", "Confirmation of Brief.", "Commence the Search."],
  text: "To indicate your acceptance of the terms of business and for us to commence the start of the assignment, please sign, date and return this proposal. Please note all other terms and conditions remain standard.",
};

// Sections in page order. `desc` is the line shown under each heading on the Contents page.
export const SECTIONS = [
  { id: "understanding", name: "Our Understanding", desc: "Our understanding of the brief, the opportunity, and the context behind the appointment." },
  { id: "about", name: "About", desc: "Overview of the organisation, its mission, and the environment the new hire will join." },
  { id: "role", name: "Role Profile", desc: "The role, its responsibilities, and the offer details shaping the search brief." },
  { id: "approach", name: "Our Approach", desc: "How we identify, engage, and shortlist candidates for the role." },
  { id: "branded", name: "Branded Campaigns", desc: "Creative assets and media used to showcase the role and employer brand." },
  { id: "candidate", name: "Candidate Packs", desc: "Branded materials that help candidates understand the business and opportunity." },
  { id: "search", name: "Search Process", desc: "The structured stages from briefing through to interview and offer management." },
  { id: "credentials", name: "Credentials", desc: "Recent placements and the specialist leading the assignment." },
  { id: "terms", name: "Terms & Fee Structure", desc: "Commercial terms, payment milestones, and included services." },
  { id: "next", name: "Next Steps", desc: "Agreement of terms and what happens next." },
  { id: "appendices", name: "Appendices", desc: "" },
];

// Which sections appear, in order, with their numbers ("01", "02", ...).
export function sectionsFor(p) {
  const list = SECTIONS.filter((s) => {
    if (s.id === "branded") return !p.nda;
    if (s.id === "appendices") return p.appendicesOn && appendices(p).length > 0;
    return true;
  }).map((s) => (s.id === "role" && p.multiRole && (p.roles || []).length ? { ...s, name: "Role Profiles" } : s));
  return list.map((s, i) => ({ ...s, num: String(i + 1).padStart(2, "0") }));
}

export const appendices = (p) => (p.appendices || []).filter((a) => String(a.title || "").trim());

export function appendicesDesc(p) {
  const t = appendices(p).map((a) => a.title.trim());
  if (!t.length) return "";
  if (t.length === 1) return `${t[0]}.`;
  return `${t.slice(0, -1).join(", ")} and ${t[t.length - 1]}.`;
}

export const STOCK_PHOTOS = [
  "/proposal/stock/elevationrecruitment-officept3-1.jpg",
  "/proposal/stock/dsc05742.jpg",
  "/proposal/stock/elevation-recruitment-office--56.jpg",
  "/proposal/stock/dsc05483.jpg",
  "/proposal/stock/dsc05778.jpg",
  "/proposal/stock/elevation-recruitment-office--74.jpg",
  "/proposal/stock/dsc05261.jpg",
  "/proposal/stock/dsc05969.jpg",
  "/proposal/stock/elevationrecruitment-officept3-10.jpg",
];

// The picture slots filled from the client's website (or our photos until then).
export const PHOTO_SLOTS = [
  { key: "photoTitle", label: "Title page background", w: 1920, h: 1080 },
  { key: "photoUnderstanding", label: "Our Understanding (right panel)", w: 793, h: 1080 },
  { key: "photoAbout", label: "About page", w: 833, h: 980 },
  { key: "photoRole", label: "Role Profile page", w: 908, h: 980 },
  { key: "photoApproach", label: "Our Approach banner", w: 1920, h: 340 },
  { key: "photoTerms", label: "Terms & Fees page", w: 1361, h: 580, page: "terms" },
];

export function blankProposal() {
  return {
    clientName: "",
    clientWebsite: "",
    clientLogo: "",
    logoSize: 100, // % of the standard size on the title page
    candidatePack: { back: "", front: "", ipad: "" }, // set by the proof-reader only
    boPhotos: { search: "", next: "", appendix: "", end: "" }, // back-office picture swaps
    photoPos: {}, // { photoTitle: { x: 0-100, y: 0-100 } } where each photo sits in its space
    roleTitle: "",
    nda: false,
    twoConsultants: false,
    consultant1: "",
    consultant2: "",
    consultant3: "",
    consultant4: "",
    understanding: "",
    about: "",
    jobTitle: "",
    location: "",
    reportingTo: "",
    directReports: "",
    noDirectReports: false,
    salary: "",
    contract: "",
    benefits: [""],
    roleProfile: "",
    multiRole: false, // one role unless "Multiple roles" is ticked
    roles: [],
    ...Object.fromEntries(APPROACH.map((a) => [a.key, a.text])),
    timeframe: "4 weeks to cv presentation",
    c1: { name: "", title: "", email: "", phone: "", about: "", placements: "" },
    c2: { name: "", title: "", email: "", phone: "", about: "", placements: "" },
    c3: { name: "", title: "", email: "", phone: "", about: "", placements: "" },
    c4: { name: "", title: "", email: "", phone: "", about: "", placements: "" },
    fee: "25%",
    feeLine: "Fee | 25% + VAT of package",
    paymentTerms: PAYMENT_TERMS,
    paymentNote: PAYMENT_NOTE,
    guaranteeWeeks: "16",
    paymentDays: "30",
    appendicesOn: true, // standard page since 20 Oct (it shows whenever there's at least one appendix)
    appendices: [
      { title: "Diversity & Inclusion", link: "" },
      { title: "Terms & Conditions", link: "" },
    ],
    brandedAd: "",
    brandedAdId: "",
    brandedFit: "fill", // fill | top | bottom | whole
    ...Object.fromEntries(PHOTO_SLOTS.map((s, i) => [s.key, STOCK_PHOTOS[i % STOCK_PHOTOS.length]])),
    photoTerms: "/proposal/terms-photo.jpg",
  };
}

// The Westmarq example from the template, used for the home-screen card and testing.
export function sampleProposal() {
  return {
    ...blankProposal(),
    clientName: "Westmarq",
    roleTitle: "Chief Technology Officer",
    consultant1: "Emma Noble",
    understanding: "Westmarq is at the start of an ambitious transformation. The technology strategy and direction of travel have been set at senior level. Richard and the leadership team, supported by fractional Transformation Director Tim Thompson, are clear about where they want to take the business. The next step is a full-time technology leader who can own that strategy and deliver it day to day.\nThe volume of transformation work now needs five-day-a-week leadership. So Westmarq is investing in a permanent CTO who can take the strategy and turn it into delivery across engineering, change, data and BI, information security and IT service. This is a genuinely broad, hands-on role. It suits someone who enjoys being close to the detail and the team, rather than a traditional corporate CTO.\nThe CTO will inherit a team with some real talent. Engineering and data are the two areas where the new CTO will make the biggest immediate impact.",
    about: "Westmarq is a national surveying business. It was formerly Legal & General Surveying Services and has now rebranded as Westmarq. The business provides lenders with property valuations and data to support their lending decisions. It has kept its existing surveying teams and lender relationships while it develops its technology and data services.\nThat makes this an exciting moment. Westmarq combines a trusted heritage, experienced RICS-qualified surveyors and strong lender relationships with a clear ambition to lead the market through better data and technology. Managing Director Richard Sexton has described Westmarq as representing where the business is going. This appointment is central to that journey.",
    jobTitle: "Chief Technology Officer",
    location: "Barnsley, 3–4 days per week on site",
    reportingTo: "Richard Sexton, Managing Director",
    directReports: "Change Manager, Head of Engineering, Data Manager, IT Support/Service Desk",
    salary: "£90,000–£110,000",
    contract: "Permanent, full-time",
    benefits: ["25 days holiday plus bank holidays", "Pension", "Private healthcare"],
    roleProfile: "Reporting to the Managing Director and leading a small team, you will shape and deliver a clear technology and digital strategy that supports Westmarq's growth. You will be accountable for the performance, security, and resilience of the organisation's systems and infrastructure, while championing the smarter use of data to inform decision-making at every level. As a visible member of the senior leadership team, you will build strong relationships across the organisation, translating complex technical topics into practical solutions that colleagues can trust and use with confidence.\n\nThis is an opportunity for an experienced technology leader who combines strategic vision with a hands-on, collaborative approach. You will manage key supplier relationships and budgets, oversee major change and improvement projects, and ensure robust governance around cyber security, information management, and compliance.",
    c1: {
      name: "Emma Noble",
      title: "Senior Business Director",
      email: "emman@elevationrecruitment.com",
      phone: "07710 096 839",
      about: "I lead the Technology & Transformation division at Elevation Recruitment Group, partnering with businesses across Yorkshire, the East Midlands, and the wider North of England to hire exceptional tech talent - fast.\nWith over 25 years' experience in recruitment and a specialism in technology and digital transformation, I bring genuine market knowledge to every search. My focus areas include SAP/ERP, Business Analysis, Digital Transformation, Data & BI, and senior tech leadership - covering both permanent and contract/interim appointments, from SMEs through to large enterprise organisations.\nAs a Board Director at Elevation Recruitment Group, I bring a perspective that goes beyond pure recruitment. As a former business owner, Managing Director, and Non-Executive Director, I am uniquely placed to advise and support both clients and candidates.",
      placements: "",
    },
    appendicesOn: true,
  };
}

// How many consultants are on the proposal (1-4). Older proposals only had the
// "two consultants" tick, so fall back to that.
export const MAX_CONSULTANTS = 4;
export function teamSize(p) {
  const n = Number(p && p.consultantCount);
  if (n >= 1) return Math.min(MAX_CONSULTANTS, Math.round(n));
  return p && p.twoConsultants ? 2 : 1;
}
// The consultants in order: [{ k: "c1", name, ...details }].
export function team(p) {
  return Array.from({ length: teamSize(p) }, (_, i) => {
    const k = `c${i + 1}`;
    const c = p[k] || {};
    return { ...c, k, name: c.name || p[`consultant${i + 1}`] || "" };
  });
}

// Normalise anything coming in from the form or a saved proposal.
export function normalise(input) {
  const base = blankProposal();
  const p = { ...base, ...(input || {}) };
  p.c1 = { ...base.c1, ...(input && input.c1) };
  p.c2 = { ...base.c2, ...(input && input.c2) };
  p.c3 = { ...base.c3, ...(input && input.c3) };
  p.c4 = { ...base.c4, ...(input && input.c4) };
  p.consultantCount = teamSize(p);
  p.twoConsultants = p.consultantCount >= 2;
  p.benefits = Array.isArray(p.benefits) ? p.benefits.slice(0, LIMITS.benefits) : [];
  p.appendices = Array.isArray(p.appendices) ? p.appendices.slice(0, 6) : [];
  // The fee line used to be built from the fee; older proposals get it written out.
  if (!(input && typeof input.feeLine === "string")) p.feeLine = `Fee | ${String(p.fee || "").trim() || "25%"} + VAT of package`;
  p.appendicesOn = true; // the Appendices page is standard now
  p.multiRole = !!p.multiRole;
  p.roles = (Array.isArray(p.roles) ? p.roles : []).slice(0, MAX_ROLES).map((r) => ({ ...blankRole(), ...(r || {}), noDirectReports: !!(r && r.noDirectReports) }));
  return p;
}

// A photo is only offered for a slot if it's big enough to fill it without
// being stretched more than 10% (so it stays sharp).
export function photoFits(photo, slot) {
  if (!photo || !photo.w || !photo.h) return true;
  const scale = Math.max(slot.w / photo.w, slot.h / photo.h);
  return scale <= 1.1;
}

// Put the best website photos into the slots, biggest slots first, no repeats.
export function assignPhotos(photos) {
  const out = {};
  const used = new Set();
  const order = [...PHOTO_SLOTS].sort((a, b) => b.w * b.h - a.w * a.h);
  // Biggest spaces first; each takes the best remaining photo, preferring ones that needed
  // little or no enlarging for that space (so the sharpest pictures go on the largest pages).
  for (const slot of order) {
    let best = null, bestVal = -Infinity;
    for (const ph of photos) {
      if (used.has(ph.url) || !photoFits(ph, slot)) continue;
      const ow = ph.origW || ph.w, oh = ph.origH || ph.h;
      const need = ow && oh ? Math.max(slot.w / ow, slot.h / oh) : 1;
      const val = (ph.score || 5) - 2.5 * Math.max(0, need - 1);
      if (val > bestVal) { best = ph; bestVal = val; }
    }
    if (best) { out[slot.key] = best.url; used.add(best.url); }
  }
  return out;
}

// Every free-text field, for the spelling and grammar check.
export function textFields(p) {
  const f = {
    roleTitle: p.roleTitle, understanding: p.understanding, about: p.about,
    jobTitle: p.jobTitle, location: p.location, reportingTo: p.reportingTo,
    directReports: p.noDirectReports ? "" : p.directReports, contract: p.contract,
    roleProfile: p.roleProfile, timeframe: p.timeframe,
    paymentTerms: p.paymentTerms, paymentNote: p.paymentNote, feeLine: p.feeLine,
  };
  (p.benefits || []).forEach((b, i) => { f[`benefits.${i}`] = b; });
  if (p.multiRole) {
    ["jobTitle", "location", "reportingTo", "directReports", "contract", "roleProfile"].forEach((k) => { delete f[k]; });
    (p.roles || []).forEach((r, i) => {
      ["jobTitle", "location", "reportingTo", "contract", "profile"].forEach((k) => { f[`roles.${i}.${k}`] = r[k]; });
      if (!r.noDirectReports) f[`roles.${i}.directReports`] = r.directReports;
    });
  }
  APPROACH.forEach((a) => { f[a.key] = p[a.key]; });
  const n = teamSize(p);
  team(p).forEach(({ k: c }) => {
    f[`${c}.title`] = p[c].title;
    if (n <= 2) f[`${c}.about`] = p[c].about;
    if (n >= 2) f[`${c}.placements`] = p[c].placements;
  });
  if (p.appendicesOn) (p.appendices || []).forEach((a, i) => { f[`appendices.${i}.title`] = a.title; });
  return Object.fromEntries(Object.entries(f).filter(([, v]) => String(v || "").trim()));
}

export const FIELD_NAMES = {
  roleTitle: "Role title", understanding: "Our Understanding", about: "About the client", paymentTerms: "Payment terms", paymentNote: "Payment terms note", feeLine: "Fee line", jobTitle: "Job title",
  location: "Location", reportingTo: "Reporting to", directReports: "Direct reports", contract: "Contract",
  roleProfile: "Role profile", timeframe: "Projected timeframe",
  approach1: "Market Mapping & Headhunting", approach2: "Online Attraction", approach3: "Maximising our Network", approach4: "LinkedIn RPS & Insights",
  "c1.title": "Consultant job title", "c1.about": "About me", "c1.placements": "Recent placements",
  "c2.title": "Second consultant job title", "c2.about": "Second consultant: About me", "c2.placements": "Second consultant: Recent placements",
  "c3.title": "Third consultant job title", "c3.placements": "Third consultant: Recent placements",
  "c4.title": "Fourth consultant job title", "c4.placements": "Fourth consultant: Recent placements",
};
const ROLE_FIELD = { jobTitle: "job title", location: "location", reportingTo: "reporting to", directReports: "direct reports", contract: "contract", profile: "profile" };
export const fieldName = (k) => FIELD_NAMES[k] || (k.startsWith("roles.") ? `Role ${Number(k.split(".")[1]) + 1} ${ROLE_FIELD[k.split(".")[2]] || ""}` : k.startsWith("benefits.") ? `Benefit ${Number(k.split(".")[1]) + 1}` : k.startsWith("appendices.") ? `Appendix ${Number(k.split(".")[1]) + 1} title` : k);

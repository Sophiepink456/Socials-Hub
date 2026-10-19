// "Promotional Targets" slide deck (Figma kDhpXG7nl3DIZzouYO572Q "Divisional Director Targets").
// The deck is a list of pages. Each page uses one of the Figma's slide designs and has its own
// title, subtitle, body text and points. The wording below is the Figma's, with two typos
// fixed ("divisional performance", "presence and").

// The slide designs, and which boxes each one shows in the editor.
export const DESIGNS = [
  { id: "cover", name: "Title slide", desc: "Big title over a dark photo, with the logo",
    fields: ["title", "subtitle", "body", "photo"], photo: "title-bg" },
  { id: "process", name: "Light panel, photo on the right", desc: "Like “The Process – Objective”",
    fields: ["title", "subtitle", "body", "points", "photo"], photo: "process-photo" },
  { id: "expect", name: "Photo on the left, dark panel", desc: "Like “The Process – Expectations”",
    fields: ["title", "subtitle", "body", "points", "photo"], photo: "expect-photo" },
  { id: "skills1", name: "Heading on a photo, points on dark", desc: "Like “Key Skills – Page 1/2”",
    fields: ["title", "subtitle", "pill", "body", "points", "size", "photo"], photo: "oper1-photo" },
  { id: "skills2", name: "Points on light, photo on the right", desc: "Like “Key Skills – Page 2/2”",
    fields: ["pill", "title", "body", "points", "size", "photo"], photo: "oper2-photo" },
];
export const designById = (id) => DESIGNS.find((x) => x.id === id) || DESIGNS[1];

// What each box is called for each design.
export const LABELS = {
  cover: { title: "Title", subtitle: "Subtitle (green)", body: "Body text (under the subtitle)" },
  process: { title: "Title", subtitle: "Subtitle (bold label)", body: "Body text", points: "Points with a green line (label optional)" },
  expect: { title: "Title", subtitle: "Subtitle (bold label)", body: "Body text (optional)", points: "Points with a green line (heading optional)" },
  skills1: { title: "Title (on the photo)", subtitle: "Subtitle (green, on the photo)", pill: "Page label (e.g. Page 1/2)", body: "Body text (optional)", points: "Points" },
  skills2: { pill: "Page label (e.g. Page 2/2)", title: "Title (optional)", body: "Body text (optional)", points: "Points" },
};

// Photos from the template to choose from.
export const PHOTOS = [
  { id: "title-bg", label: "Team meeting (wide)" },
  { id: "process-photo", label: "Consultant at her desk" },
  { id: "expect-photo", label: "Meeting room" },
  { id: "oper1-photo", label: "Team round a laptop" },
  { id: "oper2-photo", label: "Two at a desk" },
  { id: "behav1-photo", label: "Office floor" },
  { id: "behav2-photo", label: "Celebrating" },
];

const OPER1 = [
  { h: "Revenue, Budget & Commercial Accountability", t: "Take full ownership for the performance of your areas, with clear visibility of budget, revenue, pipeline and forecast. Identify risks early, act quickly where performance is behind plan and ensure there is a clear strategy to recover and deliver sustainable results." },
  { h: "Successfully Integrate & Drive P&S Performance", t: "Take ownership of the additional P&S team, quickly establishing clear expectations, priorities and ways of working. Drive improved consistency, productivity and revenue across the three consultants, while maintaining the momentum and performance of Sales & Marketing." },
  { h: "Create Consistent Best Habits & Ways of Working", t: "Work closely with Steph to ensure your teams are operating with consistent, high-performing recruitment habits and standards. Embed clear expectations around BD, job generation, candidate activity, account management, pipeline management and delivery - ensuring best practice becomes the day-to-day norm rather than something driven reactively." },
  { h: "Drive Business Development & Commercial Growth", t: "Lead the commercial strategy across P&S, working closely with Ben in his Group Sales Director role to strengthen BD activity, develop the team and drive a healthy, consistent flow of jobs and opportunities. Use his support and expertise to help the team build stronger commercial habits, while maintaining clear ownership for identifying and converting new clients, growth accounts, missed revenue and opportunities." },
];
const OPER2 = [
  { h: "Performance Management, Forecasting & Intervention", t: "Maintain a strong understanding of individual and team performance through effective MI, forecasting and regular performance conversations. Know where revenue is coming from, where gaps exist and what activity is required to close them - intervening early and decisively where performance or standards fall below expectation." },
  { h: "Lead by Example - Personal Billing & Recruitment Excellence", t: "Continue to deliver strong personal billings while taking on broader leadership responsibility. Model the pace, quality, commerciality and recruitment behaviours expected from your teams and remain close enough to delivery to support key roles, clients and opportunities when your involvement can materially impact the result." },
  { h: "Turn Strategy into Action", t: "Work increasingly closely with Steph and the wider leadership team to translate Group priorities into clear actions within your teams. Ensure agreed initiatives, processes and commercial priorities are implemented consistently, understood by the team and ultimately reflected in improved performance and results." },
];
const BEHAV1 = [
  { h: "Lead with Energy, Presence & Positivity", t: "Use your natural energy, charisma and people skills to create a positive, high-performing culture across your teams. Be visible, approachable and engaging, while setting the tone for how your teams show up, collaborate and contribute across the wider business." },
  { h: "Build a Stronger Team Elevation Culture", t: "Actively integrate Sales, Marketing and P&S more closely with the wider Group, ensuring they are visible, connected and recognised as an important part of Elevation rather than operating as standalone or background teams. Encourage collaboration, shared success and stronger relationships across divisions." },
  { h: "Trusted Senior Leadership & Alignment", t: "Operate as a trusted member of the senior leadership team, demonstrating clear alignment with Andy, Steph and the wider direction of the business. At Director level, leadership decisions and business priorities should be represented consistently and positively across your teams and the wider Group.\n\nWhere you have concerns, frustrations or challenge, these should be raised openly and constructively with Andy, Steph or within the SLT. At this level, there is an expectation of trust, loyalty and collective responsibility within the senior leadership team, and of representing the business positively and consistently to your teams, peers and the wider Group." },
];
const BEHAV2 = [
  { h: "Collaborate & Leverage Senior Support", t: "Work closely and proactively with Steph, using her experience, insight and support to help develop your leadership approach, strengthen your teams and accelerate their integration and performance. Be open to challenge, feedback and different perspectives, and actively seek support rather than trying to solve everything independently." },
  { h: "Adapt Your Leadership Style to the Individual", t: "As you take on a broader and more varied group of people, demonstrate the ability to flex your management and communication style to suit different personalities, experience levels and individual needs. While remaining authentic and playing to your natural strengths, recognise that effective leadership is not one-size-fits-all.\n\nAdapt your approach to get the best from each individual – knowing when to challenge, when to support, when to step in and when to give space – while maintaining clear and consistent standards across all teams." },
  { h: "Leadership Maturity & Consistency", t: "Demonstrate calm, consistent and solutions-focused leadership, particularly when under pressure or when dealing with challenge. Be considered in how you communicate, respond and represent the business, recognising the increased visibility and influence that comes with operating at Divisional Director level." },
];
const EXPECT = [
  "As a Divisional Director, you will be expected to operate beyond day-to-day management - taking greater ownership for divisional performance, people development, commercial growth and strategic direction, while creating consistent and sustainable results through the teams you lead.",
  "A key focus will be successfully taking on the additional responsibility for P&S, driving performance across the expanded team while maintaining the momentum and success of Sales & Marketing and continuing to deliver strong personal billings.",
  "You will be expected to demonstrate strong commercial awareness, accountability and decision-making, developing high-performing and increasingly self-sufficient teams, identifying opportunities for growth and addressing challenges proactively.",
  "At this level, impact should extend beyond your immediate teams, demonstrating greater autonomy, leadership presence and influence across the wider Group.",
  "You will also be expected to operate as a trusted member of the senior leadership team, aligned with the direction and priorities of the business, and to communicate and represent these consistently and positively across your teams and the wider Group.",
];
const OBJECTIVE = "To provide a clear 12-month development framework towards promotion to Divisional Director, with measurable targets across leadership, commercial performance, people development and wider Group contribution.";
const REVIEW = "Ongoing conversations with Andy and Steph to review progress, development and performance against the agreed targets.";

const page = (design, p) => ({ design, title: "", subtitle: "", body: "", pill: "", points: [], size: "roomy", photo: designById(design).photo, ...p });

// The Figma deck, page by page.
export const TARGETS_DEFAULT = {
  kind: "targets",
  person: "Kara Ellison",
  period: "September 2026 - September 2027",
  pages: [
    page("cover", { title: "Promotional Targets", subtitle: "Divisional Director", body: "Kara Ellison | Target Duration 12 months" }),
    page("process", { title: "The Process", subtitle: "Objective:", body: OBJECTIVE, points: [{ h: "Review Process:", t: REVIEW }] }),
    page("expect", { title: "The Process", subtitle: "Expectation of a Divisional Director:", points: EXPECT.map((t) => ({ h: "", t })) }),
    page("skills1", { title: "Key Skills of a Divisional Director", subtitle: "Operational", pill: "Page 1/2", points: OPER1, size: "compact", photo: "oper1-photo" }),
    page("skills2", { pill: "Page 2/2", points: OPER2, size: "compact", photo: "oper2-photo" }),
    page("skills1", { title: "Key Skills of a Divisional Director", subtitle: "Behavioural", pill: "Page 1/2", points: BEHAV1, size: "roomy", photo: "behav1-photo" }),
    page("skills2", { pill: "Page 2/2", points: BEHAV2, size: "roomy", photo: "behav2-photo" }),
  ],
};

// A new page of a design, filled with that design's example from the Figma to type over.
export function newPage(design) {
  const ex = TARGETS_DEFAULT.pages.find((p) => p.design === design);
  return clone(ex || page(design, {}));
}

export const MAX_PAGES = 20;
export const MAX_POINTS = 6;

const str = (v) => (v == null ? "" : String(v));
const clone = (x) => JSON.parse(JSON.stringify(x));

export function blankTargets() {
  return clone(TARGETS_DEFAULT);
}

// Documents made before pages could be added (fixed slides + sections) become pages.
function fromOld(o) {
  const pages = [
    page("cover", { title: o.title, subtitle: o.role, body: [o.person, o.duration].filter((x) => str(x).trim()).join(" | ") }),
    page("process", { title: "The Process", subtitle: "Objective:", body: o.objective, points: str(o.review).trim() ? [{ h: "Review Process:", t: o.review }] : [] }),
    page("expect", { title: "The Process", subtitle: o.expectHeading, points: (o.expectations || []).map((t) => ({ h: "", t })) }),
  ];
  (o.sections || []).forEach((s, si) => {
    const photos = si % 2 ? ["behav1-photo", "behav2-photo"] : ["oper1-photo", "oper2-photo"];
    const used = (s.pages || []).filter((pg) => (pg || []).length);
    used.forEach((pg, n) => {
      const pill = used.length > 1 ? `Page ${n + 1}/${used.length}` : "";
      pages.push(n === 0
        ? page("skills1", { title: o.skillsTitle, subtitle: s.name, pill, points: pg, size: s.style, photo: photos[0] })
        : page("skills2", { pill, points: pg, size: s.style, photo: photos[1] }));
    });
  });
  return { kind: "targets", person: o.person, period: o.period, pages };
}

export function normaliseTargets(input) {
  let src = input && typeof input === "object" ? input : null;
  if (src && !Array.isArray(src.pages) && (src.sections || src.objective != null)) src = fromOld(src);
  const d = { ...clone(TARGETS_DEFAULT), ...(src || {}) };
  d.kind = "targets";
  d.person = str(d.person);
  d.period = str(d.period);
  d.pages = (Array.isArray(d.pages) ? d.pages : []).slice(0, MAX_PAGES).map((p) => {
    const design = designById(p && p.design).id;
    return {
      design,
      title: str(p && p.title),
      subtitle: str(p && p.subtitle),
      body: str(p && p.body),
      pill: str(p && p.pill),
      points: (Array.isArray(p && p.points) ? p.points : []).slice(0, MAX_POINTS).map((it) => ({ h: str(it && it.h), t: str(it && it.t) })),
      size: p && p.size === "compact" ? "compact" : "roomy",
      photo: PHOTOS.some((x) => x.id === (p && p.photo)) ? p.photo : designById(design).photo,
    };
  });
  return d;
}

export const targetsFileName = (d) => {
  const cover = (d.pages || []).find((p) => p.design === "cover");
  const title = (cover && cover.title) || "Promotional Targets";
  return `${[title, d.person].filter((x) => String(x || "").trim()).join(" - ").replace(/[\\/:*?"<>|]+/g, "").trim() || "Promotional Targets"}.pdf`;
};

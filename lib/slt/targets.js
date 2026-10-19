// "Promotional Targets" slide deck (Figma kDhpXG7nl3DIZzouYO572Q "Divisional Director Targets").
// The wording below is the Figma's, with two typos fixed ("divisional performance", "presence and").

export const TARGETS_DEFAULT = {
  kind: "targets",
  person: "Kara Ellison",
  role: "Divisional Director",
  duration: "Target Duration 12 months",
  period: "September 2026 - September 2027",
  title: "Promotional Targets",
  objective:
    "To provide a clear 12-month development framework towards promotion to Divisional Director, with measurable targets across leadership, commercial performance, people development and wider Group contribution.",
  review: "Ongoing conversations with Andy and Steph to review progress, development and performance against the agreed targets.",
  expectHeading: "Expectation of a Divisional Director:",
  expectations: [
    "As a Divisional Director, you will be expected to operate beyond day-to-day management - taking greater ownership for divisional performance, people development, commercial growth and strategic direction, while creating consistent and sustainable results through the teams you lead.",
    "A key focus will be successfully taking on the additional responsibility for P&S, driving performance across the expanded team while maintaining the momentum and success of Sales & Marketing and continuing to deliver strong personal billings.",
    "You will be expected to demonstrate strong commercial awareness, accountability and decision-making, developing high-performing and increasingly self-sufficient teams, identifying opportunities for growth and addressing challenges proactively.",
    "At this level, impact should extend beyond your immediate teams, demonstrating greater autonomy, leadership presence and influence across the wider Group.",
    "You will also be expected to operate as a trusted member of the senior leadership team, aligned with the direction and priorities of the business, and to communicate and represent these consistently and positively across your teams and the wider Group.",
  ],
  skillsTitle: "Key Skills of a Divisional Director",
  sections: [
    {
      name: "Operational",
      style: "compact",
      pages: [
        [
          { h: "Revenue, Budget & Commercial Accountability", t: "Take full ownership for the performance of your areas, with clear visibility of budget, revenue, pipeline and forecast. Identify risks early, act quickly where performance is behind plan and ensure there is a clear strategy to recover and deliver sustainable results." },
          { h: "Successfully Integrate & Drive P&S Performance", t: "Take ownership of the additional P&S team, quickly establishing clear expectations, priorities and ways of working. Drive improved consistency, productivity and revenue across the three consultants, while maintaining the momentum and performance of Sales & Marketing." },
          { h: "Create Consistent Best Habits & Ways of Working", t: "Work closely with Steph to ensure your teams are operating with consistent, high-performing recruitment habits and standards. Embed clear expectations around BD, job generation, candidate activity, account management, pipeline management and delivery - ensuring best practice becomes the day-to-day norm rather than something driven reactively." },
          { h: "Drive Business Development & Commercial Growth", t: "Lead the commercial strategy across P&S, working closely with Ben in his Group Sales Director role to strengthen BD activity, develop the team and drive a healthy, consistent flow of jobs and opportunities. Use his support and expertise to help the team build stronger commercial habits, while maintaining clear ownership for identifying and converting new clients, growth accounts, missed revenue and opportunities." },
        ],
        [
          { h: "Performance Management, Forecasting & Intervention", t: "Maintain a strong understanding of individual and team performance through effective MI, forecasting and regular performance conversations. Know where revenue is coming from, where gaps exist and what activity is required to close them - intervening early and decisively where performance or standards fall below expectation." },
          { h: "Lead by Example - Personal Billing & Recruitment Excellence", t: "Continue to deliver strong personal billings while taking on broader leadership responsibility. Model the pace, quality, commerciality and recruitment behaviours expected from your teams and remain close enough to delivery to support key roles, clients and opportunities when your involvement can materially impact the result." },
          { h: "Turn Strategy into Action", t: "Work increasingly closely with Steph and the wider leadership team to translate Group priorities into clear actions within your teams. Ensure agreed initiatives, processes and commercial priorities are implemented consistently, understood by the team and ultimately reflected in improved performance and results." },
        ],
      ],
    },
    {
      name: "Behavioural",
      style: "roomy",
      pages: [
        [
          { h: "Lead with Energy, Presence & Positivity", t: "Use your natural energy, charisma and people skills to create a positive, high-performing culture across your teams. Be visible, approachable and engaging, while setting the tone for how your teams show up, collaborate and contribute across the wider business." },
          { h: "Build a Stronger Team Elevation Culture", t: "Actively integrate Sales, Marketing and P&S more closely with the wider Group, ensuring they are visible, connected and recognised as an important part of Elevation rather than operating as standalone or background teams. Encourage collaboration, shared success and stronger relationships across divisions." },
          { h: "Trusted Senior Leadership & Alignment", t: "Operate as a trusted member of the senior leadership team, demonstrating clear alignment with Andy, Steph and the wider direction of the business. At Director level, leadership decisions and business priorities should be represented consistently and positively across your teams and the wider Group.\n\nWhere you have concerns, frustrations or challenge, these should be raised openly and constructively with Andy, Steph or within the SLT. At this level, there is an expectation of trust, loyalty and collective responsibility within the senior leadership team, and of representing the business positively and consistently to your teams, peers and the wider Group." },
        ],
        [
          { h: "Collaborate & Leverage Senior Support", t: "Work closely and proactively with Steph, using her experience, insight and support to help develop your leadership approach, strengthen your teams and accelerate their integration and performance. Be open to challenge, feedback and different perspectives, and actively seek support rather than trying to solve everything independently." },
          { h: "Adapt Your Leadership Style to the Individual", t: "As you take on a broader and more varied group of people, demonstrate the ability to flex your management and communication style to suit different personalities, experience levels and individual needs. While remaining authentic and playing to your natural strengths, recognise that effective leadership is not one-size-fits-all.\n\nAdapt your approach to get the best from each individual – knowing when to challenge, when to support, when to step in and when to give space – while maintaining clear and consistent standards across all teams." },
          { h: "Leadership Maturity & Consistency", t: "Demonstrate calm, consistent and solutions-focused leadership, particularly when under pressure or when dealing with challenge. Be considered in how you communicate, respond and represent the business, recognising the increased visibility and influence that comes with operating at Divisional Director level." },
        ],
      ],
    },
  ],
};

export const MAX_EXPECTATIONS = 6;
export const MAX_ITEMS = 5;
export const MAX_SECTIONS = 4;

const str = (v, d = "") => (v == null ? d : String(v));
const clone = (x) => JSON.parse(JSON.stringify(x));

export function blankTargets() {
  return clone(TARGETS_DEFAULT);
}

export function normaliseTargets(input) {
  const d = { ...clone(TARGETS_DEFAULT), ...(input && typeof input === "object" ? input : {}) };
  for (const k of ["person", "role", "duration", "period", "title", "objective", "review", "expectHeading", "skillsTitle"]) d[k] = str(d[k]);
  d.kind = "targets";
  d.expectations = (Array.isArray(d.expectations) ? d.expectations : []).map((x) => str(x)).slice(0, MAX_EXPECTATIONS);
  d.sections = (Array.isArray(d.sections) ? d.sections : []).slice(0, MAX_SECTIONS).map((s) => ({
    name: str(s && s.name),
    style: s && s.style === "compact" ? "compact" : "roomy",
    pages: (Array.isArray(s && s.pages) ? s.pages : []).slice(0, 2).map((pg) => (Array.isArray(pg) ? pg : []).slice(0, MAX_ITEMS).map((it) => ({ h: str(it && it.h), t: str(it && it.t) }))),
  }));
  return d;
}

// "a Divisional Director" / "an Area Manager".
export const aOrAn = (w) => (/^[aeiou]/i.test(String(w || "").trim()) ? "an" : "a");
export const expectHeadingFor = (role) => `Expectation of ${aOrAn(role)} ${String(role || "").trim()}:`;
export const skillsTitleFor = (role) => `Key Skills of ${aOrAn(role)} ${String(role || "").trim()}`;

export const targetsFileName = (d) =>
  `${[d.title || "Promotional Targets", d.person].filter((x) => String(x || "").trim()).join(" - ").replace(/[\\/:*?"<>|]+/g, "").trim() || "Promotional Targets"}.pdf`;

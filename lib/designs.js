// ---- The designs offered on the home screen --------------------------------
// One entry per design. The editor builds its form from `fields`, and the
// home-screen preview is drawn from `sample`, so a new design needs an entry
// here plus a renderer in app/api/render/[id]/route.js.
//
// `slide` on a field says which slide it appears on, so the preview jumps to
// that slide while someone is typing in it.
import { DIVISIONS, CONTRACT_TYPES } from "./brand";

const JOB_FIELDS = [
  { key: "division", label: "Division", type: "select", options: DIVISIONS, placeholder: "Select a division", slide: 0 },
  { key: "title", label: "Job title", type: "text", placeholder: "e.g. Recruitment & HR Advisor", max: 45, slide: 0 },
  { key: "location", label: "Location", type: "text", placeholder: "e.g. Driffield", max: 30, slide: 0 },
  { key: "salary", label: "Salary", type: "text", placeholder: "e.g. £50k - £55k  or  Up to £35k", max: 40, slide: 0,
    toggle: { key: "hideSalary", label: "Hide salary (shows £Competitive)" } },
  { key: "contract", label: "Contract type", type: "select", options: CONTRACT_TYPES, placeholder: "Permanent (not shown)", optional: true, slide: 0 },
];

const JOB_SAMPLE = {
  division: "PEOPLE & HR",
  title: "Recruitment Advisor",
  location: "Driffield",
  salary: "Up to £35k",
  contract: "Contract",
};

const CANDIDATE_FIELDS = [
  { key: "title", label: "Candidate job title", type: "text", placeholder: "e.g. Senior Mechanical Engineer (Manager)", max: 50, slide: 0 },
  { key: "details", label: "Details line", type: "text", placeholder: "e.g. Chesterfield | Heavy Engineering", max: 45, slide: 0 },
];

const CANDIDATE_SAMPLE = {
  title: "Interim Finance Director",
  details: "Big 4 Trained | Board Level",
  about: "£250k → £1m EBITDA\nM&A | MBO | Business Sale\nAvailable Shortly",
};

export const DESIGNS = [
  {
    id: "job-ad",
    title: "LinkedIn Job Ad",
    blurb: "Photo background with the job title, location and salary.",
    width: 1080,
    height: 1350,
    slides: 1,
    photo: true, // random photo from public/designs/job-ad/photos/
    fields: JOB_FIELDS.map(({ max, ...f }) => (f.key === "salary" ? { ...f, max: 32 } : { ...f, max })),
    sample: JOB_SAMPLE,
  },
  {
    id: "job-ideal",
    samplePhoto: "dsc05135.jpg", // photo used on the home-screen card
    title: "Job Ad + Ideal Candidate",
    blurb: "Job ad cover, then a slide describing the ideal candidate.",
    width: 1080,
    height: 1350,
    slides: 2,
    photo: true,
    photoSet: "job-cover",
    fields: [
      ...JOB_FIELDS,
      { key: "ideal", label: "Ideal candidate", type: "textarea", rows: 4, max: 260, slide: 1,
        placeholder: "e.g. Previous buying or procurement experience within construction, civil engineering or the built environment required." },
    ],
    sample: { ...JOB_SAMPLE, ideal: "Previous recruitment or HR experience, ideally in a fast-paced agency or in-house team." },
  },
  {
    id: "job-carousel",
    samplePhoto: "dsc05256.jpg", // photo used on the home-screen card
    title: "Job Ad Carousel – All Details",
    blurb: "Cover, About the Role, Package and a contact slide.",
    width: 1080,
    height: 1350,
    slides: 4,
    photo: true,
    photoSet: "job-cover",
    fields: [
      ...JOB_FIELDS,
      { key: "about", label: "About the Role", type: "textarea", rows: 6, maxLines: 6, max: 70, slide: 1,
        hint: "One point per line, up to 6.", placeholder: "Plans to double plots by 2028\nJoin a legal team growing as fast as the business" },
      { key: "package", label: "Package", type: "textarea", rows: 6, maxLines: 6, max: 70, slide: 2,
        hint: "One point per line, up to 6.", placeholder: "£45k - £55k salary\nCompany car or allowance\n27 days holiday + bank holidays" },
      { key: "question", label: "Closing question", type: "textarea", rows: 2, max: 110, slide: 3,
        hint: "“Let’s talk.” is added underneath in green.", placeholder: "e.g. 3+ years' plot sales or residential conveyancing experience?" },
      { key: "consultant", label: "Consultant", type: "consultant", slide: 3, placeholder: "Select a consultant" },
      { key: "phone", label: "Phone number", type: "text", max: 20, slide: 3, placeholder: "e.g. 07511 874 664" },
    ],
    sample: {
      ...JOB_SAMPLE,
      about: "Join a growing in-house team\nVaried, people-focused role",
      package: "Up to £35k\nHybrid working",
      question: "Ready for your next move in recruitment?",
    },
  },
  {
    id: "candidate-ad",
    samplePhoto: "dsc05799.jpg", // photo used on the home-screen card
    title: "Candidate Ad – 1 Page",
    blurb: "Brand new candidate, with their job title and a short details line.",
    width: 1080,
    height: 1350,
    slides: 1,
    photo: true,
    photoSet: "job-cover",
    fields: CANDIDATE_FIELDS,
    sample: CANDIDATE_SAMPLE,
  },
  {
    id: "candidate-about",
    samplePhoto: "dsc05534.jpg", // photo used on the home-screen card
    title: "Candidate Ad + About",
    blurb: "Candidate cover, then a green page about them with your contact details.",
    width: 1080,
    height: 1350,
    slides: 2,
    photo: true,
    photoSet: "job-cover",
    fields: [
      ...CANDIDATE_FIELDS,
      { key: "about", label: "About the Candidate", type: "textarea", rows: 6, maxLines: 6, max: 55, slide: 1,
        hint: "One point per line, up to 6.", placeholder: "£250k → £1m EBITDA\nM&A | MBO | Business Sale\nAvailable Shortly" },
      { key: "consultant", label: "Consultant", type: "consultant", slide: 1, placeholder: "Select a consultant" },
      { key: "phone", label: "Phone number", type: "text", max: 20, slide: 1, placeholder: "e.g. 07702 910 273" },
    ],
    sample: CANDIDATE_SAMPLE,
  },
  {
    id: "live-roles",
    samplePhoto: "elevation-recruitment-office-73.jpg", // photo used on the home-screen card
    title: "Live Roles Post",
    blurb: "A division heading with up to 10 live roles and their locations.",
    width: 1080,
    height: 1350,
    slides: 1,
    photo: true,
    photoSet: "job-cover",
    fields: [
      { key: "heading", label: "Division", type: "text", max: 30, placeholder: "e.g. Design & Projects" },
      { key: "roles", label: "Roles", type: "textarea", rows: 10, maxLines: 10, max: 55,
        hint: "One role per line, as Role | Location.",
        placeholder: "Lead Design Engineer | Sheffield\nProject Manager | Doncaster\nCAD Technician | Rotherham" },
    ],
    sample: {
      heading: "Design & Projects",
      roles: "Electrical Design Engineer (Senior) | Barnsley\nApplications Engineer (Defence) | Leeds\nLead Design Engineer | Sheffield\nProject Manager | Doncaster\nCAD Technician | Rotherham\nDesign/Technical Engineer | Lincoln",
    },
  },
  {
    id: "statement",
    title: "Statement Graphic",
    blurb: "One bold statement and a supporting line. Green, black or grey.",
    width: 1080,
    height: 1350,
    slides: 1,
    fields: [
      { key: "variant", label: "Colour", type: "select", options: ["Green", "Black", "Grey"], default: "Green" },
      { key: "statement", label: "Statement", type: "textarea", rows: 3, max: 110,
        hint: "Wrap words in *asterisks* to make them green. A green full stop is added for you.",
        placeholder: "e.g. Leadership appointments are too important to leave to chance" },
      { key: "subline", label: "Supporting line", type: "text", max: 70, optional: true,
        placeholder: "e.g. Leadership & Executive Search across the North." },
    ],
    sample: {
      variant: "Green",
      statement: "Leadership appointments are too important to leave to chance",
      subline: "Leadership & Executive Search across the North.",
    },
  },
  {
    id: "testimonial",
    title: "Testimonial",
    blurb: "A five-star review in a glass card. Green, dark or light.",
    width: 1080,
    height: 1350,
    slides: 1,
    fields: [
      { key: "variant", label: "Colour", type: "select", options: ["Green", "Dark", "Light"], default: "Green" },
      { key: "headline", label: "Headline", type: "text", max: 70, optional: true,
        placeholder: "e.g. Excellent service from Charlotte at Elevation." },
      { key: "quote", label: "Review", type: "textarea", rows: 8, max: 900,
        hint: "Short reviews with no headline are shown large and bold.",
        placeholder: "Paste the review here" },
      { key: "name", label: "Reviewer", type: "text", max: 40, placeholder: "e.g. JORDAN F  or  Kate Barlow, Smedbo" },
    ],
    sample: {
      variant: "Green",
      quote: "Sarah has been absolutely amazing throughout the whole process and I would recommend Sarah to anyone who would need the help.",
      name: "HANI P",
    },
  },
];

// ---- 5 Reasons Carousel (Figma 2:401 .. 2:242) -----------------------------
const REASON_SAMPLE = [
  ["Access to more candidates", "We have networks of skilled workers who may not be actively looking at job boards but are open to the right opportunity."],
  ["Faster hiring", "Instead of spending weeks sorting through applications, we can quickly identify and introduce suitable candidates."],
  ["We understand the market", "Whether you're looking for Welders, CNC Machinists, Quality Inspectors, FLT Drivers or General Operatives we know the skills and experience to look for."],
  ["Less hassle for your team", "From advertising and screening to arranging interviews, we take care of the time-consuming parts of the hiring process."],
  ["Better quality hires", "Candidates are pre-screened and assessed before they're put forward so you're meeting people who can do the job."],
];

DESIGNS.push({
  id: "reasons",
  samplePhoto: "dsc05256.jpg",
  title: "5 Reasons Carousel",
  blurb: "A question on the cover, five reasons, then a closing “Let’s talk.” slide.",
  width: 1080,
  height: 1350,
  slides: 7,
  photo: true,
  photoSet: "job-cover",
  photoSlides: [0, 2, 4, 6], // cover, reasons two and four, and the end slide have photos
  fields: [
    { key: "question", label: "Cover question", type: "textarea", rows: 2, max: 70, slide: 0,
      hint: "Wrap words in *asterisks* to make them green.",
      placeholder: "e.g. Why use recruitment agencies for *skilled shop floor* hiring?" },
    ...REASON_SAMPLE.flatMap(([t, p], i) => [
      { key: `h${i + 1}`, label: `Reason ${i + 1}`, type: "heading", slide: i + 1 },
      { key: `r${i + 1}`, label: "Title", type: "text", max: 32, slide: i + 1, placeholder: `e.g. ${t}` },
      { key: `r${i + 1}text`, label: "Paragraph", type: "textarea", rows: 3, max: 170, slide: i + 1, placeholder: `e.g. ${p}` },
    ]),
    { key: "hEnd", label: "Closing slide", type: "heading", slide: 6 },
    { key: "closing", label: "Closing question", type: "textarea", rows: 2, max: 50, slide: 6,
      hint: "“Let’s talk.” is added after it in green.", placeholder: "e.g. Need to fill a shop floor role?" },
  ],
  sample: {
    question: "Why use recruitment agencies for *skilled shop floor* hiring?",
    ...Object.fromEntries(REASON_SAMPLE.flatMap(([t, p], i) => [[`r${i + 1}`, t], [`r${i + 1}text`, p]])),
    closing: "Need to fill a shop floor role?",
  },
});

// ---- Multi Vacancy Carousel (Figma 3:1310 .. 3:1011) ------------------------
// Cover, one slide per job (1 to 7), end slide. The cover and end slide are
// fixed brand slides; consultants only fill in the jobs.
export const MAX_JOBS = 7;
export const jobCount = (v) => Math.max(1, Math.min(MAX_JOBS, parseInt((v && v.jobs) || "3", 10) || 3));

const jobFields = (i) => {
  const when = (v) => jobCount(v) >= i;
  const p = `j${i}_`;
  return [
    { key: `${p}h`, label: `Job ${i}`, type: "heading", slide: i, when },
    { key: `${p}division`, label: "Division", type: "select", options: DIVISIONS, placeholder: "Select a division", slide: i, when },
    { key: `${p}title`, label: "Job title", type: "text", max: 45, slide: i, when, placeholder: "e.g. Senior Production Planner" },
    { key: `${p}location`, label: "Location", type: "text", max: 30, slide: i, when, placeholder: "e.g. Gainsborough" },
    { key: `${p}salary`, label: "Salary", type: "text", max: 32, slide: i, when, placeholder: "e.g. £45k  or  Up to £35k",
      toggle: { key: `${p}hideSalary`, label: "Hide salary (shows £Competitive)" } },
    { key: `${p}consultant`, label: "Consultant", type: "consultant", slide: i, when, placeholder: i > 1 ? "Same as Job 1" : "Select a consultant" },
    { key: `${p}phone`, label: "Phone number", type: "text", max: 20, slide: i, when,
      placeholder: i > 1 ? "Same as Job 1" : "e.g. 07966 577 832",
      hint: i > 1 ? "Leave the consultant and phone blank to use Job 1’s." : undefined },
  ];
};

DESIGNS.push({
  id: "vacancies",
  samplePhoto: "dsc05169.jpg",
  title: "Multi Vacancy Carousel",
  blurb: "Up to 7 jobs, one per slide, between a “Your Next Career” cover and an end slide.",
  slidesLabel: "3 to 9 slides",
  width: 1080,
  height: 1350,
  slides: (v) => jobCount(v) + 2,
  photo: true,
  photoSet: "job-cover",
  photoSlides: (v) => Array.from({ length: jobCount(v) + 1 }, (_, n) => n), // cover and every job slide
  fields: [
    { key: "jobs", label: "Number of jobs", type: "select", options: ["1", "2", "3", "4", "5", "6", "7"], default: "3",
      hint: "Each job gets its own slide." },
    ...Array.from({ length: MAX_JOBS }, (_, i) => jobFields(i + 1)).flat(),
  ],
  sample: {
    jobs: "3",
    j1_division: "PROCUREMENT & SUPPLY CHAIN", j1_title: "Senior Production Planner", j1_location: "Gainsborough", j1_salary: "£45k",
    j1_consultant: "Daniel King", j1_phone: "07966 577 832",
    j2_division: "ENGINEERING", j2_title: "Maintenance Engineer", j2_location: "Hull", j2_salary: "Up to £48k",
    j3_division: "PEOPLE & HR", j3_title: "Recruitment Advisor", j3_location: "Driffield", j3_salary: "Up to £35k",
  },
});

export function getDesign(id) {
  return DESIGNS.find((d) => d.id === id) || null;
}

// Slide count and photo slides can depend on the form (e.g. number of jobs).
export const slideCount = (d, v = {}) => (typeof d.slides === "function" ? d.slides(v) : d.slides);
export const photoSlides = (d, v = {}) =>
  !d.photo ? [] : typeof d.photoSlides === "function" ? d.photoSlides(v) : d.photoSlides || [0];
export const visibleFields = (d, v = {}) => d.fields.filter((f) => !f.when || f.when(v));

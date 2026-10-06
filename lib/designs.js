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
];

export function getDesign(id) {
  return DESIGNS.find((d) => d.id === id) || null;
}

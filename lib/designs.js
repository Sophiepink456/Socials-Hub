// ---- The designs offered on the home screen --------------------------------
// One entry per design. The editor builds its form from `fields`, and the
// home-screen preview is drawn from `sample`, so a new design needs an entry
// here plus a render file in lib/render/.
import { DIVISIONS, CONTRACT_TYPES } from "./brand";

export const DESIGNS = [
  {
    id: "job-ad",
    title: "LinkedIn Job Ad",
    blurb: "Photo background with the job title, location and salary.",
    width: 1080,
    height: 1350,
    slides: 1,
    photo: true, // random photo from public/designs/job-ad/photos/
    fields: [
      { key: "division", label: "Division", type: "select", options: DIVISIONS, placeholder: "Select a division" },
      { key: "title", label: "Job title", type: "text", placeholder: "e.g. Recruitment & HR Advisor", max: 45 },
      { key: "location", label: "Location", type: "text", placeholder: "e.g. Driffield", max: 30 },
      { key: "salary", label: "Salary", type: "text", placeholder: "e.g. £50k - £55k  or  Up to £35k", max: 32,
        toggle: { key: "hideSalary", label: "Hide salary (shows £Competitive)" } },
      { key: "contract", label: "Contract type", type: "select", options: CONTRACT_TYPES, placeholder: "Permanent (not shown)", optional: true },
    ],
    sample: {
      division: "PEOPLE & HR",
      title: "Recruitment Advisor",
      location: "Driffield",
      salary: "Up to £35k",
      contract: "Contract",
    },
  },
];

export function getDesign(id) {
  return DESIGNS.find((d) => d.id === id) || null;
}

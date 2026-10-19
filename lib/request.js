// The Marketing Request Form: the same questions as the monday.com "Creative Request Form"
// (form 796329be1ee176233e8aa9aa604cfb5f), sent straight to the "Marketing & Design WIP" board.

export const BOARD_ID = 1260603810;
export const GROUP_ID = "new_group"; // "Day to Day WIP", where the monday form puts them
export const BOARD_URL = `https://elevation757554.monday.com/boards/${BOARD_ID}`;

// Board columns each answer goes into.
export const COLUMNS = {
  name: "requested_by", // text
  email: "email_mm5j8eq2", // email
  requestedOn: "date_mm1bg3qd", // date + time
  deadline: "date_1__1", // date
  brand: "dropdown_mm1482av", // dropdown
  client: "text_mm142nfm", // text
  requesting: "dropdown_mm14fvn4", // dropdown
  content: "long_text_mm142h3a", // long text
  files: "files__1", // file
};

// In the monday form's order. Every label exists on the board's dropdowns.
export const BRANDS = [
  "Accountancy & Finance", "Business Support", "Engineering", "HSEQ", "Interim & Contract", "Leadership & Exec", "Manufacturing",
  "Marketing", "People & HR", "Procurement & Supply Chain", "Sales", "Technology & Transformation", "ERG", "Client Branded", "Parkinson Lee",
];
export const REQUESTS = [
  "Case Study", "Credentials", "Document", "Candidate Pack", "E-shot (Fancy Tracker email)", "Event - Invite", "Event - Name Tag", "Event - Asset",
  "LinkedIn Candidate AD", "LinkedIn Candidate AD (Detailed)", "LinkedIn Full Client Branded AD", "LinkedIn Client Branded AD (Detailed)",
  "LinkedIn Job AD", "LinkedIn Job AD (Detailed)", "LinkedIn Job AD Carousel (multiple pages)", "Pitch Document", "Poll results (Animation)",
  "Presentation", "Proposal", "Social Carousel (Multiple pages)", "Social Post (Single page)", "Video AD", "testimonial",
  "Other - Please add notes into content required",
];
export const MAX_REQUESTS = 2;
export const MAX_FILES = 5;
export const MAX_FILE_MB = 4; // what one upload to the hub can carry

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Check and tidy an answer set. Returns { data } or { error }.
export function cleanRequest(b) {
  const s = (v, n) => String(v == null ? "" : v).trim().slice(0, n);
  const d = {
    name: s(b && b.name, 120),
    email: s(b && b.email, 160).toLowerCase(),
    deadline: s(b && b.deadline, 10),
    brand: (Array.isArray(b && b.brand) ? b.brand : []).filter((x) => BRANDS.includes(x)),
    client: s(b && b.client, 300),
    requesting: (Array.isArray(b && b.requesting) ? b.requesting : []).filter((x) => REQUESTS.includes(x)).slice(0, MAX_REQUESTS),
    content: s(b && b.content, 8000),
  };
  if (!d.name) return { error: "Please add your name." };
  if (!EMAIL.test(d.email)) return { error: "Please add a valid email address." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.deadline)) return { error: "Please choose a deadline." };
  if (!d.requesting.length) return { error: "Please choose what you’re requesting." };
  if (!d.content) return { error: "Please describe the content required." };
  return { data: d };
}

// The item's name on the board, e.g. "Candidate Pack – Lincoln & York (Bethany Vaines)".
export function itemName(d) {
  const what = d.requesting.join(" + ");
  const who = d.client || d.brand.join(", ");
  return `${what}${who ? ` – ${who}` : ""} (${d.name})`.slice(0, 250);
}

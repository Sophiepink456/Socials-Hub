// ---- Brand settings --------------------------------------------------------
// Change these on a rebrand. Everything in the hub reads from here.
export const GREEN = "#93BF20";
export const BLACK = "#0B0B0B";
export const WHITE = "#FFFFFF";

export const DIVISIONS = [
  "ACCOUNTANCY & FINANCE",
  "BUSINESS SUPPORT",
  "ENGINEERING",
  "HSE & QUALITY",
  "LEADERSHIP & EXECUTIVE",
  "MAINTENANCE",
  "MANUFACTURING",
  "MARKETING",
  "PEOPLE & HR",
  "PROCUREMENT & SUPPLY CHAIN",
  "SALES",
  "SKILLED SHOP FLOOR",
  "TECHNOLOGY & TRANSFORMATION",
];

export const CONTRACT_TYPES = ["Contract", "FTC", "Temporary", "Temp to Perm", "Part-time"];

// "LEADERSHIP & EXECUTIVE" -> "leadership-executive" (the photo folder name)
export function slug(s) {
  return String(s || "").toLowerCase().replace(/&/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

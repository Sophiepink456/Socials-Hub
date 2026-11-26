// Shared helpers for the External Policies folder (Commercial Hub).
export const POLICY_DIR = "policies/external";

const TYPES = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
};

// Content type for an allowed file name, or "" if the file type isn't allowed.
export function policyType(name) {
  const ext = String(name).split(".").pop().toLowerCase();
  return TYPES[ext] || "";
}

// Keep only the file's own name, with no folders and no odd characters.
export function cleanPolicyName(name) {
  const base = String(name || "").split(/[\\/]/).pop().normalize("NFC");
  const clean = base.replace(/[^\w .,()&'+-]/g, "").replace(/\s+/g, " ").trim();
  return clean && !clean.startsWith(".") ? clean.slice(0, 150) : "";
}

// "DPIA003 Temp Payroll.pdf" -> "DPIA003 Temp Payroll"; drops a trailing " (2)" left by downloads.
export function policyTitle(name) {
  return name.replace(/\.[^.]+$/, "").replace(/\s*\(\d+\)$/, "").trim();
}

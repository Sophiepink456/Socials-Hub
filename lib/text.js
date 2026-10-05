// Shared text helpers for the designs.

function toNum(v) {
  const n = parseFloat(String(v == null ? "" : v).replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}
const k = (n) => "£" + (n >= 1000 ? Math.round(n / 1000) + "k" : n);

// Consultants can type the salary however they like ("Up to £35k",
// "c£38k", "£45k-£55k + car") and it's shown as typed. Plain numbers like
// "50000 - 55000" are tidied into "£50k - £55k", matching the LinkedIn ads.
export function salaryText(raw, hide) {
  if (hide) return "£Competitive";
  const s = String(raw || "").trim();
  if (!s) return "£Competitive";
  if (/^[£\d,.\s\-–to]+$/i.test(s) && /\d{4,}/.test(s.replace(/,/g, ""))) {
    const nums = s.replace(/,/g, "").match(/\d+(?:\.\d+)?/g) || [];
    const a = toNum(nums[0]), b = toNum(nums[1]);
    if (a && b && a !== b) return k(a) + " - " + k(b);
    if (a) return k(a);
  }
  return s;
}

// Text wrapped in *asterisks* is shown in green. Returns [{text, green}].
export function highlights(str) {
  const parts = [];
  String(str || "").split(/(\*[^*]+\*)/g).forEach((p) => {
    if (!p) return;
    if (p.startsWith("*") && p.endsWith("*") && p.length > 2) parts.push({ text: p.slice(1, -1), green: true });
    else parts.push({ text: p, green: false });
  });
  return parts;
}

export function fileName(base, ext) {
  const s = String(base || "design").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  return (s || "design") + "." + ext;
}

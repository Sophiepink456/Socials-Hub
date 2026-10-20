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

// ---- Salary: a type (annual, daily, hourly or competitive) and numbers ------------------
// Stored as `${key}Type`, `${key}From` / `${key}To` (annual) and `${key}Rate` (daily, hourly),
// digits only. Shown as:
//   annual       £45,000 - £55,000   (or £45,000 when there's no "to")
//   daily        £450 per day
//   hourly       £12.50ph
//   competitive  £Competitive
export const SALARY_TYPES = [["annual", "Annual"], ["daily", "Daily"], ["hourly", "Hourly"], ["competitive", "Competitive"]];
const digits = (v) => String(v == null ? "" : v).replace(/[^0-9]/g, "");
const commas = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
export const moneyDigits = (v, max = 6) => digits(v).replace(/^0+(?=\d)/, "").slice(0, max);
// Hourly rates: digits and one point, at most 2 decimal places.
export function rateText(v) {
  const s = String(v == null ? "" : v).replace(/[^0-9.]/g, "");
  const [a, ...rest] = s.split(".");
  const whole = a.replace(/^0+(?=\d)/, "").slice(0, 3);
  return rest.length ? `${whole || "0"}.${rest.join("").slice(0, 2)}` : whole;
}
const salaryParts = (v, key) => ({
  type: String((v && v[`${key}Type`]) || ""),
  from: moneyDigits(v && v[`${key}From`]),
  to: moneyDigits(v && v[`${key}To`]),
  rate: String((v && v[`${key}Rate`]) || "").trim(),
});

// What the salary says on the design.
export function formatSalary(v, key = "salary") {
  const s = salaryParts(v, key);
  if (!s.type) return salaryText(v && v[key], v && v[`${key.replace(/salary$/, "")}hideSalary`] === "1"); // made before salary types
  if (s.type === "competitive") return "£Competitive";
  if (s.type === "annual") {
    if (!s.from) return "£Competitive";
    return s.to && s.to !== s.from ? `£${commas(s.from)} - £${commas(s.to)}` : `£${commas(s.from)}`;
  }
  if (s.type === "daily") {
    const d = moneyDigits(s.rate, 4);
    return d ? `£${commas(d)} per day` : "£Competitive";
  }
  if (s.type === "hourly") {
    const n = parseFloat(rateText(s.rate));
    return n > 0 ? `£${n.toFixed(2)}ph` : "£Competitive";
  }
  return "£Competitive";
}

// What's wrong with the salary, if anything (shown in the form; downloads wait until it's fixed).
export function salaryError(v, key = "salary") {
  const s = salaryParts(v, key);
  if (!s.type) return "Choose annual, daily, hourly or competitive.";
  if (s.type === "annual") {
    if (!s.from) return "Add the annual salary.";
    const a = +s.from, b = s.to ? +s.to : 0;
    if (a < 10000) return "Annual salaries need to be £10,000 or more. For a day or hourly rate, choose Daily or Hourly.";
    if (s.to && b < 10000) return "The top of the range needs to be £10,000 or more.";
    if (s.to && b <= a) return "The second figure needs to be higher than the first.";
    return "";
  }
  if (s.type === "daily") {
    const d = +moneyDigits(s.rate, 4);
    if (!d) return "Add the day rate.";
    if (d < 50 || d > 5000) return "Day rates need to be between £50 and £5,000.";
    return "";
  }
  if (s.type === "hourly") {
    const n = parseFloat(rateText(s.rate));
    if (!(n > 0)) return "Add the hourly rate.";
    if (n < 5 || n > 500) return "Hourly rates need to be between £5.00 and £500.00.";
    return "";
  }
  return "";
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

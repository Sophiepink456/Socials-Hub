// Car wash bookings: the car wash comes every other Tuesday, counting from Tuesday 24 March 2026
// (the first date on the old spreadsheet). The marketing team can cancel a date or add a one-off
// date (e.g. Wednesday 15 July instead of Tuesday 14 July).
export const ANCHOR = "2026-03-24";
export const DEFAULT_CAPACITY = 6;
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const toDate = (iso) => new Date(iso + "T12:00:00Z");
export const isoOf = (d) => d.toISOString().slice(0, 10);

// Today's date in the UK.
export function ukToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date());
}

// The regular fortnightly Tuesdays from `fromIso` onwards, `count` of them.
export function fortnightlyTuesdays(fromIso, count) {
  const start = toDate(ANCHOR);
  const from = toDate(fromIso);
  const steps = Math.max(0, Math.ceil((from - start) / (14 * 864e5)));
  const out = [];
  for (let i = 0; i < count; i++) out.push(isoOf(new Date(start.getTime() + (steps + i) * 14 * 864e5)));
  return out;
}

// Upcoming car wash dates: regular Tuesdays plus added dates, minus cancelled ones.
// Covers roughly the next `weeks` weeks.
export function upcomingDates(settings, todayIso, weeks = 16) {
  const s = settings || {};
  const cancelled = new Set(s.cancelled || []);
  const end = isoOf(new Date(toDate(todayIso).getTime() + weeks * 7 * 864e5));
  const regular = fortnightlyTuesdays(todayIso, Math.ceil(weeks / 2) + 1).filter((d) => d <= end);
  const extra = (s.extra || []).filter((d) => d >= todayIso && d <= end);
  const all = [...new Set([...regular, ...extra])].sort();
  return all.map((date) => ({ date, cancelled: cancelled.has(date), extra: extra.includes(date) && !regular.includes(date) }));
}

// "Tuesday 1 December"
export function longDate(iso) {
  return toDate(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
}

export function cleanName(name) {
  return String(name || "").replace(/[^\p{L}\p{M}\p{N} .'’-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 40);
}

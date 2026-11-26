// Car wash bookings. The car wash comes every few weeks on the same weekday, starting from a set date.
// From 12 January 2027 it's every 4 weeks (before that it was every other Tuesday from 24 March 2026).
// The marketing team can change the start date and how many weeks apart it is, mark a date as not
// running, remove a date, or add a one-off date (e.g. a Wednesday instead of the Tuesday).
export const DEFAULT_START = "2027-01-12";
export const DEFAULT_EVERY_WEEKS = 4;
export const DEFAULT_CAPACITY = 6;
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const toDate = (iso) => new Date(iso + "T12:00:00Z");
export const isoOf = (d) => d.toISOString().slice(0, 10);

// Today's date in the UK.
export function ukToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date());
}

// The regular dates (every `everyWeeks` weeks from `startIso`) on or after `fromIso`, `count` of them.
export function regularDates(startIso, everyWeeks, fromIso, count) {
  const start = toDate(startIso);
  const step = everyWeeks * 7 * 864e5;
  const steps = Math.max(0, Math.ceil((toDate(fromIso) - start) / step));
  const out = [];
  for (let i = 0; i < count; i++) out.push(isoOf(new Date(start.getTime() + (steps + i) * step)));
  return out;
}

// "every 4 weeks" / "every other week" / "every week"
export function everyText(everyWeeks) {
  return everyWeeks === 1 ? "every week" : everyWeeks === 2 ? "every other week" : `every ${everyWeeks} weeks`;
}

// Upcoming car wash dates: regular Tuesdays plus added dates. Cancelled dates are kept but marked
// "not running"; removed dates are left out altogether.
// Shows the next 6 regular dates (and anything added in that time).
export function upcomingDates(settings, todayIso, shown = 6) {
  const s = settings || {};
  const start = s.start || DEFAULT_START;
  const every = s.everyWeeks || DEFAULT_EVERY_WEEKS;
  const cancelled = new Set(s.cancelled || []);
  const removed = new Set(s.removed || []);
  const regular = regularDates(start, every, todayIso, shown + (s.removed || []).length);
  const end = regular[regular.length - 1];
  const extra = (s.extra || []).filter((d) => d >= todayIso && d <= end);
  const all = [...new Set([...regular, ...extra])].filter((d) => !removed.has(d)).sort();
  return all.map((date) => ({ date, cancelled: cancelled.has(date), extra: extra.includes(date) && !regular.includes(date) }));
}

// "Tuesday 1 December"
export function longDate(iso) {
  return toDate(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
}

export function cleanName(name) {
  return String(name || "").replace(/[^\p{L}\p{M}\p{N} .'’-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 40);
}

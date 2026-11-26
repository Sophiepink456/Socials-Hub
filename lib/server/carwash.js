// Car wash bookings, kept in hub storage.
// Each booking is its own small file, carwash/bookings/<date>/<time>-<id>.json, so two people
// booking at once can't overwrite each other. Settings (places per date, cancelled and added
// dates) are a versioned JSON record under carwash/settings.
import { listFiles, putFile, readFile, removeFiles, saveJson, loadLatestJson, randomId } from "./store";
import { DEFAULT_CAPACITY, DATE_RE, cleanName } from "../carwash";
import crypto from "node:crypto";

const DIR = "carwash/bookings";
const SETTINGS = "carwash/settings";
const hash = (k) => crypto.createHash("sha256").update(String(k)).digest("hex");

export async function getCarwashSettings() {
  const s = (await loadLatestJson(SETTINGS).catch(() => null)) || {};
  const dates = (a) => (Array.isArray(a) ? a.filter((d) => DATE_RE.test(d)) : []);
  const cap = Number(s.capacity);
  return { capacity: cap >= 1 && cap <= 50 ? Math.round(cap) : DEFAULT_CAPACITY, cancelled: dates(s.cancelled), extra: dates(s.extra), removed: dates(s.removed) };
}

export async function saveCarwashSettings(s) {
  await saveJson(SETTINGS, s);
}

async function readJson(pathname) {
  const f = await readFile(pathname);
  return f ? JSON.parse(await new Response(f.stream).text()) : null;
}

// { "2026-12-01": [{ id, name, at }], … } for the given dates, oldest booking first.
export async function listBookings(dates) {
  const want = new Set(dates);
  const files = (await listFiles(DIR + "/")).filter((f) => f.pathname.endsWith(".json"));
  const byDate = Object.fromEntries(dates.map((d) => [d, []]));
  const picked = files
    .map((f) => ({ ...f, date: f.pathname.split("/")[2] }))
    .filter((f) => want.has(f.date))
    .sort((a, b) => a.pathname.localeCompare(b.pathname));
  const rows = await Promise.all(picked.map(async (f) => {
    const j = await readJson(f.pathname).catch(() => null);
    return j && { date: f.date, id: f.pathname.split("/").pop().replace(/\.json$/, ""), name: j.name, at: j.at };
  }));
  for (const r of rows) if (r) byDate[r.date].push({ id: r.id, name: r.name, at: r.at });
  return byDate;
}

export async function addBooking(date, rawName) {
  const name = cleanName(rawName);
  if (!name) throw new Error("Please type your name.");
  const current = (await listBookings([date]))[date] || [];
  if (current.some((b) => b.name.toLowerCase() === name.toLowerCase())) throw new Error(`${name} is already booked in on that date.`);
  const id = `${String(Date.now()).padStart(15, "0")}-${randomId(4)}`;
  const key = randomId(16);
  await putFile(`${DIR}/${date}/${id}.json`, JSON.stringify({ name, at: new Date().toISOString(), keyHash: hash(key) }), "application/json");
  return { id, key, name };
}

// Removes a booking if `key` matches the one given when it was made, or if `admin` is true.
export async function removeBooking(date, id, key, admin) {
  if (!/^\d{15}-[a-f0-9]{8}$/.test(id)) throw new Error("Unknown booking.");
  const path = `${DIR}/${date}/${id}.json`;
  const j = await readJson(path).catch(() => null);
  if (!j) return false;
  if (!admin && (!key || hash(key) !== j.keyHash)) throw new Error("You can only remove bookings you made on this computer.");
  await removeFiles([path]);
  return true;
}

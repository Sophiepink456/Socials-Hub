// Car wash bookings API. Anyone signed in to the hub can book and remove their own booking.
// The Marketing Team Access passcode (x-passcode) can remove any booking and change the dates.
import { hasStore } from "../../../lib/server/store";
import { checkPasscode } from "../../../lib/server/settings";
import { getCarwashSettings, saveCarwashSettings, listBookings, addBooking, removeBooking } from "../../../lib/server/carwash";
import { upcomingDates, ukToday, DATE_RE } from "../../../lib/carwash";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bad = (error, status = 400) => Response.json({ error }, { status });

async function state() {
  const settings = await getCarwashSettings();
  const today = ukToday();
  const dates = upcomingDates(settings, today);
  const bookings = await listBookings(dates.map((d) => d.date));
  return {
    today,
    capacity: settings.capacity,
    removed: settings.removed.filter((d) => d >= today).sort(),
    dates: dates.map((d) => ({ ...d, bookings: bookings[d.date] || [] })),
  };
}

export async function GET() {
  if (!hasStore()) return bad("File storage isn't set up.", 503);
  return Response.json(await state(), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req) {
  if (!hasStore()) return bad("File storage isn't set up.", 503);
  const body = await req.json().catch(() => ({}));

  // Marketing team: change places per date, cancel/restore a date, add/remove a one-off date.
  if (body.settings) {
    if (!checkPasscode(req)) return bad("Wrong Marketing Team Access passcode.", 401);
    const s = await getCarwashSettings();
    const { capacity, cancel, restore, addDate, removeDate, putBack } = body.settings;
    if (capacity !== undefined) {
      const n = Math.round(Number(capacity));
      if (!(n >= 1 && n <= 50)) return bad("Places per date must be between 1 and 50.");
      s.capacity = n;
    }
    const ok = (d) => typeof d === "string" && DATE_RE.test(d);
    if (ok(cancel) && !s.cancelled.includes(cancel)) s.cancelled.push(cancel);
    if (ok(restore)) s.cancelled = s.cancelled.filter((d) => d !== restore);
    if (ok(addDate)) {
      if (addDate < ukToday()) return bad("That date has already passed.");
      if (!s.extra.includes(addDate)) s.extra.push(addDate);
      s.cancelled = s.cancelled.filter((d) => d !== addDate);
      s.removed = s.removed.filter((d) => d !== addDate);
    }
    // Remove a date from the page: a one-off date is dropped; a regular Tuesday is hidden.
    if (ok(removeDate)) {
      if (s.extra.includes(removeDate)) s.extra = s.extra.filter((d) => d !== removeDate);
      else if (!s.removed.includes(removeDate)) s.removed.push(removeDate);
      s.cancelled = s.cancelled.filter((d) => d !== removeDate);
    }
    if (ok(putBack)) s.removed = s.removed.filter((d) => d !== putBack);
    await saveCarwashSettings(s);
    return Response.json(await state());
  }

  // Book a place.
  const { date, name } = body;
  const st = await state();
  const day = st.dates.find((d) => d.date === date);
  if (!day) return bad("That date isn't open for bookings.");
  if (day.cancelled) return bad("The car wash isn't coming that day.");
  try {
    const b = await addBooking(date, name);
    return Response.json({ ...b, ...(await state()) });
  } catch (e) {
    return bad(e.message);
  }
}

export async function DELETE(req) {
  if (!hasStore()) return bad("File storage isn't set up.", 503);
  const { date, id, key } = await req.json().catch(() => ({}));
  if (!DATE_RE.test(date || "")) return bad("Unknown booking.");
  const admin = checkPasscode(req);
  try {
    await removeBooking(date, id || "", key, admin);
  } catch (e) {
    return bad(e.message, 403);
  }
  return Response.json(await state());
}

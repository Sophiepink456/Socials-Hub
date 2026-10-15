// Weekly tidy-up of storage (vercel.json "crons"): removes old versions, out-of-date PDFs and
// pictures nothing uses any more. The same as "Tidy up now" on the Settings page.
import { tidyStorage } from "../../../../lib/server/housekeeping";
import { hasStore } from "../../../../lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req) {
  const secret = process.env.CRON_SECRET;
  const ok = secret ? req.headers.get("authorization") === `Bearer ${secret}` : /vercel-cron/i.test(req.headers.get("user-agent") || "");
  if (!ok) return Response.json({ error: "Not allowed" }, { status: 401 });
  if (!hasStore()) return Response.json({ ok: true, skipped: "no storage" });
  const r = await tidyStorage();
  console.log("storage tidy", r);
  return Response.json({ ok: true, ...r });
}

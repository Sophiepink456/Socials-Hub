import { scrapeSite } from "../../../../lib/server/scrape";
import { hasStore } from "../../../../lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req) {
  if (!hasStore()) return Response.json({ error: "Storage isn't switched on yet." }, { status: 503 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Bad request" }, { status: 400 }); }
  try {
    const r = await scrapeSite(body.url, body.company);
    return Response.json(r);
  } catch (e) {
    console.error("scrape failed", e);
    return Response.json({ error: e.message || "Couldn't read that website." }, { status: 422 });
  }
}

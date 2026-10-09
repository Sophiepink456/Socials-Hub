// Branded ads from the Drive folder: GET lists them, POST {id, updated} copies one in.
import { listAds, importAd } from "../../../../lib/server/ads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  try {
    return Response.json(await listAds(), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("ads list failed", e);
    return Response.json({ error: e.message || "Couldn't load the branded ads." }, { status: 502 });
  }
}

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Bad request" }, { status: 400 }); }
  try {
    return Response.json({ url: await importAd(body.id, body.updated) });
  } catch (e) {
    console.error("ad import failed", e);
    return Response.json({ error: e.message || "Couldn't fetch that ad." }, { status: 502 });
  }
}

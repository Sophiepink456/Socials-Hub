// Candidate packs: the client's homepage picture (for the laptop) and their brand colours.
import { captureHomepage, pickColours } from "../../../../lib/server/siteshot";
import { hasStore } from "../../../../lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req) {
  if (!hasStore()) return Response.json({ error: "Storage isn't switched on yet." }, { status: 503 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Bad request" }, { status: 400 }); }
  let shot = null, colours = null, shotError = "";
  if (body.url) {
    shot = await captureHomepage(body.url).catch((e) => { console.error("homepage capture failed", e.message); shotError = "Couldn't take a picture of the homepage."; return null; });
  }
  colours = await pickColours({ logo: body.logo, shotBuf: shot && shot.buf }).catch(() => null);
  return Response.json({ siteShot: shot ? shot.url : "", colours, shotError });
}

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
  // Open the homepage once: the picture for the laptop, and the colours that stand out on it.
  // "Pick from the website again" only wants the colours, so it keeps the picture it has.
  if (body.url) {
    shot = await captureHomepage(body.url, { save: !body.coloursOnly }).catch((e) => { console.error("homepage capture failed", e.message); shotError = "Couldn't open the homepage."; return null; });
  }
  colours = await pickColours({ logo: body.logo, url: body.url, shotBuf: shot && shot.buf, swatches: shot && shot.swatches, siteLogo: shot && shot.logoBuf })
    .catch((e) => { console.error("colours failed", e.message); return null; });
  return Response.json({ siteShot: shot && !body.coloursOnly ? shot.url : "", colours, shotError: body.coloursOnly ? "" : shotError });
}

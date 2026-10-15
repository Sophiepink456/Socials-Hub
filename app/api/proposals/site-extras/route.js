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
  // "Pick from the website again" only wants colours: try the logo and the site's own colours first,
  // and only open the site in a browser if those don't give one.
  if (body.coloursOnly) colours = await pickColours({ logo: body.logo, url: body.url }).catch(() => null);
  if (body.url && (!body.coloursOnly || !colours)) {
    shot = await captureHomepage(body.url).catch((e) => { console.error("homepage capture failed", e.message); shotError = "Couldn't take a picture of the homepage."; return null; });
  }
  if (!colours) colours = await pickColours({ logo: body.logo, url: body.url, shotBuf: shot && shot.buf }).catch((e) => { console.error("colours failed", e.message); return null; });
  if (body.coloursOnly) shot = null; // keep the homepage picture the consultant already has
  return Response.json({ siteShot: shot ? shot.url : "", colours, shotError });
}

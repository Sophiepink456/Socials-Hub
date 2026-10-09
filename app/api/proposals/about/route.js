// Drafts the About section from the client's website.
import { draftAbout } from "../../../../lib/server/about";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Bad request" }, { status: 400 }); }
  try {
    return Response.json(await draftAbout(body.url, body.company));
  } catch (e) {
    console.error("about draft failed", e);
    return Response.json({ error: e.message || "Couldn't write the About section." }, { status: 422 });
  }
}

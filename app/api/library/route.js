import { siteOrigin } from "../../../lib/server/origin";
// Saved Docs: GET ?t=<private link token> = that person's signed-off docs;
// POST { email } = email them their private link.
import { myDocs, emailFromToken, emailLink } from "../../../lib/server/library";
import { hasStore } from "../../../lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const nc = { headers: { "Cache-Control": "no-store" } };

export async function GET(req) {
  const email = await emailFromToken(new URL(req.url).searchParams.get("t")).catch(() => null);
  if (!email) return Response.json({ error: "This link isn’t valid. Ask for a new one below." }, { status: 401 });
  if (!hasStore()) return Response.json({ email, proposals: [], packs: [] }, nc);
  try {
    return Response.json(await myDocs(email), nc);
  } catch (e) {
    console.error("saved docs failed", e);
    return Response.json({ error: "Couldn't open your Saved Docs. Try again in a moment." }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { email } = await req.json();
    await emailLink(email, siteOrigin(req));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message || "Couldn't send the link." }, { status: 400 });
  }
}

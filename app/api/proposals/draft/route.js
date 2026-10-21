import { siteOrigin } from "../../../../lib/server/origin";
// Save a consultant's draft (POST) or open it again from its link (GET ?id=&k=).
import { saveDraft, loadDraft } from "../../../../lib/server/drafts";
import { hasStore } from "../../../../lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const u = new URL(req.url);
  const d = await loadDraft(u.searchParams.get("id"), u.searchParams.get("k")).catch(() => null);
  if (!d) return Response.json({ error: "That draft link isn't valid any more." }, { status: 404 });
  return Response.json({ id: d.id, k: d.key, data: d.data, savedBy: d.savedBy, submitted: !!d.submitted, updatedAt: d.updatedAt, copy: !!d.copy, name: d.name || "" }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req) {
  if (!hasStore()) return Response.json({ error: "Storage isn't switched on yet." }, { status: 503 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Bad request" }, { status: 400 }); }
  try {
    return Response.json(await saveDraft(body, siteOrigin(req)));
  } catch (e) {
    console.error("draft save failed", e);
    return Response.json({ error: "Couldn't save the draft. Try again in a moment." }, { status: 500 });
  }
}

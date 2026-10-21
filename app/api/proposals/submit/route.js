import { siteOrigin } from "../../../../lib/server/origin";
import { createRecord } from "../../../../lib/server/proposals";
import { hasStore } from "../../../../lib/server/store";
import { markDraftSubmitted } from "../../../../lib/server/drafts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req) {
  if (!hasStore()) return Response.json({ error: "Storage isn't switched on yet." }, { status: 503 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Bad request" }, { status: 400 }); }
  try {
    const rec = await createRecord(body.proposal, body.submitter || {}, siteOrigin(req));
    if (body.draft && body.draft.id) await markDraftSubmitted(body.draft.id, body.draft.k).catch(() => {});
    return Response.json({ ok: true, id: rec.id });
  } catch (e) {
    console.error("submit failed", e);
    return Response.json({ error: `Sorry, it didn't send (${String((e && e.message) || e).slice(0, 200)}). Try again in a moment.` }, { status: 500 });
  }
}

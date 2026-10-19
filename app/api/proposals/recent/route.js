// "Start from…": a new proposal or candidate pack can start from one already made — a submitted
// proposal or pack, or a saved copy from the Settings page. Lists them (names only) and hands over
// the data turned into the kind being made (?id=&src=rec|copy&for=proposal|candidate).
import { listRecords, loadRecord } from "../../../../lib/server/proposals";
import { listCopies, loadCopy } from "../../../../lib/server/drafts";
import { convertDoc } from "../../../../lib/convert";
import { hasStore } from "../../../../lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const kindOf = (d) => (d && d.kind === "candidate" ? "candidate" : "proposal");

export async function GET(req) {
  if (!hasStore()) return Response.json({ items: [] });
  const u = new URL(req.url);
  const id = u.searchParams.get("id");
  const target = u.searchParams.get("for") === "proposal" ? "proposal" : "candidate";
  if (id) {
    const src = u.searchParams.get("src") === "copy" ? "copy" : "rec";
    const rec = src === "copy" ? await loadCopy(id) : await loadRecord(id).catch(() => null);
    if (!rec || rec.removed || !rec.data || rec.data.kind === "letterhead") return Response.json({ error: "Couldn’t find that one any more." }, { status: 404 });
    return Response.json({ data: convertDoc(rec.data, target), from: kindOf(rec.data) }, { headers: { "Cache-Control": "no-store" } });
  }
  const [recs, copies] = await Promise.all([listRecords(120).catch(() => []), listCopies().catch(() => [])]);
  const items = [
    ...copies.map((c) => ({ id: c.id, src: "copy", kind: kindOf(c.data), name: c.name, client: c.data.clientName || "", role: c.data.roleTitle || "", consultant: "", date: c.updatedAt })),
    ...recs.filter((r) => r.data && r.data.kind !== "letterhead").map((r) => ({
      id: r.id, src: "rec", kind: kindOf(r.data), client: r.data.clientName || "Client", role: r.data.roleTitle || "Role",
      consultant: (r.submittedBy && r.submittedBy.name) || r.data.consultant1 || "", date: r.createdAt,
    })),
  ];
  return Response.json({ items }, { headers: { "Cache-Control": "no-store" } });
}

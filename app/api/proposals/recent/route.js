// Candidate packs can start from a proposal already made for the same client.
// Lists recent proposals (client, role, consultant only) and hands over just the parts a pack uses.
import { listRecords, loadRecord } from "../../../../lib/server/proposals";
import { packFromProposal } from "../../../../lib/candidate/data";
import { hasStore } from "../../../../lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  if (!hasStore()) return Response.json({ items: [] });
  const id = new URL(req.url).searchParams.get("id");
  if (id) {
    const rec = await loadRecord(id).catch(() => null);
    if (!rec || rec.removed || (rec.data && rec.data.kind === "candidate")) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ data: packFromProposal(rec.data) }, { headers: { "Cache-Control": "no-store" } });
  }
  const recs = await listRecords(60).catch(() => []);
  const items = recs.filter((r) => !(r.data && r.data.kind === "candidate")).slice(0, 40).map((r) => ({
    id: r.id, client: r.data.clientName || "Client", role: r.data.roleTitle || "Role",
    consultant: (r.submittedBy && r.submittedBy.name) || r.data.consultant1 || "", date: r.createdAt,
  }));
  return Response.json({ items }, { headers: { "Cache-Control": "no-store" } });
}

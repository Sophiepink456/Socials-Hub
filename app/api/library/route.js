// Saved designs: GET = everyone's folders (or one with ?person=), POST = save a downloaded
// social design to someone's folder, DELETE ?person=&id= = take one out.
import { listPeople, personFolder, saveSocial, removeSocial } from "../../../lib/server/library";
import { hasStore } from "../../../lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const nc = { headers: { "Cache-Control": "no-store" } };

export async function GET(req) {
  if (!hasStore()) return Response.json({ people: [] }, nc);
  const person = new URL(req.url).searchParams.get("person");
  try {
    if (person) return Response.json(await personFolder(person), nc);
    return Response.json({ people: await listPeople() }, nc);
  } catch (e) {
    console.error("library failed", e);
    return Response.json({ error: "Couldn't open the saved designs. Try again in a moment." }, { status: 500 });
  }
}

export async function POST(req) {
  if (!hasStore()) return Response.json({ error: "Storage isn't switched on yet." }, { status: 503 });
  try {
    const rec = await saveSocial(await req.json());
    return Response.json({ ok: true, id: rec.id });
  } catch (e) {
    return Response.json({ error: e.message || "Couldn't save it." }, { status: 400 });
  }
}

export async function DELETE(req) {
  const u = new URL(req.url);
  const ok = await removeSocial(u.searchParams.get("person"), u.searchParams.get("id")).catch(() => false);
  return ok ? Response.json({ ok: true }) : Response.json({ error: "Couldn't find that one." }, { status: 404 });
}

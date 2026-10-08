// Read or act on a saved proposal. ?k= is the proof-reader's key, ?c= the final checker's.
import { loadRecord, publicView, editorAction, checkerAction } from "../../../../lib/server/proposals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function roleFor(rec, k, c) {
  if (k && k === rec.editKey) return "editor";
  if (c && c === rec.checkKey) return "checker";
  return null;
}

export async function GET(req, { params }) {
  const u = new URL(req.url);
  const rec = await loadRecord(params.id).catch(() => null);
  if (!rec) return Response.json({ error: "Not found" }, { status: 404 });
  const role = roleFor(rec, u.searchParams.get("k"), u.searchParams.get("c"));
  if (!role) return Response.json({ error: "This link isn't valid." }, { status: 403 });
  return Response.json(publicView(rec, role), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req, { params }) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Bad request" }, { status: 400 }); }
  const rec = await loadRecord(params.id).catch(() => null);
  if (!rec) return Response.json({ error: "Not found" }, { status: 404 });
  const role = roleFor(rec, body.k, body.c);
  const origin = new URL(req.url).origin;
  try {
    if (role === "editor") {
      const { rec: out } = await editorAction(rec, body.action, body.data, origin, { to: body.to, note: body.note });
      return Response.json(publicView(out, role));
    }
    if (role === "checker" && body.action === "comment") {
      const out = await checkerAction(rec, body, origin);
      return Response.json(publicView(out, role));
    }
    return Response.json({ error: "This link isn't valid." }, { status: 403 });
  } catch (e) {
    console.error("proposal action failed", e);
    return Response.json({ error: e.message || "Something went wrong." }, { status: 500 });
  }
}

import { proofread } from "../../../../lib/server/proofread";
import { hasClaude } from "../../../../lib/server/claude";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req) {
  if (!hasClaude()) return Response.json({ error: "The spelling check isn't set up yet." }, { status: 503 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Bad request" }, { status: 400 }); }
  try {
    return Response.json({ issues: await proofread(body.fields || {}) });
  } catch (e) {
    console.error("proofread failed", e);
    return Response.json({ error: "The check didn't work this time. Try again." }, { status: 500 });
  }
}

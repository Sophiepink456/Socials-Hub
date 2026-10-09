// Settings: a tiny real request to Claude, to check the key and workspace work.
import { askClaude, hasClaude } from "../../../../lib/server/claude";
import { checkPasscode } from "../../../../lib/server/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  if (!checkPasscode(req)) return Response.json({ error: "Wrong passcode." }, { status: 401 });
  if (!hasClaude()) return Response.json({ error: "ANTHROPIC_API_KEY isn't set in Vercel." }, { status: 400 });
  try {
    const t = await askClaude({ system: "Reply with the single word OK.", content: "Test", maxTokens: 5 });
    return Response.json({ ok: true, reply: t.trim() });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 502 });
  }
}

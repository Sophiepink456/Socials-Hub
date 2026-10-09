// Settings page: every branded ad (including hidden ones) and the names typed in for them.
import { listAds, saveOverrides } from "../../../../lib/server/ads";
import { checkPasscode } from "../../../../lib/server/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const deny = () => Response.json({ error: "Wrong passcode." }, { status: 401 });

export async function GET(req) {
  if (!checkPasscode(req)) return deny();
  try {
    return Response.json(await listAds({ includeHidden: true, budgetMs: 20000 }), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return Response.json({ error: e.message || "Couldn't load the branded ads." }, { status: 502 });
  }
}

export async function POST(req) {
  if (!checkPasscode(req)) return deny();
  try {
    const body = await req.json();
    await saveOverrides(body.overrides || {});
    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Couldn't save the names." }, { status: 500 });
  }
}

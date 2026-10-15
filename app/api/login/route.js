// Sign in to the hub with the site password.
import { checkSitePassword, makeGateToken, GATE_COOKIE, GATE_DAYS } from "../../../lib/gate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  let body = {};
  try { body = await req.json(); } catch {}
  if (!(await checkSitePassword(body.password))) {
    // Slow down guessing.
    await new Promise((r) => setTimeout(r, 900));
    return Response.json({ error: "That password isn’t right." }, { status: 401 });
  }
  const res = Response.json({ ok: true });
  res.headers.append("Set-Cookie", `${GATE_COOKIE}=${await makeGateToken()}; Path=/; Max-Age=${GATE_DAYS * 86400}; HttpOnly; SameSite=Lax${new URL(req.url).protocol === "https:" ? "; Secure" : ""}`);
  return res;
}

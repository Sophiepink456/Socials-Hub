// Unlock the SLT folder with its own password (on top of the hub password).
import { checkSltPassword, makeSltToken, SLT_COOKIE, SLT_HOURS } from "../../../../lib/gate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  let body = {};
  try { body = await req.json(); } catch {}
  if (!(await checkSltPassword(body.password))) {
    await new Promise((r) => setTimeout(r, 900));
    return Response.json({ error: "That password isn’t right." }, { status: 401 });
  }
  const res = Response.json({ ok: true });
  res.headers.append("Set-Cookie", `${SLT_COOKIE}=${await makeSltToken()}; Path=/; Max-Age=${SLT_HOURS * 3600}; HttpOnly; SameSite=Lax${new URL(req.url).protocol === "https:" ? "; Secure" : ""}`);
  return res;
}

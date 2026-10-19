// Lock the SLT folder again on this browser.
import { SLT_COOKIE } from "../../../../lib/gate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const res = new Response(null, { status: 303, headers: { Location: new URL("/", req.url).toString() } });
  res.headers.append("Set-Cookie", `${SLT_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`);
  return res;
}

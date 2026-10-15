// Sign this browser out of the hub.
import { GATE_COOKIE } from "../../../lib/gate";

export const runtime = "nodejs";

export async function GET(req) {
  return new Response(null, { status: 303, headers: { Location: new URL("/login", req.url).toString(), "Set-Cookie": `${GATE_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax` } });
}

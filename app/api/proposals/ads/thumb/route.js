// Preview image of one branded ad: redirects to a small stored copy.
import { adThumb } from "../../../../../lib/server/ads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req) {
  const u = new URL(req.url);
  try {
    const url = await adThumb(u.searchParams.get("id"), u.searchParams.get("u"));
    return Response.redirect(new URL(url, u.origin), 302);
  } catch (e) {
    console.error("ad thumb failed", e);
    return new Response("Not found", { status: 404 });
  }
}

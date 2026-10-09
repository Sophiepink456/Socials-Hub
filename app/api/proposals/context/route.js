// Public bits of the settings the proposal pages need (the "View Media" links).
import { getSettings } from "../../../../lib/server/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSettings();
  return Response.json({ mediaLinks: s.mediaLinks || [] }, { headers: { "Cache-Control": "no-store" } });
}

import { getSettings, saveSettings, checkPasscode } from "../../../lib/server/settings";
import { listRecords, STATUS } from "../../../lib/server/proposals";
import { hasStore } from "../../../lib/server/store";
import { hasClaude } from "../../../lib/server/claude";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const deny = () => Response.json({ error: "Wrong passcode." }, { status: 401 });

export async function GET(req) {
  if (!process.env.SETTINGS_PASSCODE) return Response.json({ error: "The settings passcode isn't set up in Vercel yet." }, { status: 503 });
  if (!checkPasscode(req)) return deny();
  const settings = await getSettings();
  let proposals = [];
  try {
    proposals = (await listRecords(60)).map((r) => ({
      id: r.id,
      client: r.data.clientName,
      role: r.data.roleTitle,
      consultant: r.submittedBy && r.submittedBy.name,
      status: STATUS[r.status] || r.status,
      updatedAt: r.updatedAt || r.createdAt,
      link: `/proposals/review/${r.id}?k=${r.editKey}`,
    }));
  } catch (e) { console.error(e); }
  return Response.json({
    settings,
    proposals,
    checks: { storage: hasStore(), claude: hasClaude(), email: !!process.env.ZAPIER_HOOK_URL, ads: !!(settings.adsScriptUrl || process.env.ADS_SCRIPT_URL) },
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req) {
  if (!checkPasscode(req)) return deny();
  try {
    const body = await req.json();
    return Response.json({ settings: await saveSettings(body.settings || {}) });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Couldn't save the settings." }, { status: 500 });
  }
}

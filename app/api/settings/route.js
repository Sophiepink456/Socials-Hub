import { getSettings, saveSettings, checkPasscode } from "../../../lib/server/settings";
import { listRecords, STATUS, removeRecord } from "../../../lib/server/proposals";
import { hasStore } from "../../../lib/server/store";
import { hasClaude } from "../../../lib/server/claude";
import { listDrafts, removeDraft, listCopies, createCopy, renameCopy, loadCopy } from "../../../lib/server/drafts";
import { loadRecord } from "../../../lib/server/proposals";
import { loadLatestJson } from "../../../lib/server/store";
import { storageReport, tidyStorage } from "../../../lib/server/housekeeping";
import { docTitle, docType, isLetter } from "../../../lib/docs";
import { mondayStatus, saveToken } from "../../../lib/server/monday";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const typeOf = (d) => docType(d);
const openLink = (d) => `${d.data.kind === "candidate" ? "/proposals/candidate-pack" : "/proposals"}?draft=${d.id}&k=${d.key}`;

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
      type: docType(r.data),
      label: docTitle(r.data),
      letter: isLetter(r.data),
      consultant: r.submittedBy && r.submittedBy.name,
      status: STATUS[r.status] || r.status,
      updatedAt: r.updatedAt || r.createdAt,
      link: `/proposals/review/${r.id}?k=${r.editKey}`,
    }));
  } catch (e) { console.error(e); }
  let drafts = [];
  try {
    drafts = (await listDrafts(60)).map((d) => ({
      id: d.id, client: d.data.clientName, role: d.data.roleTitle, consultant: d.savedBy && (d.savedBy.name || d.savedBy.email),
      type: d.data.kind === "candidate" ? "Candidate pack" : "Proposal",
      updatedAt: d.updatedAt, link: `${d.data.kind === "candidate" ? "/proposals/candidate-pack" : "/proposals"}?draft=${d.id}&k=${d.key}`,
    }));
  } catch (e) { console.error(e); }
  let copies = [];
  try {
    copies = (await listCopies()).map((d) => ({ id: d.id, name: d.name, client: d.data.clientName, role: d.data.roleTitle, type: typeOf(d.data), updatedAt: d.updatedAt, link: openLink(d) }));
  } catch (e) { console.error(e); }
  return Response.json({
    settings,
    proposals,
    drafts,
    copies,
    checks: { storage: hasStore(), claude: hasClaude(), email: !!process.env.ZAPIER_HOOK_URL, ads: !!(settings.adsScriptUrl || process.env.ADS_SCRIPT_URL), monday: await mondayStatus().catch(() => ({ connected: false })) },
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req) {
  if (!checkPasscode(req)) return deny();
  try {
    const body = await req.json();
    // Duplicate a proposal, candidate pack, draft or saved copy as a new named saved copy.
    if (body.duplicate) {
      const { type, id, name } = body.duplicate;
      let src = null;
      if (type === "proposal") src = await loadRecord(id);
      else if (type === "copy") src = await loadCopy(id);
      else if (type === "draft") src = await loadLatestJson(`drafts/${id}/data`).catch(() => null);
      if (!src || src.removed || !src.data) return Response.json({ error: "Couldn't find that one." }, { status: 404 });
      const d = await createCopy(src.data, name);
      return Response.json({ copy: { id: d.id, name: d.name, client: d.data.clientName, role: d.data.roleTitle, type: typeOf(d.data), updatedAt: d.updatedAt, link: openLink(d) } });
    }
    if (body.rename) {
      const d = await renameCopy(body.rename.id, body.rename.name);
      return d ? Response.json({ ok: true, name: d.name }) : Response.json({ error: "Couldn't find that one." }, { status: 404 });
    }
    // Connect the Marketing Request Form to monday.com (the token is checked, then kept privately).
    if (body.mondayToken) {
      try { const who = await saveToken(body.mondayToken); return Response.json({ monday: { connected: true, by: who.name, board: who.board } }); }
      catch (e) { return Response.json({ error: e.message }, { status: 400 }); }
    }
    if (body.storage) return Response.json({ storage: await storageReport() });
    if (body.tidy) return Response.json({ tidy: await tidyStorage({ dryRun: !!body.tidy.dryRun }) });
    if (body.remove) {
      const ok = body.remove.type === "draft" || body.remove.type === "copy" ? await removeDraft(body.remove.id) : await removeRecord(body.remove.id);
      return ok ? Response.json({ ok: true }) : Response.json({ error: "Couldn't find that one." }, { status: 404 });
    }
    return Response.json({ settings: await saveSettings(body.settings || {}) });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Couldn't save the settings." }, { status: 500 });
  }
}

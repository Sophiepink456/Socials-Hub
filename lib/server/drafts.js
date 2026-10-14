// Consultants' saved drafts. Each draft has a private link (id + key) so the consultant can
// come back to it from any computer. The first save emails them that link.
import { saveJson, loadLatestJson, listFolders, randomId } from "./store";
import { normalise } from "../proposal/data";
import { sendEmail, emailHtml, esc } from "./mail";

const ID = /^[a-f0-9]{32}$/;
const label = (d) => `${d.clientName || "Client"} – ${d.roleTitle || "Role"}`;

export async function loadDraft(id, key) {
  if (!ID.test(String(id || "")) || !key) return null;
  const d = await loadLatestJson(`drafts/${id}/data`);
  return d && d.key === key ? d : null;
}

export async function saveDraft({ id, key, proposal, name, email }, origin) {
  let rec = id ? await loadDraft(id, key) : null;
  const first = !rec;
  if (!rec) {
    rec = { id: randomId(16), key: randomId(16), createdAt: new Date().toISOString(), savedBy: { name: "", email: "" } };
  }
  if (name) rec.savedBy.name = String(name).trim();
  if (email) rec.savedBy.email = String(email).trim();
  rec.data = normalise(proposal);
  rec.updatedAt = new Date().toISOString();
  rec.submitted = false;
  await saveJson(`drafts/${rec.id}/data`, rec);
  const link = `${origin}/proposals?draft=${rec.id}&k=${rec.key}`;
  let emailed = false;
  if (first && rec.savedBy.email) {
    try {
      await sendEmail({
        to: rec.savedBy.email,
        subject: `Draft saved: ${label(rec.data)}`,
        html: emailHtml("Your proposal draft is saved", [
          `Hi ${esc((rec.savedBy.name || "").split(" ")[0] || "there")},`,
          `Your draft proposal for <b>${esc(label(rec.data))}</b> is saved. Use the button below to carry on with it from any computer. Each time you press Save draft, this same link is updated.`,
        ], { href: link, label: "Carry on with the draft" }),
      });
      emailed = true;
    } catch (e) { console.error("draft email failed", e); }
  }
  return { id: rec.id, k: rec.key, link, emailed };
}

export async function markDraftSubmitted(id, key) {
  const rec = await loadDraft(id, key);
  if (!rec) return;
  rec.submitted = true;
  rec.updatedAt = new Date().toISOString();
  await saveJson(`drafts/${rec.id}/data`, rec);
}

// For the Settings page: every draft that hasn't been sent for proof-reading yet.
export async function listDrafts(limit = 60) {
  const ids = (await listFolders("drafts")).slice(-limit);
  const out = [];
  await Promise.all(ids.map(async (id) => {
    const d = await loadLatestJson(`drafts/${id}/data`).catch(() => null);
    if (d && !d.submitted) out.push(d);
  }));
  return out.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

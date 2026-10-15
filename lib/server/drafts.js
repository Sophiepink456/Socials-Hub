// Consultants' saved drafts. Each draft has a private link (id + key) so the consultant can
// come back to it from any computer. The first save emails them that link.
import { saveJson, loadLatestJson, listFolders, randomId } from "./store";
import { normaliseDoc as normalise, docWord, draftPath } from "../docs";
import { sendEmail, emailHtml, esc } from "./mail";

const ID = /^[a-f0-9]{32}$/;
const label = (d) => `${d.clientName || "Client"} – ${d.roleTitle || "Role"}`;

export async function loadDraft(id, key) {
  if (!ID.test(String(id || "")) || !key) return null;
  const d = await loadLatestJson(`drafts/${id}/data`);
  return d && d.key === key && !d.removed ? d : null;
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
  const link = `${origin}${draftPath(rec.data)}?draft=${rec.id}&k=${rec.key}`;
  let emailed = false;
  if (first && rec.savedBy.email) {
    try {
      await sendEmail({
        to: rec.savedBy.email,
        subject: `Draft saved: ${label(rec.data)}`,
        html: emailHtml(`Your ${docWord(rec.data)} draft is saved`, [
          `Hi ${esc((rec.savedBy.name || "").split(" ")[0] || "there")},`,
          `Your draft ${docWord(rec.data)} for <b>${esc(label(rec.data))}</b> is saved. Use the button below to carry on with it from any computer. Each time you press Save draft, this same link is updated.`,
        ], { href: link, label: "Carry on with the draft" }),
      });
      emailed = true;
    } catch (e) { console.error("draft email failed", e); }
  }
  return { id: rec.id, k: rec.key, link, emailed };
}

export async function markDraftSubmitted(id, key) {
  const rec = await loadDraft(id, key);
  // A saved copy (made on the Settings page) stays as it is, ready to be used again.
  if (!rec || rec.copy) return;
  rec.submitted = true;
  rec.updatedAt = new Date().toISOString();
  await saveJson(`drafts/${rec.id}/data`, rec);
}

async function allDrafts() {
  const ids = (await listFolders("drafts")).filter((id) => ID.test(id));
  const out = [];
  await Promise.all(ids.map(async (id) => {
    const d = await loadLatestJson(`drafts/${id}/data`).catch(() => null);
    if (d && !d.removed) out.push(d);
  }));
  return out.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

// For the Settings page: every consultant draft that hasn't been sent for proof-reading yet.
export async function listDrafts(limit = 100) {
  return (await allDrafts()).filter((d) => !d.submitted && !d.copy).slice(0, limit);
}

// Saved copies: named proposals / candidate packs made on the Settings page with "Duplicate",
// ready to open and edit, or to start a new one from.
export async function listCopies() {
  return (await allDrafts()).filter((d) => d.copy);
}

export async function createCopy(data, name) {
  const rec = {
    id: randomId(16), key: randomId(16), copy: true, name: String(name || "").trim().slice(0, 120) || "Saved copy",
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), savedBy: { name: "Marketing", email: "" },
    data: normalise(data), submitted: false,
  };
  await saveJson(`drafts/${rec.id}/data`, rec);
  return rec;
}

export async function loadCopy(id) {
  if (!ID.test(String(id || ""))) return null;
  const d = await loadLatestJson(`drafts/${id}/data`).catch(() => null);
  return d && d.copy && !d.removed ? d : null;
}

export async function renameCopy(id, name) {
  const d = await loadCopy(id);
  if (!d) return null;
  d.name = String(name || "").trim().slice(0, 120) || d.name;
  d.updatedAt = new Date().toISOString();
  await saveJson(`drafts/${id}/data`, d);
  return d;
}

export async function removeDraft(id) {
  if (!ID.test(String(id || ""))) return false;
  const d = await loadLatestJson(`drafts/${id}/data`);
  if (!d) return false;
  d.removed = true;
  d.updatedAt = new Date().toISOString();
  await saveJson(`drafts/${id}/data`, d);
  return true;
}

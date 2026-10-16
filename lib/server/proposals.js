// Saved proposals and their sign-off route:
// consultant submits → proof-reader edits/approves → final checker comments →
// proof-reader updates → proof-reader sends to the consultant.
import { saveJson, loadLatestJson, listFolders, putFile, randomId, pruneFolder } from "./store";
import { renderPdf, pdfName } from "../proposal/pdf";
import { normaliseDoc as normalise, docWord, DocWord } from "../docs";
import { getSettings, pageContext } from "./settings";
import { sendEmail, emailHtml, esc } from "./mail";
import { savedDocsLink } from "./library";

export const STATUS = {
  proof: "With proof-reader",
  check: "With final checker",
  changes: "Comments back from final checker",
  approved: "Approved by final checker",
  sent: "Sent to consultant",
};

const ID = /^[a-f0-9]{32}$/;
export const KEEP_PDFS = 3;
export const validId = (id) => ID.test(String(id || ""));

export async function loadRecord(id) {
  if (!validId(id)) return null;
  return loadLatestJson(`proposals/${id}/data`);
}

export async function saveRecord(rec) {
  rec.updatedAt = new Date().toISOString();
  await saveJson(`proposals/${rec.id}/data`, rec);
  return rec;
}

export async function makePdf(rec, origin) {
  const s = await getSettings();
  const pdf = await renderPdf(rec.data, origin, pageContext(s));
  const path = `proposals/${rec.id}/pdf/${Date.now()}-${randomId(4)}.pdf`;
  rec.pdf = await putFile(path, pdf, "application/pdf");
  // Older PDFs of this one are out of date. Keep the last few (emails may still be collecting
  // them as attachments) and delete the rest.
  await pruneFolder(`proposals/${rec.id}/pdf`, KEEP_PDFS, ".pdf").catch((e) => console.error("pdf prune failed", e.message));
  rec.pdfName = pdfName(rec.data);
  return rec;
}

const label = (d) => `${d.clientName || "Client"} – ${d.roleTitle || "Role"}`;
const log = (rec, by, action, note = "") => { (rec.history = rec.history || []).push({ at: new Date().toISOString(), by, action, note }); };

export async function createRecord(data, submitter, origin) {
  const rec = {
    id: randomId(16),
    editKey: randomId(16),
    checkKey: randomId(16),
    status: "proof",
    createdAt: new Date().toISOString(),
    submittedBy: { name: String(submitter.name || "").trim(), email: String(submitter.email || "").trim() },
    data: normalise(data),
    comments: [],
    history: [],
  };
  log(rec, rec.submittedBy.name || "Consultant", "Submitted for proof-reading");
  await makePdf(rec, origin);
  await saveRecord(rec);
  const s = await getSettings();
  await sendEmail({
    to: s.proofreaders,
    subject: `${DocWord(rec.data)} to proof-read: ${label(rec.data)}`,
    html: emailHtml(`New ${docWord(rec.data)} to proof-read`, [
      `<b>${esc(rec.submittedBy.name || "A consultant")}</b> has submitted the ${docWord(rec.data)} for <b>${esc(label(rec.data))}</b>.`,
      "Open it to read through, make any changes, then send it on for final checking.",
    ], { href: `${origin}/proposals/review/${rec.id}?k=${rec.editKey}`, label: `Open the ${docWord(rec.data)}` }),
    attachmentUrl: origin + rec.pdf,
    attachmentName: rec.pdfName,
  });
  return rec;
}

// The finished PDF to the consultant (proof-readers copied in). Used by the proof-reader's
// "Send to consultant" and automatically when the final checker approves.
const consultantEmail = (rec, to) => String(to || rec.submittedBy.email || (rec.data.c1 && rec.data.c1.email) || "").trim();
async function sendToConsultant(rec, origin, { to, note, by }) {
  const s = await getSettings();
  const dest = consultantEmail(rec, to);
  if (!dest) throw new Error("There's no consultant email to send to.");
  rec.status = "sent";
  log(rec, by, "Sent to consultant", dest);
  await sendEmail({
    to: dest,
    cc: s.proofreaders,
    subject: `Your ${docWord(rec.data)} is ready: ${label(rec.data)}`,
    html: emailHtml(`Your ${docWord(rec.data)} is ready`, [
      `Hi ${esc((rec.submittedBy.name || "").split(" ")[0] || "there")},`,
      `Your ${docWord(rec.data)} for <b>${esc(label(rec.data))}</b> has been checked and approved. The finished PDF is attached and ready to send ${rec.data.kind === "candidate" ? "to candidates" : "to the client"}. You can also download it with the button below.`,
      note ? esc(note) : "",
      `It’s also in your <a href="${await savedDocsLink(origin, dest)}">Saved Docs</a> on the Marketing Hub, with all your other signed-off proposals and candidate packs. That link is private to you.`,
    ].filter(Boolean), { href: origin + rec.pdf, label: "Download the PDF" }),
    attachmentUrl: origin + rec.pdf,
    attachmentName: rec.pdfName,
  });
  return dest;
}

// Proof-reader actions (need the edit key).
export async function editorAction(rec, action, data, origin, extra = {}) {
  const s = await getSettings();
  if (data) rec.data = normalise(data);
  const reviewLink = `${origin}/proposals/review/${rec.id}?k=${rec.editKey}`;
  if (action === "save") {
    await makePdf(rec, origin);
    log(rec, "Proof-reader", "Saved changes");
  } else if (action === "send-check") {
    if (!s.finalChecker) throw new Error("No final checker email is set on the Settings page.");
    await makePdf(rec, origin);
    rec.status = "check";
    log(rec, "Proof-reader", "Sent for final check", s.finalChecker);
    await sendEmail({
      to: s.finalChecker,
      subject: `${DocWord(rec.data)} for final check: ${label(rec.data)}`,
      html: emailHtml(`${DocWord(rec.data)} ready for your final check`, [
        `The ${docWord(rec.data)} for <b>${esc(label(rec.data))}</b> has been proof-read and is ready for you to check.`,
        "Open it to read it through and either approve it or leave comments for changes.",
      ], { href: `${origin}/proposals/check/${rec.id}?c=${rec.checkKey}`, label: `Check the ${docWord(rec.data)}` }),
      attachmentUrl: origin + rec.pdf,
      attachmentName: rec.pdfName,
    });
  } else if (action === "send-consultant") {
    await makePdf(rec, origin);
    await sendToConsultant(rec, origin, { to: extra.to, note: extra.note, by: "Proof-reader" });
  } else {
    throw new Error("Unknown action");
  }
  await saveRecord(rec);
  return { rec, reviewLink };
}

// Final checker: comments or approval go back to the proof-reader.
export async function checkerAction(rec, { comment, approve, name }, origin) {
  const s = await getSettings();
  const text = String(comment || "").trim();
  const who = String(name || "Final checker");
  rec.comments = rec.comments || [];
  rec.comments.push({ at: new Date().toISOString(), by: who, text, approve: !!approve });
  log(rec, who, approve ? "Approved" : "Asked for changes");
  // Approved: straight to the consultant with the PDF the checker saw (proof-readers copied in).
  if (approve && consultantEmail(rec) && rec.pdf) {
    await sendToConsultant(rec, origin, { by: who });
    await saveRecord(rec);
    if (text) {
      await sendEmail({
        to: s.proofreaders,
        subject: `Approved with notes: ${label(rec.data)}`,
        html: emailHtml(`Approved and sent to the consultant`, [
          `${esc(who)} approved the ${docWord(rec.data)} for <b>${esc(label(rec.data))}</b> and it has gone to the consultant. They left these notes:`,
          esc(text).replace(/\n/g, "<br>"),
        ], { href: `${origin}/proposals/review/${rec.id}?k=${rec.editKey}`, label: `Open the ${docWord(rec.data)}` }),
      }).catch((e) => console.error("notes email failed", e));
    }
    return rec;
  }
  rec.status = approve ? "approved" : "changes";
  await saveRecord(rec);
  await sendEmail({
    to: s.proofreaders,
    subject: `${approve ? "Approved" : "Changes requested"}: ${label(rec.data)}`,
    html: emailHtml(approve ? `${DocWord(rec.data)} approved` : `Changes requested on a ${docWord(rec.data)}`, [
      `${esc(who)} has ${approve ? "approved" : "commented on"} the ${docWord(rec.data)} for <b>${esc(label(rec.data))}</b>.`,
      text ? `<b>Comments:</b><br>${esc(text).replace(/\n/g, "<br>")}` : "",
      approve ? "There's no consultant email on it, so open it to send it on." : "Open it to make the changes, then send it back or on to the consultant.",
    ].filter(Boolean), { href: `${origin}/proposals/review/${rec.id}?k=${rec.editKey}`, label: `Open the ${docWord(rec.data)}` }),
  });
  return rec;
}

export function publicView(rec, role) {
  return {
    id: rec.id,
    role,
    status: rec.status,
    statusLabel: STATUS[rec.status] || rec.status,
    data: rec.data,
    pdf: rec.pdf,
    pdfName: rec.pdfName,
    submittedBy: rec.submittedBy,
    comments: rec.comments || [],
    history: rec.history || [],
    createdAt: rec.createdAt,
    updatedAt: rec.updatedAt,
  };
}

export async function listRecords(limit = 50) {
  const ids = (await listFolders("proposals")).filter(validId);
  const recs = (await Promise.all(ids.map((id) => loadRecord(id).catch(() => null)))).filter((r) => r && !r.removed);
  recs.sort((a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)));
  return recs.slice(0, limit);
}

// Taken off the list from the Settings page. Kept in storage (not destroyed) but hidden,
// and its links stop working.
export async function removeRecord(id) {
  const rec = await loadRecord(id);
  if (!rec) return false;
  rec.removed = true;
  log(rec, "Settings", "Removed from the list");
  await saveRecord(rec);
  return true;
}

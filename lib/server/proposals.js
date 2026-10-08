// Saved proposals and their sign-off route:
// consultant submits → proof-reader edits/approves → final checker comments →
// proof-reader updates → proof-reader sends to the consultant.
import { saveJson, loadLatestJson, listFolders, putFile, randomId } from "./store";
import { renderPdf, pdfName } from "../proposal/pdf";
import { normalise } from "../proposal/data";
import { getSettings } from "./settings";
import { sendEmail, emailHtml, esc } from "./mail";

export const STATUS = {
  proof: "With proof-reader",
  check: "With final checker",
  changes: "Comments back from final checker",
  approved: "Approved by final checker",
  sent: "Sent to consultant",
};

const ID = /^[a-f0-9]{32}$/;
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
  const pdf = await renderPdf(rec.data, origin, { mediaLinks: s.mediaLinks });
  const path = `proposals/${rec.id}/pdf/${Date.now()}-${randomId(4)}.pdf`;
  rec.pdf = await putFile(path, pdf, "application/pdf");
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
    subject: `Proposal to proof-read: ${label(rec.data)}`,
    html: emailHtml("New proposal to proof-read", [
      `<b>${esc(rec.submittedBy.name || "A consultant")}</b> has submitted the proposal for <b>${esc(label(rec.data))}</b>.`,
      "Open it to read through, make any changes, then send it on for final checking.",
    ], { href: `${origin}/proposals/review/${rec.id}?k=${rec.editKey}`, label: "Open the proposal" }),
    attachmentUrl: origin + rec.pdf,
    attachmentName: rec.pdfName,
  });
  return rec;
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
      subject: `Proposal for final check: ${label(rec.data)}`,
      html: emailHtml("Proposal ready for your final check", [
        `The proposal for <b>${esc(label(rec.data))}</b> has been proof-read and is ready for you to check.`,
        "Open it to read it through and either approve it or leave comments for changes.",
      ], { href: `${origin}/proposals/check/${rec.id}?c=${rec.checkKey}`, label: "Check the proposal" }),
      attachmentUrl: origin + rec.pdf,
      attachmentName: rec.pdfName,
    });
  } else if (action === "send-consultant") {
    const to = String(extra.to || rec.submittedBy.email || rec.data.c1.email || "").trim();
    if (!to) throw new Error("There's no consultant email to send to.");
    await makePdf(rec, origin);
    rec.status = "sent";
    log(rec, "Proof-reader", "Sent to consultant", to);
    await sendEmail({
      to,
      cc: s.proofreaders,
      subject: `Your proposal is ready: ${label(rec.data)}`,
      html: emailHtml("Your proposal is ready", [
        `Hi ${esc((rec.submittedBy.name || "").split(" ")[0] || "there")},`,
        `Your proposal for <b>${esc(label(rec.data))}</b> has been checked and approved. The finished PDF is attached and ready to send to the client.`,
        extra.note ? esc(extra.note) : "",
      ].filter(Boolean)),
      attachmentUrl: origin + rec.pdf,
      attachmentName: rec.pdfName,
    });
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
  rec.comments = rec.comments || [];
  rec.comments.push({ at: new Date().toISOString(), by: String(name || "Final checker"), text, approve: !!approve });
  rec.status = approve ? "approved" : "changes";
  log(rec, String(name || "Final checker"), approve ? "Approved" : "Asked for changes");
  await saveRecord(rec);
  await sendEmail({
    to: s.proofreaders,
    subject: `${approve ? "Approved" : "Changes requested"}: ${label(rec.data)}`,
    html: emailHtml(approve ? "Proposal approved" : "Changes requested on a proposal", [
      `${esc(name || "The final checker")} has ${approve ? "approved" : "commented on"} the proposal for <b>${esc(label(rec.data))}</b>.`,
      text ? `<b>Comments:</b><br>${esc(text).replace(/\n/g, "<br>")}` : "",
      approve ? "Open it to send it to the consultant." : "Open it to make the changes, then send it back or on to the consultant.",
    ].filter(Boolean), { href: `${origin}/proposals/review/${rec.id}?k=${rec.editKey}`, label: "Open the proposal" }),
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
  const recs = (await Promise.all(ids.map((id) => loadRecord(id).catch(() => null)))).filter(Boolean);
  recs.sort((a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)));
  return recs.slice(0, limit);
}

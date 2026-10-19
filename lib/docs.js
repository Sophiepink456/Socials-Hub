// Proposals and candidate packs share the same storage, sign-off route and PDF printing.
// `data.kind === "candidate"` marks a candidate pack.
import { proposalPages } from "./proposal/pages";
import { normalise, textFields, fieldName } from "./proposal/data";
import { packPages } from "./candidate/pages";
import { normalisePack, packTextFields, packFieldName, packPdfName } from "./candidate/data";
import { normaliseDoc as normaliseLetter, pdfName as letterPdfName, letterTitle } from "./letterhead/doc";

export const isPack = (d) => !!d && d.kind === "candidate";
// Powered by Elevation documents (uploaded and laid out on the letterhead) go through the same sign-off.
export const isLetter = (d) => !!d && d.kind === "letterhead";
export const normaliseDoc = (d) => (isLetter(d) ? normaliseLetter(d) : isPack(d) ? normalisePack(d) : normalise(d));
// How a document is named in lists, emails and page headings.
export const docTitle = (d) => (isLetter(d) ? letterTitle(d) : `${(d && d.clientName) || "Client"} – ${(d && d.roleTitle) || "Role"}`);
export const docType = (d) => (isLetter(d) ? "Powered by Elevation" : isPack(d) ? "Candidate pack" : "Proposal");
export const docPages = (d, ctx) => (isPack(d) ? packPages(d, ctx) : proposalPages(d, ctx));
export const docWord = (d) => (isLetter(d) ? "document" : isPack(d) ? "candidate pack" : "proposal");
export const DocWord = (d) => (isLetter(d) ? "Document" : isPack(d) ? "Candidate pack" : "Proposal");
export const docTextFields = (d) => (isLetter(d) ? {} : isPack(d) ? packTextFields(d) : textFields(d));
export const docFieldName = (d, k) => (isPack(d) ? packFieldName(k) : fieldName(k));
export const docPdfName = (d) => (isLetter(d) ? letterPdfName(d) : isPack(d) ? packPdfName(d) : `Proposal - ${d.clientName || "Client"} - ${d.roleTitle || "Role"}.pdf`.replace(/[^\w &().,'-]+/g, "").trim());
// Where a consultant carries on with a saved draft.
export const draftPath = (d) => (isLetter(d) ? "/letterhead" : isPack(d) ? "/proposals/candidate-pack" : "/proposals");

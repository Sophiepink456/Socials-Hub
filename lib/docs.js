// Proposals and candidate packs share the same storage, sign-off route and PDF printing.
// `data.kind === "candidate"` marks a candidate pack.
import { proposalPages } from "./proposal/pages";
import { normalise, textFields, fieldName } from "./proposal/data";
import { packPages } from "./candidate/pages";
import { normalisePack, packTextFields, packFieldName, packPdfName } from "./candidate/data";

export const isPack = (d) => !!d && d.kind === "candidate";
export const normaliseDoc = (d) => (isPack(d) ? normalisePack(d) : normalise(d));
export const docPages = (d, ctx) => (isPack(d) ? packPages(d, ctx) : proposalPages(d, ctx));
export const docWord = (d) => (isPack(d) ? "candidate pack" : "proposal");
export const DocWord = (d) => (isPack(d) ? "Candidate pack" : "Proposal");
export const docTextFields = (d) => (isPack(d) ? packTextFields(d) : textFields(d));
export const docFieldName = (d, k) => (isPack(d) ? packFieldName(k) : fieldName(k));
export const docPdfName = (d) => (isPack(d) ? packPdfName(d) : `Proposal - ${d.clientName || "Client"} - ${d.roleTitle || "Role"}.pdf`.replace(/[^\w &().,'-]+/g, "").trim());
// Where a consultant carries on with a saved draft.
export const draftPath = (d) => (isPack(d) ? "/proposals/candidate-pack" : "/proposals");

// Page previews for the proposal and candidate pack tiles (shown by app/HoverPreview.js).
// Images live in public/proposal/previews/. Swap the files there to change what the tiles show,
// and change the counts below if you add or remove pages.
const dir = "/proposal/previews/";
const pages = (name, count) => Array.from({ length: count }, (_, i) => `${dir}${name}-${String(i + 1).padStart(2, "0")}.jpg`);

export const PROPOSAL_PAGES = pages("proposal", 12);
export const PACK_PAGES = pages("candidate-pack", 10);

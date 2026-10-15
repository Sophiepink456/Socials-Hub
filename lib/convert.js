// "Start from" an existing proposal or candidate pack: turn one into the other, or copy like for like.
import { blankProposal, normalise, LIMITS } from "./proposal/data";
import { packFromProposal, normalisePack } from "./candidate/data";

const isPack = (d) => !!d && d.kind === "candidate";

// A proposal from a candidate pack: everything the two share.
export function proposalFromPack(pk) {
  const p = blankProposal();
  const keep = ["clientName", "clientWebsite", "clientLogo", "logoSize", "roleTitle", "about", "jobTitle", "location", "reportingTo", "directReports", "noDirectReports",
    "salary", "contract", "twoConsultants", "consultant1", "consultant2", "sitePhotos"];
  for (const k of keep) if (pk[k] !== undefined) p[k] = pk[k];
  p.about = String(p.about || "").slice(0, LIMITS.about);
  p.benefits = (pk.benefits || []).filter((b) => String(b).trim()).slice(0, LIMITS.benefits);
  if (!p.benefits.length) p.benefits = [""];
  p.roleProfile = String(pk.roleProfile || "").slice(0, LIMITS.roleProfile);
  p.understanding = String(pk.opportunity || "").slice(0, LIMITS.understanding);
  for (const c of ["c1", "c2"]) {
    const s = pk[c] || {};
    p[c] = { ...p[c], name: s.name || "", title: s.title || "", email: s.email || "", phone: s.phone || "" };
  }
  // The same photo spaces, the other way round from packFromProposal.
  if (pk.photoTitle) p.photoTitle = pk.photoTitle;
  if (pk.photoRole) p.photoRole = pk.photoRole;
  if (pk.photoKey) p.photoAbout = pk.photoKey;
  if (pk.photoLooking) p.photoUnderstanding = pk.photoLooking;
  if (pk.photoOffer) p.photoTerms = pk.photoOffer;
  if (pk.photoNext) p.photoApproach = pk.photoNext;
  return normalise(p);
}

// `target` is "candidate" or "proposal". Same kind = a full copy (wording changes and added pages too).
export function convertDoc(data, target) {
  const d = JSON.parse(JSON.stringify(data || {}));
  if (target === "candidate") return isPack(d) ? normalisePack(d) : packFromProposal(d);
  return isPack(d) ? proposalFromPack(d) : normalise(d);
}

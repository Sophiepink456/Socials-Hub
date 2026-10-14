// Hub settings, edited on the passcode-protected Settings page.
import { saveJson, loadLatestJson, hasStore } from "./store";

export const DEFAULT_SETTINGS = {
  proofreaders: ["sophiep@elevationrecruitment.com"],
  finalChecker: "johnb@elevationrecruitment.com",
  mediaLinks: ["", ""], // "View Media" buttons on the Branded Campaigns page
  adsScriptUrl: "", // Google Apps Script web app that lists the branded ads Drive folder
  candidatePack: { back: "", front: "", ipad: "" }, // pictures on the Candidate Packs page (blank = standard)
};

export async function getSettings() {
  if (!hasStore()) return { ...DEFAULT_SETTINGS };
  try {
    const s = await loadLatestJson("settings");
    return { ...DEFAULT_SETTINGS, ...(s || {}) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(next) {
  const cur = await getSettings();
  const clean = {
    ...cur,
    proofreaders: (next.proofreaders || cur.proofreaders).map((e) => String(e).trim()).filter(Boolean),
    finalChecker: String(next.finalChecker ?? cur.finalChecker).trim(),
    mediaLinks: (next.mediaLinks || cur.mediaLinks).slice(0, 2).map((u) => String(u || "").trim()),
    adsScriptUrl: String(next.adsScriptUrl ?? cur.adsScriptUrl ?? "").trim(),
    candidatePack: cleanPack(next.candidatePack ?? cur.candidatePack),
    updatedAt: new Date().toISOString(),
  };
  await saveJson("settings", clean);
  return clean;
}

export function checkPasscode(req) {
  const want = process.env.SETTINGS_PASSCODE || "";
  const got = req.headers.get("x-passcode") || "";
  return !!want && got === want;
}

// Only the hub's own stored files may be used on the Candidate Packs page.
function cleanPack(cp) {
  const ok = (u) => (typeof u === "string" && /^\/api\/files\/assets\/[\w.-]+$/.test(u) ? u : "");
  cp = cp || {};
  return { back: ok(cp.back), front: ok(cp.front), ipad: ok(cp.ipad) };
}

// What the proposal pages need from the settings (links and pictures, nothing private).
export function pageContext(s) {
  return { mediaLinks: s.mediaLinks || [], candidatePack: s.candidatePack || {} };
}

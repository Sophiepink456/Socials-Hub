// Hub settings, edited on the passcode-protected Settings page.
import { saveJson, loadLatestJson, hasStore } from "./store";

export const DEFAULT_SETTINGS = {
  proofreaders: ["sophiep@elevationrecruitment.com"],
  finalChecker: "johnb@elevationrecruitment.com",
  mediaLinks: ["", ""], // "View Media" buttons on the Branded Campaigns page
  adsScriptUrl: "", // Google Apps Script web app that lists the branded ads Drive folder
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

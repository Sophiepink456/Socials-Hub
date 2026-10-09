// Branded ads for the first tile on the Branded Campaigns page.
// The ads live in a Google Drive folder. A small Google Apps Script web app
// (see docs/branded-ads-apps-script.gs) lists the folder and hands over files,
// so anything new dropped in the folder shows up here automatically.
// File names don't always say who the ad is for, so Claude reads each new ad
// once to find the client and job title; those labels are kept in storage.
import sharp from "sharp";
import { getSettings } from "./settings";
import { saveJson, loadLatestJson, putFile, readFile, fileUrl, hasStore } from "./store";
import { askClaude, parseJson, hasClaude } from "./claude";

const LABELS = "branded-ads";

async function scriptUrl() {
  const s = await getSettings();
  return (s.adsScriptUrl || process.env.ADS_SCRIPT_URL || "").trim();
}

async function callScript(params, timeoutMs = 25000) {
  const base = await scriptUrl();
  if (!base) throw new Error("The branded ads link isn't set up yet (Settings → Branded ads).");
  const u = new URL(base);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetch(u, { redirect: "follow", signal: ctl.signal });
    const text = await r.text();
    let j;
    try { j = JSON.parse(text); } catch { throw new Error("The Google script didn't reply properly. Check it's deployed with access for “Anyone”."); }
    if (j.error) throw new Error(j.error);
    return j;
  } finally { clearTimeout(t); }
}

async function getFileBuffer(id) {
  const j = await callScript({ id }, 40000);
  return Buffer.from(j.data, "base64");
}

// Best guess from the file name alone, used until (or if) Claude reads the ad.
function guessFromName(name, folderPath) {
  const base = name.replace(/\.[a-z0-9]+$/i, "").replace(/[_]+/g, " ").replace(/\s+/g, " ").trim();
  const parts = base.split(/\s+[-–|]\s+/).map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) return { client: parts[0], jobTitle: parts.slice(1).join(" – ") };
  const folder = (folderPath || []).slice(-1)[0];
  // Camera or export names (IMG_2231, Untitled design (4), 1080x1080…) say nothing useful.
  const meaningless = /^(img|dsc|pxl|photo|image|untitled|screenshot|copy of|final|v?\d)/i.test(base) || !/[a-z]{3}/i.test(base);
  if (folder) return { client: folder, jobTitle: meaningless ? "" : base };
  return { client: meaningless ? `Unlabelled ad (${base})` : base, jobTitle: "" };
}

async function labelWithClaude(file) {
  const buf = await getFileBuffer(file.id);
  const img = await sharp(buf).rotate().resize(1100, 1100, { fit: "inside", withoutEnlargement: true }).flatten({ background: "#ffffff" }).jpeg({ quality: 82 }).toBuffer();
  const reply = await askClaude({
    maxTokens: 300,
    system: "You read recruitment job adverts and reply with JSON only.",
    content: [
      { type: "image", source: { type: "base64", media_type: "image/jpeg", data: img.toString("base64") } },
      { type: "text", text: `This is a branded recruitment advert made by Elevation Recruitment for one of its clients. Which company is hiring, and for what job title?
The Elevation Recruitment name or logo is the agency, not the client — the client is the company the job is with. File name (may help, may be meaningless): "${file.name}". Folder: "${(file.path || []).join(" / ")}".
Reply with JSON only: {"client":"Company name","jobTitle":"Job title"}. Use null for anything you can't tell.` },
    ],
  });
  const j = parseJson(reply);
  return { client: j.client || null, jobTitle: j.jobTitle || null };
}

// List every ad with a label, sorted by client. Reads any new ads (within a time budget)
// and says how many are still waiting so the page can ask again.
export async function listAds({ budgetMs = 40000 } = {}) {
  const started = Date.now();
  const { files = [] } = await callScript({ list: "1" });
  const store = hasStore();
  const labels = (store && (await loadLatestJson(LABELS).catch(() => null))) || {};
  const key = (f) => `${f.id}:${f.updated}`;

  const todo = hasClaude() ? files.filter((f) => !labels[key(f)]) : [];
  let changed = false;
  const queue = [...todo];
  async function worker() {
    while (queue.length && Date.now() - started < budgetMs) {
      const f = queue.shift();
      try {
        labels[key(f)] = { ...(await labelWithClaude(f)), by: "claude" };
      } catch (e) {
        console.error("label ad failed", f.name, e.message);
        labels[key(f)] = { client: null, jobTitle: null, by: "failed" };
      }
      changed = true;
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
  if (changed && store) await saveJson(LABELS, labels).catch((e) => console.error(e));

  const ads = files.map((f) => {
    const g = guessFromName(f.name, f.path);
    const l = labels[key(f)] || {};
    const client = (l.client || g.client || "Unknown client").trim();
    const jobTitle = (l.jobTitle || g.jobTitle || "").trim();
    return { id: f.id, updated: f.updated, name: f.name, client, jobTitle, label: jobTitle ? `${client} – ${jobTitle}` : client };
  });
  ads.sort((a, b) => a.client.localeCompare(b.client, "en-GB", { sensitivity: "base" }) || a.jobTitle.localeCompare(b.jobTitle, "en-GB", { sensitivity: "base" }));
  return { ads, pending: hasClaude() ? files.filter((f) => !labels[key(f)]).length : 0 };
}

// Copy one ad into the hub's storage at a size that stays sharp, and return its link.
export async function importAd(id, updated) {
  if (!/^[A-Za-z0-9_-]{10,}$/.test(String(id))) throw new Error("Bad ad id.");
  const stamp = String(updated || "").replace(/[^0-9]/g, "").slice(0, 14) || "0";
  const path = `assets/branded-${id}-${stamp}.jpg`;
  const existing = await readFile(path).catch(() => null);
  if (existing) return fileUrl(path);
  const buf = await getFileBuffer(id);
  // The tile is 365×456 on a 1920-wide page; 1600px on the long side keeps it crisp when zoomed.
  const out = await sharp(buf).rotate().resize(1600, 1600, { fit: "inside", withoutEnlargement: true }).flatten({ background: "#ffffff" }).jpeg({ quality: 90 }).toBuffer();
  return putFile(path, out, "image/jpeg");
}

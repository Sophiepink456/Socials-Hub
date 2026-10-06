// Runs automatically before every build (Vercel included).
//
// Scans public/designs/<design>/photos/<pool>/ and writes lib/manifest.json,
// so the app always knows which photos exist WITHOUT anyone editing code.
//
//   Add a photo     -> drop it in the folder, commit. Done.
//   Remove a photo  -> delete it, commit. Done.
//   Rebrand         -> replace the files (any names), commit. Done.
//
// Pools are folders. "general" is used for everything; a folder named after a
// division (e.g. "leadership-executive") is used only for that division.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "public", "designs");
const IMG = /\.(jpe?g|png|webp)$/i;
const manifest = {};

if (fs.existsSync(root)) {
  for (const design of fs.readdirSync(root)) {
    const photos = path.join(root, design, "photos");
    if (!fs.existsSync(photos)) continue;
    manifest[design] = {};
    for (const pool of fs.readdirSync(photos)) {
      const dir = path.join(photos, pool);
      if (!fs.statSync(dir).isDirectory()) continue;
      const files = fs.readdirSync(dir).filter((f) => IMG.test(f)).sort();
      if (files.length) manifest[design][pool] = files.map((f) => `/designs/${design}/photos/${pool}/${f}`);
    }
  }
}

// Consultant headshots: public/headshots/<Full Name>.jpg — the file name is
// the name shown in the dropdown. Add, replace or delete files freely.
const heads = path.join(__dirname, "..", "public", "headshots");
const headshots = fs.existsSync(heads)
  ? fs.readdirSync(heads).filter((f) => IMG.test(f)).sort()
      .map((f) => ({ name: f.replace(/\.[^.]+$/, ""), path: `/headshots/${f}` }))
  : [];

fs.writeFileSync(path.join(__dirname, "..", "lib", "manifest.json"), JSON.stringify({ photos: manifest, headshots }, null, 2) + "\n");
console.log(`[manifest] headshots: ${headshots.length}`);
const summary = Object.entries(manifest)
  .map(([d, pools]) => `${d}: ` + Object.entries(pools).map(([p, f]) => `${p} ${f.length}`).join(", "))
  .join(" | ");
console.log("[manifest] " + (summary || "no photos found"));

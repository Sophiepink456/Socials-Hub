// Storage report and tidy-up for the Settings page.
// Grows mostly from: PDFs (one per save/send), website photos and uploaded pictures, and old
// versions of each record. Tidying keeps what's in use and removes what nothing points at.
import { listFiles, removeFiles, readFile, KEEP_VERSIONS } from "./store";
import { KEEP_PDFS } from "./proposals";

const GROUPS = [
  ["PDFs of proposals and candidate packs", (p) => /^proposals\/[^/]+\/pdf\//.test(p)],
  ["Proposal and candidate pack records", (p) => p.startsWith("proposals/")],
  ["Drafts and saved copies", (p) => p.startsWith("drafts/")],
  ["Pictures (website photos, logos, uploads, homepage pictures, branded ads)", (p) => p.startsWith("assets/")],
  ["Appendix documents", (p) => p.startsWith("appendix/")],
  ["Settings and branded ad names", () => true],
];

export async function storageReport() {
  const files = await listFiles("");
  const groups = GROUPS.map(([label]) => ({ label, bytes: 0, files: 0 }));
  let total = 0;
  for (const f of files) {
    const i = GROUPS.findIndex(([, test]) => test(f.pathname));
    groups[i].bytes += f.size || 0;
    groups[i].files += 1;
    total += f.size || 0;
  }
  return { total, files: files.length, groups: groups.filter((g) => g.files), at: new Date().toISOString() };
}

const dir = (p) => p.slice(0, p.lastIndexOf("/"));
const VERSION = /\/\d{15}-[a-f0-9]+\.json$/;
const PICTURE_AGE_DAYS = 30;

// What a tidy-up would remove (and removes it unless `dryRun`).
export async function tidyStorage({ dryRun = false } = {}) {
  const files = await listFiles("");
  const remove = [];
  const byDir = new Map();
  for (const f of files) {
    const d = dir(f.pathname);
    if (!byDir.has(d)) byDir.set(d, []);
    byDir.get(d).push(f);
  }
  const latestJson = [];
  for (const [d, list] of byDir) {
    // Old versions of a record: keep the newest few.
    const versions = list.filter((f) => VERSION.test(f.pathname)).sort((a, b) => a.pathname.localeCompare(b.pathname));
    if (versions.length) {
      latestJson.push(versions[versions.length - 1].pathname);
      remove.push(...versions.slice(0, Math.max(0, versions.length - KEEP_VERSIONS)));
    }
    // Out-of-date PDFs: keep the newest few.
    if (/^proposals\/[^/]+\/pdf$/.test(d)) {
      const pdfs = list.filter((f) => f.pathname.endsWith(".pdf")).sort((a, b) => a.pathname.localeCompare(b.pathname));
      remove.push(...pdfs.slice(0, Math.max(0, pdfs.length - KEEP_PDFS)));
    }
  }
  // Social designs are no longer saved (15 Oct): clear any that were.
  remove.push(...files.filter((f) => f.pathname.startsWith("socials/")));
  // Pictures nothing uses any more: not in any record, draft or saved copy,
  // and older than a month (so a form someone is still filling in keeps its photos).
  const used = new Set();
  for (const p of latestJson) {
    const f = await readFile(p).catch(() => null);
    if (!f) continue;
    const text = await new Response(f.stream).text();
    for (const m of text.matchAll(/assets\/[A-Za-z0-9._-]+/g)) used.add(m[0]);
  }
  const cutoff = Date.now() - PICTURE_AGE_DAYS * 86400000;
  for (const f of files) {
    if (!f.pathname.startsWith("assets/") || used.has(f.pathname)) continue;
    if (new Date(f.uploadedAt).getTime() > cutoff) continue;
    remove.push(f);
  }
  const seen = new Set();
  remove.splice(0, remove.length, ...remove.filter((f) => !seen.has(f.pathname) && seen.add(f.pathname)));
  const bytes = remove.reduce((n, f) => n + (f.size || 0), 0);
  if (!dryRun) await removeFiles(remove.map((f) => f.pathname));
  return { files: remove.length, bytes };
}

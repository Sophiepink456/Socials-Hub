// "Saved designs": one folder per person with their signed-off proposals and candidate packs
// (sent to the consultant) and every social design they've downloaded.
// Social designs are saved as their recipe (the render links), not the image itself, so each
// one takes a few hundred bytes; the folder redraws them when opened or downloaded again.
import { saveJson, listFiles, readFile, randomId, removeFiles } from "./store";
import { listRecords } from "./proposals";

export const slug = (name) => String(name || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

export async function saveSocial({ person, design, designTitle, title, urls, format, width, height }) {
  const s = slug(person);
  if (!s) throw new Error("Choose your name first.");
  const list = (Array.isArray(urls) ? urls : []).map(String).filter((u) => u.startsWith("/api/render/")).slice(0, 20);
  if (!list.length) throw new Error("Nothing to save.");
  const rec = {
    id: randomId(8), person: String(person).trim().slice(0, 80), design: String(design || "").slice(0, 60), designTitle: String(designTitle || "").slice(0, 80),
    title: String(title || "").slice(0, 160), urls: list, format: format === "pdf" ? "pdf" : "png", width: Number(width) || 1080, height: Number(height) || 1350,
    createdAt: new Date().toISOString(),
  };
  await saveJson(`socials/${s}/${rec.id}`, rec);
  return rec;
}

async function readJson(pathname) {
  const f = await readFile(pathname).catch(() => null);
  return f ? JSON.parse(await new Response(f.stream).text()) : null;
}

async function signedOff() {
  const recs = await listRecords(1000).catch(() => []);
  return recs.filter((r) => r.status === "sent" && r.pdf).map((r) => {
    const person = (r.submittedBy && r.submittedBy.name) || r.data.consultant1 || "Unknown";
    return {
      id: r.id, person, kind: r.data.kind === "candidate" ? "candidate" : "proposal",
      title: `${r.data.clientName || "Client"} – ${r.data.roleTitle || "Role"}`, pdf: r.pdf, pdfName: r.pdfName, date: r.updatedAt || r.createdAt,
    };
  });
}

// Everyone with something saved, with counts.
export async function listPeople() {
  const [docs, files] = await Promise.all([signedOff(), listFiles("socials/").catch(() => [])]);
  const people = new Map();
  const get = (name) => {
    const k = slug(name);
    if (!people.has(k)) people.set(k, { slug: k, name: String(name).trim(), proposals: 0, packs: 0, socials: 0 });
    return people.get(k);
  };
  for (const d of docs) get(d.person)[d.kind === "candidate" ? "packs" : "proposals"]++;
  // socials/<person>/<id>/<version>.json: count each design once.
  const designs = new Map();
  for (const f of files) {
    const [, who, id] = f.pathname.split("/");
    if (who && id) designs.set(`${who}/${id}`, who);
  }
  for (const who of designs.values()) {
    if (!people.has(who)) people.set(who, { slug: who, name: "", proposals: 0, packs: 0, socials: 0 });
    people.get(who).socials++;
  }
  // Folders only known from social designs get their name from one of the saved designs.
  for (const p of people.values()) {
    if (p.name) continue;
    const f = files.find((x) => x.pathname.startsWith(`socials/${p.slug}/`));
    const rec = f ? await readJson(f.pathname) : null;
    p.name = (rec && rec.person) || p.slug.replace(/-/g, " ");
  }
  return [...people.values()].sort((a, b) => a.name.localeCompare(b.name));
}

// One person's folder.
export async function personFolder(personSlug) {
  const s = slug(personSlug);
  const [docs, files] = await Promise.all([signedOff(), listFiles(`socials/${s}/`).catch(() => [])]);
  const mine = docs.filter((d) => slug(d.person) === s).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const newest = new Map();
  for (const f of files) {
    const id = f.pathname.split("/")[2];
    if (!newest.has(id) || f.pathname > newest.get(id)) newest.set(id, f.pathname);
  }
  const socials = (await Promise.all([...newest.values()].map((p) => readJson(p)))).filter(Boolean)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const name = (mine[0] && mine[0].person) || (socials[0] && socials[0].person) || s.replace(/-/g, " ");
  return { name, slug: s, proposals: mine.filter((d) => d.kind === "proposal"), packs: mine.filter((d) => d.kind === "candidate"), socials };
}

// Take a social design out of a folder (deletes its saved recipe).
export async function removeSocial(personSlug, id) {
  const s = slug(personSlug);
  if (!s || !/^[a-f0-9]{16}$/.test(String(id))) return false;
  const files = await listFiles(`socials/${s}/${id}/`);
  if (!files.length) return false;
  await removeFiles(files.map((f) => f.pathname));
  return true;
}

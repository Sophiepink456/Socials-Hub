// File storage on Vercel Blob. Works whether the store was created as public
// or private: files are always served to the browser through /api/files/...
// Each save writes a new, uniquely named file, so nothing is ever read stale.
import { put, list, get, del } from "@vercel/blob";
import crypto from "node:crypto";

let accessMode = null; // "private" | "public", found on first write

// For local testing only: LOCAL_STORE_DIR keeps files on disk instead of Vercel Blob.
// Vercel connects a Blob store either with a read-write token or (newer stores) a store id.
const BLOB_ON = () => !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
const LOCAL = !process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID && process.env.LOCAL_STORE_DIR;
import fs from "node:fs";
import nodePath from "node:path";
const lp = (p) => nodePath.join(process.env.LOCAL_STORE_DIR || "", p);

export const hasStore = () => BLOB_ON() || !!LOCAL;
export const randomId = (bytes = 16) => crypto.randomBytes(bytes).toString("hex");
export const fileUrl = (pathname) => `/api/files/${pathname}`;

async function putAuto(pathname, body, contentType) {
  if (LOCAL) {
    fs.mkdirSync(nodePath.dirname(lp(pathname)), { recursive: true });
    fs.writeFileSync(lp(pathname), body);
    fs.writeFileSync(lp(pathname) + ".type", contentType || "");
    return { pathname };
  }
  const opts = (access) => ({ access, contentType, addRandomSuffix: false, allowOverwrite: true });
  const order = accessMode ? [accessMode] : ["private", "public"];
  let lastErr;
  for (const mode of order) {
    try {
      const r = await put(pathname, body, opts(mode));
      accessMode = mode;
      return r;
    } catch (e) {
      lastErr = e;
      if (accessMode) break;
    }
  }
  throw lastErr;
}

export async function putFile(pathname, body, contentType) {
  await putAuto(pathname, body, contentType);
  return fileUrl(pathname);
}

export async function readFile(pathname) {
  if (LOCAL) {
    if (!fs.existsSync(lp(pathname))) return null;
    const buf = fs.readFileSync(lp(pathname));
    return { stream: new Blob([buf]).stream(), contentType: fs.readFileSync(lp(pathname) + ".type", "utf8"), size: buf.length };
  }
  const modes = accessMode ? [accessMode] : ["private", "public"];
  for (const access of modes) {
    try {
      const r = await get(pathname, { access, useCache: false });
      if (r && r.statusCode === 200) {
        accessMode = accessMode || access;
        return { stream: r.stream, contentType: r.blob.contentType, size: r.blob.size };
      }
      // Not found in this mode: the store may be the other kind, so try that before giving up.
    } catch (e) {
      if (accessMode) throw e;
    }
  }
  return null;
}

async function streamToString(stream) {
  return new Response(stream).text();
}

// JSON records kept as versions: <prefix>/<timestamp>.json; the newest wins.
// Only the last few versions are kept, so storage doesn't grow with every save.
export const KEEP_VERSIONS = 5;
export async function saveJson(prefix, data) {
  const name = `${prefix}/${String(Date.now()).padStart(15, "0")}-${randomId(4)}.json`;
  await putAuto(name, JSON.stringify(data), "application/json");
  await pruneFolder(prefix, KEEP_VERSIONS, ".json").catch((e) => console.error("prune failed", prefix, e.message));
  return name;
}

// Every file under a prefix: [{ pathname, size, uploadedAt }].
export async function listFiles(prefix = "") {
  if (LOCAL) {
    const root = lp(prefix);
    const out = [];
    const walk = (dir) => {
      if (!fs.existsSync(dir)) return;
      for (const f of fs.readdirSync(dir)) {
        const full = nodePath.join(dir, f);
        const st = fs.statSync(full);
        if (st.isDirectory()) walk(full);
        else if (!f.endsWith(".type")) out.push({ pathname: nodePath.relative(lp(""), full).split(nodePath.sep).join("/"), size: st.size, uploadedAt: st.mtime.toISOString() });
      }
    };
    walk(root);
    return out;
  }
  const out = [];
  let cursor;
  do {
    const r = await list({ prefix, cursor, limit: 1000 });
    for (const b of r.blobs) out.push({ pathname: b.pathname, size: b.size, uploadedAt: b.uploadedAt });
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  return out;
}

export async function removeFiles(pathnames) {
  const ps = (pathnames || []).filter(Boolean);
  if (!ps.length) return 0;
  if (LOCAL) {
    for (const x of ps) { try { fs.unlinkSync(lp(x)); fs.rmSync(lp(x) + ".type", { force: true }); } catch {} }
    return ps.length;
  }
  for (let i = 0; i < ps.length; i += 500) await del(ps.slice(i, i + 500));
  return ps.length;
}

// Keep the newest `keep` files in one folder (names start with a timestamp, so newest sorts last).
export async function pruneFolder(prefix, keep, ext = "") {
  const files = (await listFiles(prefix + "/")).filter((f) => f.pathname.slice(prefix.length + 1).indexOf("/") === -1 && (!ext || f.pathname.endsWith(ext)));
  files.sort((a, b) => a.pathname.localeCompare(b.pathname));
  return removeFiles(files.slice(0, Math.max(0, files.length - keep)).map((f) => f.pathname));
}

export async function loadLatestJson(prefix) {
  if (LOCAL) {
    const dir = lp(prefix);
    if (!fs.existsSync(dir)) return null;
    const f = fs.readdirSync(dir).filter((x) => x.endsWith(".json")).sort().pop();
    return f ? JSON.parse(fs.readFileSync(nodePath.join(dir, f), "utf8")) : null;
  }
  let cursor, newest = null;
  do {
    const r = await list({ prefix: prefix + "/", cursor, limit: 1000 });
    for (const b of r.blobs) if (b.pathname.endsWith(".json") && (!newest || b.pathname > newest)) newest = b.pathname;
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  if (!newest) return null;
  const f = await readFile(newest);
  if (!f) return null;
  return JSON.parse(await streamToString(f.stream));
}

// Top-level "folders" under a prefix, e.g. every proposal id under "proposals".
export async function listFolders(prefix) {
  if (LOCAL) return fs.existsSync(lp(prefix)) ? fs.readdirSync(lp(prefix)) : [];
  const r = await list({ prefix: prefix + "/", mode: "folded", limit: 1000 });
  return (r.folders || []).map((f) => f.replace(prefix + "/", "").replace(/\/$/, ""));
}

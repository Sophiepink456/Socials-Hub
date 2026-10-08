// File storage on Vercel Blob. Works whether the store was created as public
// or private: files are always served to the browser through /api/files/...
// Each save writes a new, uniquely named file, so nothing is ever read stale.
import { put, list, get } from "@vercel/blob";
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
      if (r === null) return null;
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
export async function saveJson(prefix, data) {
  const name = `${prefix}/${String(Date.now()).padStart(15, "0")}-${randomId(4)}.json`;
  await putAuto(name, JSON.stringify(data), "application/json");
  return name;
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

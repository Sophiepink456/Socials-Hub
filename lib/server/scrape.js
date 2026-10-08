// Pulls usable photos and the logo from a client's website.
// 1. Reads the home page plus a few "about / careers / culture" pages.
// 2. Collects every image (img, srcset, backgrounds, og:image).
// 3. Downloads them, keeps only ones big enough to stay sharp.
// 4. Asks Claude to drop headshots, team line-ups, news shots, logos and text graphics.
// 5. Stores the keepers (and a cleaned-up logo) in the hub's storage.
import { parse } from "node-html-parser";
import sharp from "sharp";
import crypto from "node:crypto";
import { putFile } from "./store";
import { askClaude, hasClaude, parseJson } from "./claude";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36";
const PAGE_HINTS = /(about|who-we-are|our-story|story|careers|jobs|join|culture|life|work-with-us|people|what-we-do|services|sustainability|locations|facilities)/i;
const SKIP_PAGES = /(news|blog|press|media|insights|article|events|webinar|podcast|privacy|cookie|terms|login|account|cart|basket|checkout)/i;
const SKIP_IMG = /(\.svg|\.gif|data:|sprite|icon|favicon|avatar|headshot|portrait|staff|profile|author|gravatar|placeholder|loading|spinner|flag|badge|award|accredit|partner|client-logo|logo|cookie|tracking|pixel)/i;

export function normaliseUrl(u) {
  let s = String(u || "").trim();
  if (!s) return "";
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  try { return new URL(s).toString(); } catch { return ""; }
}

async function fetchWithTimeout(url, ms = 12000, accept = "text/html,*/*") {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    return await fetch(url, { headers: { "User-Agent": UA, Accept: accept, "Accept-Language": "en-GB,en;q=0.9" }, signal: ctl.signal, redirect: "follow" });
  } finally {
    clearTimeout(t);
  }
}

async function getHtml(url) {
  try {
    const r = await fetchWithTimeout(url);
    if (!r.ok) return null;
    const type = r.headers.get("content-type") || "";
    if (!type.includes("html")) return null;
    return { html: await r.text(), url: r.url || url };
  } catch {
    return null;
  }
}

const abs = (u, base) => { try { return new URL(u.trim(), base).toString(); } catch { return null; } };

// Largest candidate from a srcset string.
function bestFromSrcset(srcset, base) {
  const parts = String(srcset).split(",").map((s) => s.trim()).filter(Boolean).map((s) => {
    const [u, d] = s.split(/\s+/);
    const n = d ? parseFloat(d) * (d.endsWith("x") ? 1000 : 1) : 0;
    return { u: abs(u, base), n };
  }).filter((x) => x.u);
  parts.sort((a, b) => b.n - a.n);
  return parts[0] ? parts[0].u : null;
}

function collectImages(root, base) {
  const out = new Map();
  const add = (u, ctx = "") => {
    if (!u) return;
    const url = abs(u, base);
    if (!url || !/^https?:/.test(url)) return;
    const key = url.split("?")[0];
    if (!out.has(key)) out.set(key, { url, ctx });
  };
  for (const m of root.querySelectorAll('meta[property="og:image"], meta[name="twitter:image"]')) add(m.getAttribute("content"), "og");
  for (const img of root.querySelectorAll("img, source")) {
    const ctx = [img.getAttribute("alt"), img.getAttribute("class"), img.getAttribute("id"), img.parentNode && img.parentNode.getAttribute && img.parentNode.getAttribute("class")].filter(Boolean).join(" ");
    const ss = img.getAttribute("srcset") || img.getAttribute("data-srcset");
    if (ss) add(bestFromSrcset(ss, base), ctx);
    add(img.getAttribute("data-src") || img.getAttribute("data-lazy-src") || img.getAttribute("data-original"), ctx);
    if (img.tagName === "IMG") add(img.getAttribute("src"), ctx);
  }
  for (const el of root.querySelectorAll("[style*='background']")) {
    const m = String(el.getAttribute("style")).match(/url\((['"]?)([^'")]+)\1\)/);
    if (m) add(m[2], el.getAttribute("class") || "bg");
  }
  for (const l of root.querySelectorAll('link[rel="preload"][as="image"]')) add(l.getAttribute("href"), "preload");
  // Images referenced from inline styles in <style> blocks
  for (const st of root.querySelectorAll("style")) {
    for (const m of st.text.matchAll(/url\((['"]?)([^'")]+\.(?:jpe?g|png|webp))\1\)/gi)) add(m[2], "css");
  }
  return [...out.values()];
}

function collectLinks(root, base, host) {
  const links = new Set();
  for (const a of root.querySelectorAll("a[href]")) {
    const u = abs(a.getAttribute("href"), base);
    if (!u) continue;
    let h;
    try { h = new URL(u).host; } catch { continue; }
    if (h.replace(/^www\./, "") !== host.replace(/^www\./, "")) continue;
    const path = new URL(u).pathname;
    if (SKIP_PAGES.test(path) || !PAGE_HINTS.test(path) || /\.(pdf|jpe?g|png|zip)$/i.test(path)) continue;
    links.add(u.split("#")[0]);
  }
  return [...links].slice(0, 4);
}

async function downloadImage(url) {
  try {
    const r = await fetchWithTimeout(url, 15000, "image/avif,image/webp,image/*,*/*");
    if (!r.ok) return null;
    const len = Number(r.headers.get("content-length") || 0);
    if (len > 15e6) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 15e6 || buf.length < 8000) return null;
    const meta = await sharp(buf, { failOn: "none" }).metadata();
    if (!meta.width || !meta.height) return null;
    return { buf, w: meta.width, h: meta.height, format: meta.format };
  } catch {
    return null;
  }
}

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); }
  }));
  return out;
}

// Ask Claude which photos are generic enough to use.
async function classify(images) {
  if (!hasClaude() || !images.length) return images.map(() => ({ keep: true, score: 5, kind: "unchecked" }));
  const results = [];
  for (let start = 0; start < images.length; start += 16) {
    const batch = images.slice(start, start + 16);
    const content = [];
    for (let i = 0; i < batch.length; i++) {
      const thumb = await sharp(batch[i].buf, { failOn: "none" }).rotate().resize(400, 400, { fit: "inside" }).jpeg({ quality: 70 }).toBuffer();
      content.push({ type: "text", text: `Image ${i}:` });
      content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: thumb.toString("base64") } });
    }
    content.push({ type: "text", text: `These images come from a company's website. We want generic photos to use as backgrounds in a recruitment proposal for this company: their workplace, buildings, products, operations, people at work in candid shots, scenery.
Reject: headshots or posed portraits of individuals, posed team line-ups, news/event photos (awards, ceremonies, handshakes, press shots), logos, graphics or images containing much text, illustrations, screenshots, stock icons, very dark/blurry images.
Reply with JSON only: {"images":[{"i":0,"keep":true,"kind":"workplace|building|product|operations|people-candid|scenery|headshot|team-photo|news|logo|graphic|other","score":1-10}]} where score is how good it would look as a large background photo.` });
    try {
      const reply = await askClaude({ system: "You are a careful photo editor. Answer with JSON only.", content, maxTokens: 1500 });
      const parsed = parseJson(reply);
      const byI = new Map((parsed.images || []).map((x) => [x.i, x]));
      batch.forEach((_, i) => results.push(byI.get(i) || { keep: false, score: 0, kind: "other" }));
    } catch (e) {
      console.error("classify failed", e);
      batch.forEach(() => results.push({ keep: true, score: 4, kind: "unchecked" }));
    }
  }
  return results;
}

// ---- logo ---------------------------------------------------------------------

function findLogoCandidates(root, base) {
  const c = [];
  const push = (type, value, weight) => value && c.push({ type, value, weight });
  // JSON-LD organisation logo
  for (const s of root.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const j = JSON.parse(s.text);
      const items = Array.isArray(j) ? j : j["@graph"] || [j];
      for (const it of items) {
        const logo = it && it.logo;
        const u = typeof logo === "string" ? logo : logo && (logo.url || logo.contentUrl);
        if (u) push("url", abs(u, base), 6);
      }
    } catch {}
  }
  const scope = root.querySelector("header") || root;
  for (const img of scope.querySelectorAll("img")) {
    const hay = [img.getAttribute("src"), img.getAttribute("alt"), img.getAttribute("class"), img.getAttribute("id"), img.parentNode && img.parentNode.getAttribute && img.parentNode.getAttribute("class")].join(" ").toLowerCase();
    if (/logo|brand/.test(hay)) {
      const ss = img.getAttribute("srcset");
      push("url", ss ? bestFromSrcset(ss, base) : abs(img.getAttribute("data-src") || img.getAttribute("src") || "", base), /\.svg/i.test(img.getAttribute("src") || "") ? 10 : 8);
    }
  }
  for (const svg of scope.querySelectorAll("svg")) {
    let el = svg, hit = false;
    for (let k = 0; k < 4 && el; k++, el = el.parentNode) {
      const hay = ((el.getAttribute && (el.getAttribute("class") || "") + " " + (el.getAttribute("id") || "") + " " + (el.getAttribute("aria-label") || "")) || "").toLowerCase();
      if (/logo|brand/.test(hay) || (el.tagName === "A" && ["/", base].includes(el.getAttribute("href")))) { hit = true; break; }
    }
    if (hit && svg.toString().length > 300) push("svg", svg.toString(), 9);
  }
  for (const l of root.querySelectorAll('link[rel="apple-touch-icon"], link[rel="icon"]')) push("url", abs(l.getAttribute("href"), base), 1);
  c.sort((a, b) => b.weight - a.weight);
  return c;
}

// Make a raster logo's flat background transparent and trim it.
async function cleanRaster(buf) {
  const img = sharp(buf, { failOn: "none" }).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: ch } = info;
  const px = (x, y) => { const i = (y * w + x) * ch; return [data[i], data[i + 1], data[i + 2], data[i + 3]]; };
  const corners = [px(0, 0), px(w - 1, 0), px(0, h - 1), px(w - 1, h - 1)];
  const opaque = corners.every((c) => c[3] > 240);
  const ref = corners[0];
  const same = corners.every((c) => Math.abs(c[0] - ref[0]) + Math.abs(c[1] - ref[1]) + Math.abs(c[2] - ref[2]) < 30);
  if (opaque && same) {
    for (let i = 0; i < data.length; i += ch) {
      const d = Math.abs(data[i] - ref[0]) + Math.abs(data[i + 1] - ref[1]) + Math.abs(data[i + 2] - ref[2]);
      if (d < 40) data[i + 3] = 0;
      else if (d < 90) data[i + 3] = Math.min(data[i + 3], Math.round(((d - 40) / 50) * 255));
    }
  }
  return sharp(data, { raw: { width: w, height: h, channels: ch } }).trim({ threshold: 1 }).png().toBuffer();
}

async function storeLogo(cand) {
  if (cand.type === "svg") {
    let svg = cand.value;
    if (!/xmlns=/.test(svg)) svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
    const name = `assets/logo-${crypto.createHash("sha1").update(svg).digest("hex").slice(0, 20)}.svg`;
    return putFile(name, Buffer.from(svg), "image/svg+xml");
  }
  const r = await fetchWithTimeout(cand.value, 12000, "image/*,*/*").catch(() => null);
  if (!r || !r.ok) return null;
  const buf = Buffer.from(await r.arrayBuffer());
  const type = r.headers.get("content-type") || "";
  if (type.includes("svg") || /\.svg(\?|$)/i.test(cand.value)) {
    const name = `assets/logo-${crypto.createHash("sha1").update(buf).digest("hex").slice(0, 20)}.svg`;
    return putFile(name, buf, "image/svg+xml");
  }
  const meta = await sharp(buf, { failOn: "none" }).metadata().catch(() => null);
  if (!meta || !meta.width || meta.width < 60) return null;
  const png = await cleanRaster(buf);
  const name = `assets/logo-${crypto.createHash("sha1").update(png).digest("hex").slice(0, 20)}.png`;
  return putFile(name, png, "image/png");
}

// Last resort: ask Claude (with web search) for a direct logo file link.
async function searchLogo(company, site) {
  if (!hasClaude()) return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: process.env.CLAUDE_SEARCH_MODEL || "claude-sonnet-5-5",
        max_tokens: 1200,
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 4 }],
        messages: [{ role: "user", content: `Find a direct URL to the official logo image file (SVG or PNG, ideally on a transparent background) for the company "${company}" (website ${site}). Check their website, LinkedIn or other social profiles, or Wikimedia. Reply with JSON only: {"url":"https://..."} or {"url":null}.` }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
    const j = parseJson(text);
    return j.url || null;
  } catch {
    return null;
  }
}

// ---- main ---------------------------------------------------------------------

export async function scrapeSite(rawUrl, company = "") {
  const start = normaliseUrl(rawUrl);
  if (!start) throw new Error("That doesn't look like a web address.");
  const home = await getHtml(start);
  if (!home) throw new Error("Couldn't open that website. Check the address, or the site may block automated visits.");
  const host = new URL(home.url).host;
  const homeRoot = parse(home.html);
  const pages = [{ root: homeRoot, url: home.url }];
  for (const link of collectLinks(homeRoot, home.url, host)) {
    const p = await getHtml(link);
    if (p) pages.push({ root: parse(p.html), url: p.url });
  }

  // Photos
  const seen = new Set();
  let cands = [];
  for (const pg of pages) for (const c of collectImages(pg.root, pg.url)) {
    const key = c.url.split("?")[0];
    if (seen.has(key) || SKIP_IMG.test(c.url) || SKIP_IMG.test(c.ctx || "")) continue;
    seen.add(key);
    cands.push(c);
  }
  cands = cands.slice(0, 60);
  const downloaded = (await pool(cands, 6, (c) => downloadImage(c.url))).map((d, i) => d && { ...d, src: cands[i].url }).filter(Boolean);
  // Big enough to use somewhere (smallest slot is about 800 x 980; banners need 1700+ wide)
  const big = downloaded.filter((d) => d.w >= 1000 && d.h >= 650 && d.w / d.h < 4 && d.h / d.w < 2.2);
  // Drop near-duplicates (same picture at different sizes): keep the biggest per sampled fingerprint
  const uniq = [];
  const prints = new Set();
  for (const d of big.sort((a, b) => b.w * b.h - a.w * a.h)) {
    const fp = (await sharp(d.buf, { failOn: "none" }).resize(8, 8, { fit: "fill" }).greyscale().raw().toBuffer()).toString("hex");
    if (prints.has(fp)) continue;
    prints.add(fp);
    uniq.push(d);
  }
  const top = uniq.slice(0, 24);
  const verdicts = await classify(top);
  const kept = top.map((d, i) => ({ ...d, ...verdicts[i] })).filter((d) => d.keep).sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 12);

  const photos = [];
  for (const d of kept) {
    const out = await sharp(d.buf, { failOn: "none" }).rotate().resize(2400, 2400, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 85, mozjpeg: true }).toBuffer();
    const meta = await sharp(out).metadata();
    const name = `assets/site-${crypto.createHash("sha1").update(out).digest("hex").slice(0, 24)}.jpg`;
    photos.push({ url: await putFile(name, out, "image/jpeg"), w: meta.width, h: meta.height, kind: d.kind, score: d.score });
  }

  // Logo
  let logo = null;
  for (const pg of pages.slice(0, 1)) {
    for (const cand of findLogoCandidates(pg.root, pg.url).slice(0, 5)) {
      logo = await storeLogo(cand).catch(() => null);
      if (logo) break;
    }
  }
  let logoSource = logo ? "website" : null;
  if (!logo) {
    const u = await searchLogo(company || host, home.url);
    if (u) { logo = await storeLogo({ type: "url", value: u }).catch(() => null); if (logo) logoSource = "web search"; }
  }

  return { photos, logo, logoSource, pagesRead: pages.length, imagesFound: cands.length, checked: hasClaude() };
}

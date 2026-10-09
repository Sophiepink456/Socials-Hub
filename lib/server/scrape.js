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
import { askClaude, hasClaude, parseJson, claudeHeaders } from "./claude";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36";
const PAGE_HINTS = /(about|who-we-are|our-story|story|careers|jobs|join|culture|life|work-with-us|people|what-we-do|services|sustainability|locations|facilities)/i;
const SKIP_PAGES = /(news|blog|press|media|insights|article|events|webinar|podcast|privacy|cookie|terms|login|account|cart|basket|checkout)/i;
const SKIP_IMG = /(\.svg|\.gif|data:|sprite|icon|favicon|avatar|headshot|portrait|profile-pic|author|gravatar|placeholder|loading|spinner|flag|badge|award|accredit|client-logo|logo|cookie|tracking|pixel|emoji)/i;

// Many sites only put a small copy in the page. Work out the full-size original where the
// pattern is well known (WordPress, Shopify, Squarespace, Wix, Cloudinary, imgix-style ?w=).
function originalUrl(u) {
  let s = u;
  try {
    s = s.replace(/-\d{2,4}x\d{2,4}(\.(?:jpe?g|png|webp))(\?|$)/i, "$1$2"); // WordPress -300x200.jpg
    s = s.replace(/_(?:\d{2,4}x\d{0,4}|x\d{2,4})(?:_crop_\w+)?(\.(?:jpe?g|png|webp))/i, "$1"); // Shopify _400x.jpg
    s = s.replace(/(\/upload\/)(?:[a-z]{1,3}_[^/]+\/)+/i, "$1"); // Cloudinary transforms
    s = s.replace(/(\/[^/]+\.(?:jpe?g|png|webp))\/v1\/(?:fill|fit|crop)\/[^/]+\/[^/]+$/i, "$1"); // Wix
    const url = new URL(s);
    if (url.searchParams.has("format") && /\d+w/.test(url.searchParams.get("format"))) url.searchParams.set("format", "2500w"); // Squarespace
    for (const k of ["w", "h", "width", "height", "resize", "fit", "crop", "quality", "q", "dpr"]) url.searchParams.delete(k);
    return url.toString();
  } catch { return s; }
}

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

export async function getHtml(url) {
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
    if (SKIP_PAGES.test(path) || /\.(pdf|jpe?g|png|zip|docx?)$/i.test(path) || path === "/" ) continue;
    links.add(u.split("#")[0]);
  }
  // Pages most likely to have workplace photos first, then any other page on the site.
  const all = [...links];
  return [...all.filter((u) => PAGE_HINTS.test(new URL(u).pathname)), ...all.filter((u) => !PAGE_HINTS.test(new URL(u).pathname))].slice(0, 7);
}

async function downloadImage(url) {
  const orig = originalUrl(url);
  if (orig !== url) {
    const d = await downloadOne(orig);
    if (d) return { ...d, src: orig };
  }
  const d = await downloadOne(url);
  return d && { ...d, src: url };
}

async function downloadOne(url) {
  try {
    const r = await fetchWithTimeout(url, 15000, "image/avif,image/webp,image/*,*/*");
    if (!r.ok) return null;
    const len = Number(r.headers.get("content-length") || 0);
    if (len > 15e6) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 15e6 || buf.length < 5000) return null;
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
    content.push({ type: "text", text: `These images come from a company's website. We want real photos to use as backgrounds in a recruitment proposal for this company: their offices, sites, buildings, products, operations, people working, the area they're in, scenery. Be generous — most real photos are fine.
Reject ONLY: close-up headshots or portraits of one person posing for the camera; news/event photos (awards, ceremonies, presentations, handshakes, press shots); logos, icons, illustrations, diagrams or screenshots; images that are mostly text; images that are blank, very dark or very blurry.
Reply with JSON only: {"images":[{"i":0,"keep":true,"kind":"workplace|building|product|operations|people-working|team|scenery|headshot|news|logo|graphic|other","score":1-10}]} where score is how good it would look as a large background photo.` });
    try {
      const reply = await askClaude({ system: "You are a careful photo editor. Answer with JSON only.", content, maxTokens: 1500 });
      const parsed = parseJson(reply);
      const byI = new Map((parsed.images || []).map((x) => [x.i, x]));
      batch.forEach((_, i) => results.push(byI.get(i) || { keep: true, score: 3, kind: "unchecked" }));
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

// Most reliable way to get the whole logo: open the site in a real browser, find the logo in
// the header (often a link wrapping an icon and a wordmark, or an inline SVG that relies on the
// page's styles), hide everything else and take a transparent, high-resolution picture of it.
async function captureLogo(url) {
  const { launch } = await import("../proposal/pdf");
  const browser = await launch();
  try {
    const page = await browser.newPage();
    await page.setUserAgent(UA);
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 4 });
    await page.goto(url, { waitUntil: "networkidle2", timeout: 20000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 800));
    const rect = await page.evaluate(() => {
      const home = new URL("/", location.href).href;
      const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && cs.opacity !== "0"; };
      const hay = (el) => [el.id, el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className, el.getAttribute("alt"), el.getAttribute("aria-label"), el.getAttribute("title"), el.getAttribute("src")].join(" ").toLowerCase();
      const cands = [];
      const consider = (el, bonus) => {
        if (!el || !vis(el)) return;
        const r = el.getBoundingClientRect();
        if (r.top > 260 || r.width < 40 || r.width > 700 || r.height < 14 || r.height > 260) return;
        if (!el.querySelector("img,svg,picture") && !["IMG", "SVG", "svg", "PICTURE"].includes(el.tagName) && getComputedStyle(el).backgroundImage === "none") return;
        let score = bonus + (/logo|brand/.test(hay(el)) ? 5 : 0) - r.top / 100 - r.left / 800;
        cands.push({ el, score });
      };
      // Links back to the home page that hold a picture are usually the logo.
      for (const a of document.querySelectorAll("a[href]")) {
        let href; try { href = new URL(a.getAttribute("href"), location.href).href; } catch { continue; }
        if (href === home || href === location.origin || href === location.origin + "/") consider(a, 6);
      }
      for (const el of document.querySelectorAll("[class*=logo i],[id*=logo i],img[alt*=logo i],[class*=brand i],svg[aria-label]")) consider(el, 3);
      cands.sort((a, b) => b.score - a.score);
      const pick = cands[0] && cands[0].el;
      if (!pick) return null;
      pick.setAttribute("data-logo-pick", "1");
      const st = document.createElement("style");
      st.textContent = "html,body{background:transparent!important}body *{visibility:hidden!important;animation:none!important;transition:none!important}[data-logo-pick],[data-logo-pick] *{visibility:visible!important}";
      document.head.appendChild(st);
      window.scrollTo(0, 0);
      const r = pick.getBoundingClientRect();
      return { x: r.left, y: r.top, width: r.width, height: r.height };
    });
    if (!rect) return null;
    await new Promise((r) => setTimeout(r, 200));
    const shot = await page.screenshot({ clip: { x: Math.max(0, rect.x - 2), y: Math.max(0, rect.y - 2), width: rect.width + 4, height: rect.height + 4 }, omitBackground: true, type: "png" });
    const png = await sharp(Buffer.from(shot)).trim({ threshold: 1 }).png().toBuffer().catch(() => null);
    if (!png) return null;
    // Make sure something was actually captured (not an empty box).
    const st = await sharp(png).stats();
    const alpha = st.channels[3];
    if (!alpha || alpha.mean < 8) return null;
    const meta = await sharp(png).metadata();
    if (meta.width < 120) return null;
    const name = `assets/logo-${crypto.createHash("sha1").update(png).digest("hex").slice(0, 20)}.png`;
    return putFile(name, png, "image/png");
  } finally {
    await browser.close().catch(() => {});
  }
}

// Last resort: ask Claude (with web search) for a direct logo file link.
async function searchLogo(company, site) {
  if (!hasClaude()) return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: claudeHeaders(),
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

// Open a page in headless Chrome, scroll to the bottom so lazy pictures load, and return the
// finished HTML plus any background images set in stylesheets.
export async function renderPages(urls) {
  const { launch } = await import("../proposal/pdf");
  const browser = await launch();
  const out = [];
  try {
    for (const url of urls) {
      const page = await browser.newPage();
      try {
        await page.setUserAgent(UA);
        await page.setViewport({ width: 1600, height: 1000 });
        await page.goto(url, { waitUntil: "networkidle2", timeout: 20000 }).catch(() => {});
        await page.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight && y < 20000; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 150)); }
          window.scrollTo(0, 0);
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 1200));
        const extra = await page.evaluate(() => {
          const urls = new Set();
          for (const img of document.images) if (img.currentSrc && img.naturalWidth >= 400) urls.add(img.currentSrc);
          for (const el of document.querySelectorAll("body *")) {
            const bg = getComputedStyle(el).backgroundImage;
            const m = bg && bg.match(/url\(["']?([^"')]+)["']?\)/);
            if (m && el.offsetWidth >= 400) urls.add(m[1]);
          }
          return [...urls];
        }).catch(() => []);
        out.push({ root: parse(await page.content()), url: page.url() || url, extra });
      } finally { await page.close().catch(() => {}); }
    }
  } finally { await browser.close().catch(() => {}); }
  return out;
}

export async function scrapeSite(rawUrl, company = "") {
  const started = Date.now();
  const start = normaliseUrl(rawUrl);
  if (!start) throw new Error("That doesn't look like a web address.");
  let home = await getHtml(start);
  let rendered = [];
  if (!home) {
    // Some sites refuse simple requests but open fine in a real browser.
    rendered = await renderPages([start]).catch(() => []);
    if (!rendered.length) throw new Error("Couldn't open that website. Check the address, or the site may block automated visits.");
    home = { html: rendered[0].root.toString(), url: rendered[0].url };
  }
  const host = new URL(home.url).host;
  const homeRoot = parse(home.html);
  const pages = [{ root: homeRoot, url: home.url }];
  const links = collectLinks(homeRoot, home.url, host);
  await pool(links, 4, async (link) => {
    const p = await getHtml(link);
    if (p) pages.push({ root: parse(p.html), url: p.url });
  });

  const gather = (pgs) => {
    const seen = new Set();
    const list = [];
    for (const pg of pgs) {
      const found = [...collectImages(pg.root, pg.url), ...(pg.extra || []).map((u) => ({ url: u, ctx: "rendered" }))];
      for (const c of found) {
        const key = originalUrl(c.url).split("?")[0];
        if (seen.has(key) || SKIP_IMG.test(c.url) || SKIP_IMG.test(c.ctx || "")) continue;
        seen.add(key);
        list.push(c);
      }
    }
    return list;
  };

  // Photos. If the plain pages show few pictures, the site probably loads them with
  // JavaScript, so open the home page and best pages in a real browser as well.
  let cands = gather(pages);
  if (cands.length < 12 && !rendered.length) {
    rendered = await renderPages([home.url, ...links.slice(0, 2)]).catch((e) => { console.error("render failed", e.message); return []; });
  }
  if (rendered.length) cands = gather([...rendered, ...pages]);
  cands = cands.slice(0, 90);

  const downloaded = (await pool(cands, 8, (c) => downloadImage(c.url))).filter(Boolean);
  // Real photos only: big enough to enlarge cleanly (at least ~640 wide), not banners or slivers.
  const usable = downloaded.filter((d) => d.w >= 640 && d.h >= 420 && d.w / d.h < 3.5 && d.h / d.w < 2.2);
  // Drop near-duplicates (same picture at different sizes): keep the biggest per fingerprint.
  const uniq = [];
  const prints = new Set();
  for (const d of usable.sort((a, b) => b.w * b.h - a.w * a.h)) {
    const fp = (await sharp(d.buf, { failOn: "none" }).resize(8, 8, { fit: "fill" }).greyscale().raw().toBuffer()).toString("hex");
    if (prints.has(fp)) continue;
    prints.add(fp);
    uniq.push(d);
  }
  const top = uniq.slice(0, 32);
  const verdicts = await classify(top);
  const kept = top.map((d, i) => ({ ...d, ...verdicts[i] })).filter((d) => d.keep)
    .sort((a, b) => (b.score || 0) - (a.score || 0) || b.w * b.h - a.w * a.h).slice(0, 16);

  // Store each photo large enough to fill the biggest space (1920 × 1080). Smaller pictures are
  // enlarged with a high-quality filter and lightly sharpened, so they look smooth, not blocky.
  const photos = [];
  await pool(kept, 4, async (d) => {
    const scale = Math.min(3, Math.max(1, 1920 / d.w, 1080 / d.h));
    let img = sharp(d.buf, { failOn: "none" }).rotate();
    if (scale > 1.01) {
      img = img.resize(Math.round(d.w * scale), Math.round(d.h * scale), { kernel: "lanczos3" }).sharpen({ sigma: 0.8, m1: 0.6, m2: 1.2 });
    } else {
      img = img.resize(2400, 2400, { fit: "inside", withoutEnlargement: true });
    }
    const out = await img.jpeg({ quality: 88, mozjpeg: true }).toBuffer();
    const meta = await sharp(out).metadata();
    const name = `assets/site-${crypto.createHash("sha1").update(out).digest("hex").slice(0, 24)}.jpg`;
    photos.push({ url: await putFile(name, out, "image/jpeg"), w: meta.width, h: meta.height, origW: d.w, origH: d.h, kind: d.kind, score: d.score });
  });
  photos.sort((a, b) => (b.score || 0) - (a.score || 0) || b.origW * b.origH - a.origW * a.origH);
  console.log(`scrape ${host}: ${pages.length} pages, ${rendered.length} rendered, ${cands.length} images, ${usable.length} usable, ${kept.length} kept, ${Date.now() - started}ms`);

  // Logo
  let logo = await captureLogo(home.url).catch((e) => { console.error("logo capture failed", e.message); return null; });
  for (const pg of logo ? [] : pages.slice(0, 1)) {
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

  return { photos, logo, logoSource, pagesRead: pages.length + rendered.length, imagesFound: cands.length, checked: hasClaude() };
}

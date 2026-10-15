// Candidate packs: a picture of the client's homepage for the laptop on the About page,
// and the client's brand colours (picked from their logo, or the top of their homepage).
import sharp from "sharp";
import crypto from "node:crypto";
import { putFile, readFile } from "./store";
import { normaliseUrl } from "./scrape";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36";

// Cookie and chat pop-ups would cover the page, so they're hidden (not clicked).
const HIDE_POPUPS = `
  [id*="cookie" i],[class*="cookie" i],[id*="consent" i],[class*="consent" i],[id*="onetrust" i],[class*="onetrust" i],
  [id*="cookiebot" i],[id*="CybotCookiebot" i],[class*="cc-window" i],[class*="gdpr" i],[id*="gdpr" i],
  [class*="chat-widget" i],[id*="hubspot-messages" i],[id*="intercom" i],[class*="intercom" i],iframe[title*="chat" i],
  .woocommerce-store-notice,.demo_store,[class*="announcement" i],[id*="announcement" i],[class*="promo-bar" i],[class*="notice-bar" i],
  [class*="newsletter-popup" i],[class*="popup" i][class*="modal" i],[role="dialog"],[aria-modal="true"],[class*="klaviyo" i],[class*="privy" i]
  { display: none !important; visibility: hidden !important; }
  html, body { overflow: hidden !important; }`;

export async function captureHomepage(rawUrl, { save = true } = {}) {
  const url = normaliseUrl(rawUrl);
  if (!url) throw new Error("That doesn't look like a web address.");
  const { launch } = await import("../proposal/pdf");
  const browser = await launch();
  try {
    const page = await browser.newPage();
    await page.setUserAgent(UA);
    // The laptop screen is 827 x 519, so capture at the same shape, twice the size.
    await page.setViewport({ width: 1440, height: 903, deviceScaleFactor: 1.2 });
    await page.goto(url, { waitUntil: "networkidle2", timeout: 25000 }).catch(() => {});
    await page.addStyleTag({ content: HIDE_POPUPS }).catch(() => {});
    // Anything else that floats over the page: offer and notice bars (e.g. "… 15% off! Dismiss"),
    // pop-up boxes and overlays, and things stuck to the bottom of the screen.
    await page.evaluate(() => {
      const vw = window.innerWidth, vh = window.innerHeight;
      const hide = (el) => el.style.setProperty("display", "none", "important");
      for (const el of document.querySelectorAll("body *")) {
        const cs = getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden") continue;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        const floating = cs.position === "fixed" || cs.position === "sticky";
        const text = (el.innerText || "").trim().toLowerCase();
        const isBar = r.width >= vw * 0.8 && r.height <= 120 && text.length < 200;
        // Never touch the site's own header or menu.
        const inHeader = !!el.closest("header, nav, [role=banner], [role=navigation]") || el.querySelectorAll("a").length >= 4 || !!el.querySelector("nav");
        const offer = /% off|discount|free (shipping|delivery)|sign up|subscribe|newsletter|\bsale\b|\boffer\b|\bdismiss\b/.test(text);
        if (isBar && offer && !inHeader) { hide(el); continue; }
        if (floating && r.width * r.height > vw * vh * 0.3 && !inHeader) { hide(el); continue; }
        if (cs.position === "fixed" && r.top > vh * 0.5 && !inHeader) { hide(el); continue; }
      }
      document.documentElement.style.setProperty("overflow", "hidden", "important");
    }).catch(() => {});
    // The colours people actually see: what's painted across the first three screens (sticky
    // menus count on every screen they stay on), plus buttons. This also nudges lazy images.
    const swatches = await page.evaluate(SAMPLE_COLOURS).catch(() => null);
    await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
    await new Promise((r) => setTimeout(r, 1500));
    // The logo as it appears on the site.
    let logoBuf = null;
    if (swatches && swatches.logo) {
      const c = swatches.logo;
      logoBuf = await page.screenshot({ type: "png", clip: { x: Math.max(0, c.x), y: Math.max(0, c.y), width: Math.min(c.w, 1440), height: Math.min(c.h, 903) } }).then((b) => Buffer.from(b)).catch(() => null);
    }
    const shot = await page.screenshot({ type: "jpeg", quality: 86, clip: { x: 0, y: 0, width: 1440, height: 903 } });
    const buf = Buffer.from(shot);
    const name = `assets/siteshot-${crypto.createHash("sha1").update(buf).digest("hex").slice(0, 24)}.jpg`;
    return { url: save ? await putFile(name, buf, "image/jpeg") : "", buf, swatches: swatches && swatches.colours, logoBuf };
  } finally {
    await browser.close().catch(() => {});
  }
}

// Runs inside the client's homepage. Samples a grid of points on each of the first three screens and
// records the colour painted there (photos and videos are skipped, they aren't brand colours).
// Menus and headers count double, buttons and the logo are added on top.
const SAMPLE_COLOURS = async () => {
  const vw = window.innerWidth, vh = window.innerHeight;
  const weights = {};
  const parse = (c) => { const m = String(c || "").match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return v.length >= 3 && (v[3] === undefined || v[3] >= 0.6) ? v.slice(0, 3) : null; };
  const add = (rgb, w) => { if (!rgb) return; const k = rgb.map((x) => Math.round(x)).join(","); weights[k] = (weights[k] || 0) + w; };
  const isChrome = (el) => !!el.closest("header, nav, [role=banner], [role=navigation], [class*=header i], [class*=navbar i], [class*=topbar i]");
  const painted = (el) => {
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const tag = e.tagName.toLowerCase();
      if (tag === "img" || tag === "video" || tag === "canvas" || tag === "picture" || tag === "iframe") return null;
      const cs = getComputedStyle(e);
      if (cs.backgroundImage && cs.backgroundImage !== "none" && !/gradient/.test(cs.backgroundImage)) return null;
      if (e instanceof SVGElement && tag !== "svg") { const f = parse(cs.fill); if (f) return f; continue; }
      const bg = parse(cs.backgroundColor);
      if (bg) return bg;
      if (/gradient/.test(cs.backgroundImage)) { const g = cs.backgroundImage.match(/rgba?\([^)]+\)/); if (g) return parse(g[0]); }
    }
    return parse(getComputedStyle(document.body).backgroundColor) || [255, 255, 255];
  };
  const screens = Math.min(3, Math.max(1, Math.ceil(document.documentElement.scrollHeight / vh)));
  for (let s = 0; s < screens; s++) {
    window.scrollTo(0, s * vh);
    await new Promise((r) => setTimeout(r, 350));
    for (let y = 6; y < vh; y += 18) for (let x = 6; x < vw; x += 18) {
      const el = document.elementFromPoint(x, y);
      if (!el) continue;
      add(painted(el), isChrome(el) ? 2 : 1);
    }
  }
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 200));
  // Buttons and call-to-action links: small, but almost always the brand colour.
  for (const el of document.querySelectorAll("button, a, [class*=btn i], [class*=button i]")) {
    const r = el.getBoundingClientRect();
    if (r.width < 40 || r.height < 20 || r.width > vw * 0.6 || r.top > vh * 3) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") continue;
    add(parse(cs.backgroundColor), 25);
  }
  // The logo: an image or svg in the header, preferring one named "logo".
  const cands = [...document.querySelectorAll("header img, header svg, nav img, nav svg, [class*=logo i] img, [class*=logo i] svg, img[class*=logo i], img[alt*=logo i], img[src*=logo i], svg[class*=logo i]")]
    .map((e) => ({ e, r: e.getBoundingClientRect() }))
    .filter(({ r }) => r.width >= 40 && r.height >= 15 && r.top >= 0 && r.top < 250 && r.width < vw * 0.5);
  cands.sort((a, b) => (/logo/i.test(b.e.outerHTML.slice(0, 300)) - /logo/i.test(a.e.outerHTML.slice(0, 300))) || (a.r.left - b.r.left));
  const l = cands[0];
  return { colours: Object.entries(weights).map(([k, w]) => ({ rgb: k.split(",").map(Number), w })), logo: l ? { x: l.r.left, y: l.r.top, w: l.r.width, h: l.r.height } : null };
};

async function logoBuffer(src) {
  const s = String(src || "");
  if (s.startsWith("data:")) {
    const body = s.slice(s.indexOf(",") + 1);
    return s.slice(0, s.indexOf(",")).includes(";base64") ? Buffer.from(body, "base64") : Buffer.from(decodeURIComponent(body), "utf8");
  }
  const m = s.match(/^\/api\/files\/(.+)$/);
  if (m) {
    const f = await readFile(decodeURIComponent(m[1]));
    return f ? Buffer.from(await new Response(f.stream).arrayBuffer()) : null;
  }
  return null;
}

const hex = (r, g, b) => "#" + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn;
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  let h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function hslToHex(h, s, l) {
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return hex(f(0) * 255, f(8) * 255, f(4) * 255);
}

// The most used strong colour in an image (ignores white, black, greys and see-through pixels).
async function brandColour(buf, region) {
  let img = sharp(buf, { failOn: "none" }).rotate();
  if (region) {
    const meta = await img.metadata();
    img = sharp(buf, { failOn: "none" }).extract({ left: 0, top: 0, width: meta.width, height: Math.min(meta.height, region) });
  }
  const { data, info } = await img.ensureAlpha().resize(96, 96, { fit: "inside" }).raw().toBuffer({ resolveWithObject: true });
  const buckets = new Map();
  for (let i = 0; i < data.length; i += info.channels) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    if (a < 160) continue;
    const [h, s, l] = rgbToHsl(r, g, b);
    if (s < 0.25 || l < 0.07 || l > 0.92) continue;
    const key = Math.round(h / 20) % 18;
    const c = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 };
    c.n++; c.r += r; c.g += g; c.b += b;
    buckets.set(key, c);
  }
  const best = [...buckets.values()].sort((a, b) => b.n - a.n)[0];
  if (!best || best.n < 12) return null;
  return [best.r / best.n, best.g / best.n, best.b / best.n];
}

// Colours the site itself declares: <meta name="theme-color"> and the strong colours used most
// in its stylesheets (no browser needed).
async function cssColour(rawUrl) {
  const { getHtml } = await import("./scrape");
  const url = normaliseUrl(rawUrl);
  if (!url) return null;
  const page = await getHtml(url);
  if (!page) return null;
  const meta = page.html.match(/<meta[^>]+name=["']theme-color["'][^>]*content=["']\s*(#[0-9a-f]{6}|#[0-9a-f]{3})\b/i)
    || page.html.match(/<meta[^>]+content=["']\s*(#[0-9a-f]{6}|#[0-9a-f]{3})\b[^>]*name=["']theme-color["']/i);
  let css = page.html;
  const links = [...page.html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi)].map((m) => m[1]).slice(0, 3);
  for (const href of links) {
    try {
      const r = await fetch(new URL(href, page.url), { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(8000) });
      if (r.ok) css += await r.text();
    } catch {}
  }
  const counts = new Map();
  for (const m of css.matchAll(/#([0-9a-f]{6}|[0-9a-f]{3})\b/gi)) {
    let h = m[1].toLowerCase();
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    const [, sat, l] = rgbToHsl(...rgb);
    if (sat < 0.3 || l < 0.07 || l > 0.9) continue;
    counts.set(h, (counts.get(h) || 0) + 1);
  }
  const top = [...counts.entries()].sort((x, y) => y[1] - x[1])[0];
  const pick = meta ? meta[1] : top && top[1] >= 3 ? `#${top[0]}` : null;
  if (!pick) return null;
  let h = pick.slice(1);
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [, sat, l] = rgbToHsl(...rgb);
  return sat >= 0.25 && l >= 0.07 && l <= 0.92 ? rgb : null;
}

// The client's colours, most prominent first: what's painted on their homepage (menus, page
// backgrounds, buttons), with their logo counting heavily too. Their stylesheet is the fallback.
export async function pickColours({ logo, shotBuf, url, swatches, siteLogo }) {
  const score = new Map(); // hue group -> { w, best: Map(hex -> w) }
  const add = (rgb, w) => {
    const [h, s, l] = rgbToHsl(...rgb);
    if (s < 0.22 || l < 0.07 || l > 0.9) return; // whites, greys and blacks aren't brand colours
    const key = `${Math.round(h / 15) % 24}${l < 0.3 ? "d" : ""}`;
    const g = score.get(key) || { w: 0, best: new Map() };
    const hx = hex(...rgb);
    g.w += w; g.best.set(hx, (g.best.get(hx) || 0) + w);
    score.set(key, g);
  };
  let total = 0;
  for (const c of swatches || []) { total += c.w; add(c.rgb, c.w); }
  // Each logo counts as a good share of the page.
  const logoWeight = Math.max(200, total * 0.12);
  for (const src of [siteLogo, await logoBuffer(logo).catch(() => null)]) {
    if (!src) continue;
    const rgb = await brandColour(src).catch(() => null);
    if (rgb) add(rgb, logoWeight);
  }
  let source = "website";
  if (!score.size && url) { const rgb = await cssColour(url).catch(() => null); if (rgb) add(rgb, 1); }
  if (!score.size && shotBuf) { const rgb = await brandColour(shotBuf).catch(() => null); if (rgb) { add(rgb, 1); source = "homepage"; } }
  if (!score.size) return null;
  const groups = [...score.values()].sort((a, b) => b.w - a.w)
    .map((g) => ({ w: g.w, rgb: [...g.best.entries()].sort((a, b) => b[1] - a[1])[0][0] }))
    .map((g) => ({ ...g, hsl: rgbToHsl(...[1, 3, 5].map((i) => parseInt(g.rgb.slice(i, i + 2), 16))) }));
  const top = groups[0];
  // Accent: the most prominent colour bright enough to show on dark photos.
  // (A dark top colour, like a navy menu, can't be the accent, so a smaller bright one will do.)
  const bright = groups.find((g) => g.hsl[2] >= 0.28 && g.w >= top.w * (top.hsl[2] < 0.28 ? 0.04 : 0.15));
  if (process.env.COLOUR_DEBUG) console.log("colour groups", JSON.stringify(groups.slice(0, 6).map((g) => [g.rgb, Math.round(g.w)])));
  const accent = bright ? bright.rgb : hslToHex(top.hsl[0], top.hsl[1], 0.35);
  // Dark: the site's own dark brand colour (a navy menu, say), or a deep shade of the accent.
  const darkG = groups.find((g) => g.hsl[2] < 0.3 && g.w >= top.w * 0.15);
  const ah = rgbToHsl(...[1, 3, 5].map((i) => parseInt(accent.slice(i, i + 2), 16)));
  const dark = darkG ? (darkG.hsl[2] <= 0.2 ? darkG.rgb : hslToHex(darkG.hsl[0], darkG.hsl[1], 0.18)) : hslToHex(ah[0], Math.min(ah[1], 0.6), 0.14);
  return { accent, dark, source };
}

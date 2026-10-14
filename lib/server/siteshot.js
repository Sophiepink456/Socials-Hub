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

export async function captureHomepage(rawUrl) {
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
    // Nudge lazy images and hero animations, then come back to the top.
    await page.evaluate(async () => { window.scrollTo(0, 600); await new Promise((r) => setTimeout(r, 400)); window.scrollTo(0, 0); }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1500));
    const shot = await page.screenshot({ type: "jpeg", quality: 86, clip: { x: 0, y: 0, width: 1440, height: 903 } });
    const buf = Buffer.from(shot);
    const name = `assets/siteshot-${crypto.createHash("sha1").update(buf).digest("hex").slice(0, 24)}.jpg`;
    return { url: await putFile(name, buf, "image/jpeg"), buf };
  } finally {
    await browser.close().catch(() => {});
  }
}

async function logoBuffer(src) {
  const s = String(src || "");
  if (s.startsWith("data:")) return Buffer.from(s.split(",")[1] || "", s.includes(";base64") ? "base64" : "utf8");
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
    if (s < 0.3 || l < 0.18 || l > 0.9) continue;
    const key = Math.round(h / 20) % 18;
    const c = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 };
    c.n++; c.r += r; c.g += g; c.b += b;
    buckets.set(key, c);
  }
  const best = [...buckets.values()].sort((a, b) => b.n - a.n)[0];
  if (!best || best.n < 12) return null;
  return [best.r / best.n, best.g / best.n, best.b / best.n];
}

export async function pickColours({ logo, shotBuf }) {
  let rgb = null;
  const lb = await logoBuffer(logo).catch(() => null);
  if (lb) rgb = await brandColour(lb).catch(() => null);
  if (!rgb && shotBuf) rgb = await brandColour(shotBuf, 140).catch(() => null);
  if (!rgb && shotBuf) rgb = await brandColour(shotBuf).catch(() => null);
  if (!rgb) return null;
  const [h, s, l] = rgbToHsl(...rgb);
  // Accent: the brand colour, kept light enough to read on the dark pages.
  const accent = l < 0.42 ? hslToHex(h, Math.min(1, s), 0.5) : hex(...rgb);
  // Dark: a deep shade of the same colour for the About panel and the End page.
  const dark = hslToHex(h, Math.min(s, 0.38), 0.15);
  return { accent, dark };
}

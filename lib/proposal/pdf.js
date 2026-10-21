// Prints the proposal to PDF with headless Chrome (server only).
import { existsSync } from "node:fs";

export async function launch() {
  const puppeteer = (await import("puppeteer-core")).default;
  const local = process.env.CHROME_PATH || (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : "");
  if (local && !process.env.VERCEL) {
    return puppeteer.launch({ executablePath: local, args: ["--no-sandbox", "--font-render-hinting=none"], headless: true });
  }
  const chromium = (await import("@sparticuz/chromium")).default;
  return puppeteer.launch({
    executablePath: await chromium.executablePath(),
    args: [...chromium.args, "--font-render-hinting=none"],
    headless: true,
    defaultViewport: { width: 1920, height: 1080 },
  });
}

// Wait for the print page to say it's ready (fonts and pictures loaded). If that never comes,
// e.g. a font or a client's picture keeps loading, print anyway as long as the pages are there;
// otherwise fail with what went wrong.
export function watchErrors(page) {
  const errs = [];
  page.on("pageerror", (e) => errs.push(String((e && e.message) || e).slice(0, 200)));
  page.on("requestfailed", (r) => errs.push(`failed ${r.url().slice(0, 120)} ${(r.failure() && r.failure().errorText) || ""}`));
  return errs;
}
export async function waitReady(page, flag, selector, errs = []) {
  try {
    await page.waitForFunction(`window.${flag} === true`, { timeout: 20000, polling: 250 });
    return;
  } catch {}
  const info = await page.evaluate((sel) => ({
    url: location.href,
    content: document.querySelectorAll(sel).length,
    fonts: document.fonts ? document.fonts.status : "",
    images: Array.from(document.images).filter((i) => !i.complete).map((i) => i.src.slice(0, 120)),
  }), selector).catch((e) => ({ error: e.message }));
  console.warn("print page not ready", JSON.stringify(info), errs.slice(0, 5));
  if (info && info.content > 0) return; // the pages are there; print them
  throw new Error(`The print page didn't load (${JSON.stringify(info).slice(0, 300)}${errs.length ? "; " + errs.slice(0, 3).join("; ") : ""})`);
}

export async function renderPdf(proposal, origin, ctx = {}) {
  const browser = await launch();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    const errs = watchErrors(page);
    await page.evaluateOnNewDocument((data, c) => { window.__PROPOSAL__ = data; window.__PROPOSAL_CTX__ = c; }, proposal, ctx);
    await page.goto(`${origin}/proposals/print`, { waitUntil: "networkidle0", timeout: 45000 });
    await waitReady(page, "__PROPOSAL_READY__", ".sheet", errs);
    return Buffer.from(await page.pdf({ width: "1920px", height: "1080px", printBackground: true, preferCSSPageSize: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } }));
  } finally {
    await browser.close().catch(() => {});
  }
}

export { docPdfName as pdfName } from "../docs";

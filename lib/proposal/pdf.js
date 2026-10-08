// Prints the proposal to PDF with headless Chrome (server only).
import { existsSync } from "node:fs";

async function launch() {
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

export async function renderPdf(proposal, origin, ctx = {}) {
  const browser = await launch();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.evaluateOnNewDocument((data, c) => { window.__PROPOSAL__ = data; window.__PROPOSAL_CTX__ = c; }, proposal, ctx);
    await page.goto(`${origin}/proposals/print`, { waitUntil: "networkidle0", timeout: 45000 });
    await page.waitForFunction("window.__PROPOSAL_READY__ === true", { timeout: 30000 });
    return Buffer.from(await page.pdf({ width: "1920px", height: "1080px", printBackground: true, preferCSSPageSize: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } }));
  } finally {
    await browser.close().catch(() => {});
  }
}

export const pdfName = (p) => `Proposal - ${p.clientName || "Client"} - ${p.roleTitle || "Role"}.pdf`.replace(/[^\w &().,'-]+/g, "").trim();

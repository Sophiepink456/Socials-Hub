// Builds the proposal PDF by opening the print view in headless Chrome.
// On Vercel the browser comes from @sparticuz/chromium; locally it uses the
// Chromium in CHROME_PATH (or the Playwright copy if it's there).
import { existsSync } from "node:fs";
import { normalise } from "../../../../lib/proposal/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return new Response("Bad request", { status: 400 }); }
  const proposal = normalise(body && body.proposal);
  const origin = new URL(req.url).origin;

  let browser;
  try {
    browser = await launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.evaluateOnNewDocument((data) => { window.__PROPOSAL__ = data; }, proposal);
    await page.goto(`${origin}/proposals/print`, { waitUntil: "networkidle0", timeout: 45000 });
    await page.waitForFunction("window.__PROPOSAL_READY__ === true", { timeout: 30000 });
    const pdf = await page.pdf({ width: "1920px", height: "1080px", printBackground: true, preferCSSPageSize: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
    const name = `Proposal - ${proposal.clientName || "Client"} - ${proposal.roleTitle || "Role"}.pdf`.replace(/[^\w &().,'-]+/g, "");
    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${name}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("proposal pdf failed", e);
    return new Response("Could not build the PDF", { status: 500 });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

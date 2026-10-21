// Print an SLT document to PDF with headless Chrome. Nothing is stored: the PDF goes straight
// back to the browser that asked for it.
import { launch } from "../proposal/pdf";

const SIZES = {
  targets: { w: 1920, h: 1080 },
  induction: { w: 1123, h: 794 }, // A4 landscape at 96 dpi
};

export async function renderSltPdf(kind, data, origin) {
  const size = SIZES[kind];
  if (!size) throw new Error("Unknown document");
  const browser = await launch();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: size.w, height: size.h });
    await page.evaluateOnNewDocument((k, d) => { window.__SLT__ = { kind: k, data: d }; }, kind, data);
    await page.goto(`${origin}/slt/print`, { waitUntil: "networkidle0", timeout: 45000 });
    await page.waitForFunction("window.__SLT_READY__ === true", { timeout: 30000, polling: 250 });
    return Buffer.from(await page.pdf({ width: `${size.w}px`, height: `${size.h}px`, printBackground: true, preferCSSPageSize: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } }));
  } finally {
    await browser.close().catch(() => {});
  }
}

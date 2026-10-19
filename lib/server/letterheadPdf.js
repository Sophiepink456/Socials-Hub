// Print a Powered by Elevation (letterhead) document to PDF: the cover (no footer) and the body
// (with the "Powered by Elevation" footer bar on every page), joined together.
// Used by /api/letterhead/pdf and by the sign-off route (lib/server/proposals.js makePdf).
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { launch } from "../proposal/pdf";
import { normaliseDoc, brandOf } from "../letterhead/doc";

// Chrome's PDF margins take px, not pt (1pt = 4/3 px).
const pt = (n) => `${Math.round((n * 4) / 3 * 100) / 100}px`;

const footerUris = {};
async function footer(file) {
  if (!footerUris[file]) footerUris[file] = "data:image/png;base64," + (await readFile(path.join(process.cwd(), "public", "letterhead", file))).toString("base64");
  return footerUris[file];
}

async function printPart(browser, origin, doc, part) {
  const page = await browser.newPage();
  try {
    await page.evaluateOnNewDocument((d, p) => { window.__LETTERHEAD__ = d; window.__LETTERHEAD_PART__ = p; }, doc, part);
    await page.goto(`${origin}/letterhead/print`, { waitUntil: "networkidle0", timeout: 45000 });
    await page.waitForFunction("window.__LETTERHEAD_READY__ === true", { timeout: 30000 });
    if (part === "cover") {
      return await page.pdf({ format: "A4", printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
    }
    const bar = await footer(brandOf(doc).footerFile);
    return await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: pt(48), right: pt(48), bottom: pt(92), left: pt(48) },
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: `<style>html,body{margin:0!important;padding:0!important}#footer{padding:0!important}</style><div style="width:100%;height:${pt(92)};margin:0;padding:0;position:relative;-webkit-print-color-adjust:exact;">
        <img src="${bar}" style="position:absolute;left:0;bottom:0;width:100%;height:${pt(48)};display:block;" /></div>`,
    });
  } finally {
    await page.close().catch(() => {});
  }
}

export async function renderLetterheadPdf(input, origin) {
  const doc = normaliseDoc(input);
  if (!doc.blocks.length && !doc.cover.on) throw new Error("Nothing to print");
  const browser = await launch();
  try {
    const out = await PDFDocument.create();
    const parts = [...(doc.cover.on ? ["cover"] : []), ...(doc.blocks.length ? ["body"] : [])];
    for (const part of parts) {
      const src = await PDFDocument.load(await printPart(browser, origin, doc, part));
      const pages = await out.copyPages(src, src.getPageIndices());
      pages.forEach((p) => out.addPage(p));
    }
    out.setTitle((doc.cover.title || doc.fileName || "Document").replace(/\n/g, " – "));
    out.setAuthor("Elevation Recruitment Group");
    return Buffer.from(await out.save());
  } finally {
    await browser.close().catch(() => {});
  }
}

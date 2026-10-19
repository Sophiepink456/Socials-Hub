// Print a Powered by Elevation document to PDF (lib/server/letterheadPdf.js).
import { renderLetterheadPdf } from "../../../../lib/server/letterheadPdf";
import { normaliseDoc, pdfName } from "../../../../lib/letterhead/doc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return new Response("Bad request", { status: 400 }); }
  const doc = normaliseDoc(body && body.doc);
  if (!doc.blocks.length && !doc.cover.on) return new Response("Nothing to print", { status: 400 });
  try {
    const bytes = await renderLetterheadPdf(doc, new URL(req.url).origin);
    return new Response(bytes, {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${pdfName(doc)}"`, "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error("letterhead pdf failed", e);
    return new Response("Could not build the PDF", { status: 500 });
  }
}

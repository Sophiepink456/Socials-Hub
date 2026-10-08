// Download the proposal as a PDF (no saving).
import { normalise } from "../../../../lib/proposal/data";
import { renderPdf, pdfName } from "../../../../lib/proposal/pdf";
import { getSettings } from "../../../../lib/server/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return new Response("Bad request", { status: 400 }); }
  const proposal = normalise(body && body.proposal);
  try {
    const s = await getSettings();
    const pdf = await renderPdf(proposal, new URL(req.url).origin, { mediaLinks: s.mediaLinks });
    return new Response(pdf, {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${pdfName(proposal)}"`, "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error("proposal pdf failed", e);
    return new Response("Could not build the PDF", { status: 500 });
  }
}

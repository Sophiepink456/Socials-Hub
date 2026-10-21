import { siteOrigin } from "../../../../lib/server/origin";
// Download an SLT document as a PDF (the SLT password is checked in middleware.js).
import { renderSltPdf } from "../../../../lib/server/sltPdf";
import { normaliseTargets, targetsFileName } from "../../../../lib/slt/targets";
import { normaliseInduction, inductionFileName } from "../../../../lib/slt/induction";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const KINDS = {
  targets: [normaliseTargets, targetsFileName],
  induction: [normaliseInduction, inductionFileName],
};

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return new Response("Bad request", { status: 400 }); }
  const k = KINDS[body && body.kind];
  if (!k) return new Response("Unknown document", { status: 400 });
  const data = k[0](body.data);
  try {
    const bytes = await renderSltPdf(body.kind, data, siteOrigin(req));
    const name = k[1](data);
    return new Response(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${name.replace(/[^\x20-\x7e]/g, "")}"; filename*=UTF-8''${encodeURIComponent(name)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("slt pdf failed", e);
    return new Response("Could not build the PDF", { status: 500 });
  }
}

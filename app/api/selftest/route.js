// Health check for the image and PDF makers: can the server reach its own design files and print page?
// Open without signing in; it only reports status codes, nothing stored.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const maxDuration = 120;

export async function GET(req) {
  const { origin, searchParams } = new URL(req.url);
  if (searchParams.get("render")) {
    try {
      const { GET: render } = await import("../render/[id]/route");
      const r = await render(new Request(`${origin}/api/render/${searchParams.get("render")}?sample=1`), { params: { id: searchParams.get("render") } });
      const buf = await r.arrayBuffer();
      return Response.json({ render: r.status, type: r.headers.get("content-type"), bytes: buf.byteLength, text: r.status >= 400 ? new TextDecoder().decode(buf).slice(0, 500) : "" });
    } catch (e) { return Response.json({ renderError: String(e && e.stack || e).slice(0, 1500) }); }
  }
  if (searchParams.get("lh")) {
    const t = Date.now();
    try {
      const { renderLetterheadPdf } = await import("../../../lib/server/letterheadPdf");
      const pdf = await renderLetterheadPdf({ kind: "letterhead", brand: searchParams.get("lh"), cover: { title: "Self test" }, blocks: [{ type: "p", text: "Hello" }] }, origin);
      return Response.json({ lhBytes: pdf.length, ms: Date.now() - t });
    } catch (e) { return Response.json({ lhError: String(e && e.stack || e).slice(0, 1500), ms: Date.now() - t }); }
  }
  if (searchParams.get("store")) {
    try {
      const st = await import("../../../lib/server/store");
      const p = `selftest/${st.randomId(4)}.txt`;
      const url = await st.putFile(p, Buffer.from("ok"), "text/plain");
      const back = await st.readFile(p);
      await st.removeFiles([p]).catch(() => {});
      const { getSettings } = await import("../../../lib/server/settings");
      const s = await getSettings();
      return Response.json({ put: url, readBack: back ? String(back.length || back.byteLength || "yes") : null, settings: !!s, proofreaders: (String(s.proofreaders || "").split(/[,;\s]+/).filter(Boolean).length), zapier: !!process.env.ZAPIER_HOOK_URL });
    } catch (e) { return Response.json({ storeError: String(e && e.stack || e).slice(0, 1500) }); }
  }
  if (searchParams.get("pdf")) {
    const t = Date.now();
    try {
      const { renderPdf } = await import("../../../lib/proposal/pdf");
      const { sampleProposal } = await import("../../../lib/proposal/data");
      const pdf = await renderPdf(sampleProposal(), origin);
      return Response.json({ pdfBytes: pdf.length || pdf.byteLength, ms: Date.now() - t });
    } catch (e) { return Response.json({ pdfError: String(e && e.stack || e).slice(0, 1500), ms: Date.now() - t }); }
  }
  const out = { origin, host: req.headers.get("host"), xfh: req.headers.get("x-forwarded-host") };
  for (const p of ["/designs/job-cover/overlay.png", "/proposals/print", "/letterhead/footer.png"]) {
    try {
      const r = await fetch(origin + p, { redirect: "manual", cache: "no-store" });
      out[p] = `${r.status} ${r.headers.get("content-type") || ""} ${r.headers.get("location") || ""}`.trim();
      if (r.status >= 300) out[p + " body"] = (await r.text()).slice(0, 300);
    } catch (e) { out[p] = "ERR " + (e && e.message) + " " + (e && e.cause && e.cause.code || ""); }
  }
  try {
    const { ImageResponse } = await import("next/og");
    const img = new ImageResponse({ type: "div", props: { style: { width: 10, height: 10, background: "red", display: "flex" } } }, { width: 10, height: 10 });
    out.og = (await img.arrayBuffer()).byteLength;
  } catch (e) { out.og = "ERR " + (e && e.message); }
  return Response.json(out);
}

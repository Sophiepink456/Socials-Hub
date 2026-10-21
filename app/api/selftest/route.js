// Health check for the image and PDF makers: can the server reach its own design files and print page?
// Open without signing in; it only reports status codes, nothing stored.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const { origin } = new URL(req.url);
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

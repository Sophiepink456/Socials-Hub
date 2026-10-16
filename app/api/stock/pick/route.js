// Use a Pixabay photo: download it, crop it to 1080 x 1350 and store it.
// POST { id }  ->  { url: "/api/files/assets/stock-pixabay-<id>.jpg" }
import sharp from "sharp";
import { putFile, hasStore } from "../../../../lib/server/store";
import { stockPath } from "../../../../lib/stock";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const fail = (error, status = 502) => Response.json({ error }, { status });

export async function POST(req) {
  const key = process.env.PIXABAY_API_KEY || "";
  if (!key) return fail("Stock photo search isn't set up yet (PIXABAY_API_KEY is missing in Vercel).", 503);
  if (!hasStore()) return fail("Storage isn't switched on yet.", 503);

  const { id } = await req.json().catch(() => ({}));
  if (!/^\d{1,12}$/.test(String(id || ""))) return fail("That photo couldn't be found.", 400);

  try {
    // Look the photo up again so its download links are fresh, then fetch
    // the image straight away (Pixabay's links are short-lived).
    const res = await fetch(`https://pixabay.com/api/?${new URLSearchParams({ key, id: String(id) })}`, { cache: "no-store" });
    if (!res.ok) return fail("That photo couldn't be loaded. Try another.");
    const hit = ((await res.json()).hits || [])[0];
    if (!hit) return fail("That photo couldn't be found.", 404);

    const preview = String(hit.previewURL || "");
    const candidates = [
      hit.largeImageURL,
      preview.replace(/_150\.(\w+)$/, "_1280.$1"),
      hit.webformatURL && hit.webformatURL.replace("_640.", "_960."),
      hit.webformatURL,
    ].filter((u) => typeof u === "string" && /^https:\/\/(cdn\.)?pixabay\.com\//.test(u));

    let img = null;
    for (const u of candidates) {
      try {
        const r = await fetch(u, { cache: "no-store" });
        if (r.ok && (r.headers.get("content-type") || "").startsWith("image/")) { img = Buffer.from(await r.arrayBuffer()); break; }
      } catch {}
    }
    if (!img) return fail("That photo couldn't be loaded. Try another.");

    const out = await sharp(img, { failOn: "none" }).rotate()
      .resize(1080, 1350, { fit: "cover", position: sharp.strategy.attention })
      .jpeg({ quality: 88 }).toBuffer();
    const url = await putFile(stockPath(id), out, "image/jpeg");
    return Response.json({ url });
  } catch (e) {
    console.error("stock pick failed", e);
    return fail("That photo couldn't be loaded. Try another.");
  }
}

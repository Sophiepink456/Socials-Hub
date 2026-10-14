// Store a picture (sent as a data URL from the browser) at a sharp size and return its link.
import sharp from "sharp";
import { putFile, randomId, hasStore } from "../../../../lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req) {
  if (!hasStore()) return Response.json({ error: "Storage isn't switched on yet." }, { status: 503 });
  try {
    const { dataUrl } = await req.json();
    const m = /^data:image\/[a-z+.-]+;base64,(.+)$/i.exec(String(dataUrl || ""));
    if (!m) return Response.json({ error: "That doesn't look like a picture." }, { status: 400 });
    const out = await sharp(Buffer.from(m[1], "base64"), { failOn: "none" }).rotate()
      .resize(2400, 2400, { fit: "inside", withoutEnlargement: true }).flatten({ background: "#ffffff" }).jpeg({ quality: 90 }).toBuffer();
    return Response.json({ url: await putFile(`assets/cp-${randomId(10)}.jpg`, out, "image/jpeg") });
  } catch (e) {
    console.error("image upload failed", e);
    return Response.json({ error: "Couldn't upload that picture." }, { status: 500 });
  }
}

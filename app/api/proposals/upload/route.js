// Appendix documents (PDF, Word, etc.), up to 4 MB each.
import { putFile, randomId, hasStore } from "../../../../lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  if (!hasStore()) return Response.json({ error: "Storage isn't switched on yet." }, { status: 503 });
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") return Response.json({ error: "No file" }, { status: 400 });
    if (file.size > 4 * 1024 * 1024) return Response.json({ error: "Please keep documents under 4 MB." }, { status: 413 });
    const name = String(file.name || "document").replace(/[^\w.() -]+/g, "").replace(/\s+/g, " ").trim() || "document";
    const url = await putFile(`appendix/${randomId(12)}/${name}`, Buffer.from(await file.arrayBuffer()), file.type || "application/octet-stream");
    return Response.json({ url, name });
  } catch (e) {
    console.error("upload failed", e);
    return Response.json({ error: "Upload failed." }, { status: 500 });
  }
}

// Serves stored images, PDFs and appendix documents from Vercel Blob.
// Only these folders are readable; proposal records and settings are not.
import { readFile } from "../../../../lib/server/store";

export const runtime = "nodejs";

const ALLOWED = [/^assets\/[\w.-]+$/, /^proposals\/[a-f0-9]{32}\/pdf\/[\w.-]+\.pdf$/, /^appendix\/[a-f0-9]{16,}\/[^/]+$/];

export async function GET(req, { params }) {
  const pathname = (params.path || []).map(decodeURIComponent).join("/");
  if (!ALLOWED.some((r) => r.test(pathname))) return new Response("Not found", { status: 404 });
  const f = await readFile(pathname).catch(() => null);
  if (!f) return new Response("Not found", { status: 404 });
  const name = pathname.split("/").pop();
  return new Response(f.stream, {
    headers: {
      "Content-Type": f.contentType || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
      ...(name.endsWith(".pdf") ? { "Content-Disposition": `inline; filename="${name}"` } : {}),
    },
  });
}

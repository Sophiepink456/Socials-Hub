// Read an uploaded document (Word, PDF, text) into letterhead content.
import { parseDocx, parsePdf, parseText, suggestCover, dropCoverTitle } from "../../../../lib/server/letterhead";
import { normaliseDoc, textOf } from "../../../../lib/letterhead/doc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const fail = (error, status = 400) => Response.json({ error }, { status });

export async function POST(req) {
  let file;
  try { file = (await req.formData()).get("file"); } catch { return fail("Upload a document to start."); }
  if (!file || typeof file === "string") return fail("Upload a document to start.");
  if (file.size > 4 * 1024 * 1024) return fail("Please keep documents under 4 MB.", 413);

  const name = String(file.name || "document");
  const ext = (name.match(/\.([a-z0-9]+)$/i) || [, ""])[1].toLowerCase();
  const buf = Buffer.from(await file.arrayBuffer());

  try {
    let blocks;
    let cover = {};
    if (ext === "docx" || buf.subarray(0, 2).toString() === "PK") {
      blocks = await parseDocx(buf);
      cover = await suggestCover(blocks);
    } else if (ext === "pdf" || buf.subarray(0, 4).toString() === "%PDF") {
      ({ blocks, cover } = await parsePdf(buf));
    } else if (["txt", "md", "markdown", "text"].includes(ext)) {
      blocks = parseText(buf.toString("utf8"));
      cover = await suggestCover(blocks);
    } else if (ext === "doc" || ext === "rtf" || ext === "odt" || ext === "pages") {
      return fail("That file type can't be read. In Word, use File → Save As → Word Document (.docx), or save it as a PDF, then upload that.");
    } else {
      return fail("Upload a Word document (.docx), a PDF or a text file.");
    }
    if (!blocks.length) return fail("Couldn't find any text in that document. If it's a scanned PDF, upload the Word version instead.");
    // No title found? Use the document's opening heading.
    const title = String(cover.title || "").trim() || (/^h[12]$/.test(blocks[0].type) ? textOf(blocks[0].html) : "");
    const doc = normaliseDoc({
      cover: { on: true, title, forLines: cover.forLines, byLines: cover.byLines, confidential: true },
      blocks: dropCoverTitle(blocks, title),
      fileName: name,
    });
    return Response.json({ doc });
  } catch (e) {
    console.error("letterhead parse failed", e);
    return fail(e.message && !/JSON|Unexpected/.test(e.message) ? e.message : "Couldn't read that document. Try saving it again, or upload it as a Word document.", 500);
  }
}

// Marketing Request Form: attach one file to the item just made (needs that item's ticket).
import { addFile, checkTicket } from "../../../../lib/server/monday";
import { MAX_FILE_MB } from "../../../../lib/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req) {
  let fd;
  try { fd = await req.formData(); } catch { return Response.json({ error: "That file is too big to send." }, { status: 413 }); }
  const item = String(fd.get("item") || "");
  const file = fd.get("file");
  if (!/^\d+$/.test(item) || !checkTicket(item, fd.get("ticket"))) return Response.json({ error: "That request has expired." }, { status: 403 });
  if (!file || typeof file === "string") return Response.json({ error: "No file." }, { status: 400 });
  if (file.size > MAX_FILE_MB * 1024 * 1024) return Response.json({ error: `${file.name} is over ${MAX_FILE_MB} MB.` }, { status: 413 });
  try {
    await addFile(item, file);
    return Response.json({ ok: true });
  } catch (e) {
    console.error("monday file failed", e);
    return Response.json({ error: `Couldn’t attach ${file.name}: ${e.message}` }, { status: 502 });
  }
}

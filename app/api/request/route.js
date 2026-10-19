// Marketing Request Form: make the item on the monday.com board.
import { cleanRequest } from "../../../lib/request";
import { createRequestItem, fileTicket } from "../../../lib/server/monday";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  let body = {};
  try { body = await req.json(); } catch {}
  const { data, error } = cleanRequest(body);
  if (error) return Response.json({ error }, { status: 400 });
  try {
    const item = await createRequestItem(data);
    return Response.json({ id: item.id, url: item.url, ticket: fileTicket(item.id) });
  } catch (e) {
    console.error("monday request failed", e);
    return Response.json({ error: `Couldn’t send your request to monday.com. ${e.message}` }, { status: 502 });
  }
}

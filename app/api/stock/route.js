// Stock photo search for the design editor (Pexels).
// GET /api/stock?q=warehouse&page=1
// Needs PEXELS_API_KEY in Vercel (free key from https://www.pexels.com/api/).
import { isStockPhoto, stockSrc } from "../../../lib/stock";

export const dynamic = "force-dynamic";

const PER_PAGE = 24;

export async function GET(req) {
  const key = process.env.PEXELS_API_KEY || "";
  if (!key) return Response.json({ error: "Stock photo search isn't set up yet (PEXELS_API_KEY is missing in Vercel)." }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const q = String(searchParams.get("q") || "").trim().slice(0, 80);
  const page = Math.max(1, Math.min(50, parseInt(searchParams.get("page") || "1", 10) || 1));
  if (!q) return Response.json({ photos: [], more: false });

  const url = `https://api.pexels.com/v1/search?${new URLSearchParams({
    query: q, orientation: "portrait", per_page: String(PER_PAGE), page: String(page),
  })}`;

  try {
    const res = await fetch(url, { headers: { Authorization: key }, cache: "no-store" });
    if (res.status === 429) return Response.json({ error: "Too many searches this hour. Try again shortly." }, { status: 429 });
    if (!res.ok) return Response.json({ error: "Stock photo search didn't work. Try again in a moment." }, { status: 502 });
    const j = await res.json();
    const photos = (j.photos || [])
      .map((p) => ({ id: p.id, src: String((p.src && p.src.original) || ""), alt: p.alt || "", by: p.photographer || "" }))
      .filter((p) => isStockPhoto(p.src))
      .map((p) => ({ ...p, thumb: stockSrc(p.src, 240, 300) }));
    return Response.json({ photos, more: !!j.next_page });
  } catch {
    return Response.json({ error: "Stock photo search didn't work. Try again in a moment." }, { status: 502 });
  }
}

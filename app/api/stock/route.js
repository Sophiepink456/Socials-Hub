// Stock photo search for the design editor (Pixabay).
// GET /api/stock?q=warehouse&page=1
// Needs PIXABAY_API_KEY in Vercel (free key from https://pixabay.com/api/docs/).
export const dynamic = "force-dynamic";

const PER_PAGE = 24;
const CDN = /^https:\/\/cdn\.pixabay\.com\/photo\/[\w/.-]+_150\.(jpe?g|png)$/i;

export async function GET(req) {
  const key = process.env.PIXABAY_API_KEY || "";
  if (!key) return Response.json({ error: "Stock photo search isn't set up yet (PIXABAY_API_KEY is missing in Vercel)." }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const q = String(searchParams.get("q") || "").trim().slice(0, 100);
  const page = Math.max(1, Math.min(20, parseInt(searchParams.get("page") || "1", 10) || 1));
  if (!q) return Response.json({ photos: [], more: false });

  const url = `https://pixabay.com/api/?${new URLSearchParams({
    key, q, image_type: "photo", orientation: "vertical", safesearch: "true",
    per_page: String(PER_PAGE), page: String(page),
  })}`;

  try {
    const res = await fetch(url, { next: { revalidate: 43200 } }); // cached to stay inside Pixabay's rate limit
    if (res.status === 429) return Response.json({ error: "Too many searches just now. Try again in a minute." }, { status: 429 });
    if (!res.ok) return Response.json({ error: "Stock photo search didn't work. Try again in a moment." }, { status: 502 });
    const j = await res.json();
    // Thumbnails come from Pixabay's public image CDN (the preview links
    // the API documents as fine for showing search results).
    const photos = (j.hits || [])
      .filter((p) => CDN.test(String(p.previewURL || "")))
      .map((p) => ({
        id: p.id,
        thumb: p.previewURL.replace(/_150\.(\w+)$/, "_340.$1"),
        small: p.previewURL,
        alt: p.tags || "",
        by: p.user || "",
      }));
    return Response.json({ photos, more: page * PER_PAGE < (j.totalHits || 0) });
  } catch {
    return Response.json({ error: "Stock photo search didn't work. Try again in a moment." }, { status: 502 });
  }
}

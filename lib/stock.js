// Stock photos from Pexels (free for commercial use, no credit needed on the
// post). Consultants search from the design editor; the chosen photo's
// address is passed to the renderer like one of our own photos.

// Only plain Pexels photo addresses are accepted, never anything else.
const STOCK = /^https:\/\/images\.pexels\.com\/photos\/\d+\/[\w.-]+\.(jpe?g|png|webp)$/i;

export const isStockPhoto = (u) => typeof u === "string" && STOCK.test(u);

// Pexels crops and resizes on its own servers, so the slide gets a
// 1080 x 1350 version rather than the full-size original.
export const stockSrc = (u, w = 1080, h = 1350) =>
  `${u}?auto=compress&cs=tinysrgb&fit=crop&w=${w}&h=${h}`;

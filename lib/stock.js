// Stock photos from Pixabay (free for commercial use, no credit needed on the
// post). Consultants search from the design editor; the chosen photo's
// address is passed to the renderer like one of our own photos.

// Only Pixabay's own image addresses are accepted, never anything else.
// (Pixabay hands out temporary /get/ links that last about 24 hours.)
const STOCK = /^https:\/\/pixabay\.com\/get\/[\w-]+\.(jpe?g|png)$/i;

export const isStockPhoto = (u) => typeof u === "string" && STOCK.test(u);

// The renderers crop to 1080 x 1350 themselves (object-fit: cover).
export const stockSrc = (u) => u;

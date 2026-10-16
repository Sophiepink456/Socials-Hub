// Stock photos from Pixabay (free for commercial use, no credit needed on the
// post). Consultants search from the design editor. When one is picked, the
// server downloads it, crops it to 1080 x 1350 and keeps it in our own
// storage (Pixabay doesn't allow its links to be used directly, and they
// expire). Unused copies are cleared by the monthly picture tidy-up.

// The stored copy of Pixabay photo `id`.
export const stockPath = (id) => `assets/stock-pixabay-${id}.jpg`;

// Only our stored stock copies are accepted by the renderer.
const STOCK = /^\/api\/files\/assets\/stock-pixabay-\d+\.jpg$/;
export const isStockPhoto = (u) => typeof u === "string" && STOCK.test(u);

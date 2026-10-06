import manifest from "./manifest.json";
import { slug } from "./brand";

// The photos a design should draw from, given the chosen division.
// A folder named after the division wins; otherwise "general".
export function photoPool(designId, division) {
  const pools = (manifest.photos || {})[designId] || {};
  const own = pools[slug(division)];
  if (own && own.length) return own;
  return pools.general || [];
}

export function randomPhoto(designId, division, avoid) {
  const pool = photoPool(designId, division);
  if (!pool.length) return "";
  if (pool.length === 1) return pool[0];
  let p;
  do { p = pool[Math.floor(Math.random() * pool.length)]; } while (p === avoid);
  return p;
}

export const HEADSHOTS = manifest.headshots || [];

export function headshotFor(name) {
  const n = String(name || "").trim().toLowerCase();
  const h = HEADSHOTS.find((x) => x.name.toLowerCase() === n);
  return h ? h.path : "";
}

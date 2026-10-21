// The address the server uses to load its own pages and files (PDF print pages, design artwork)
// and to put in email links. Always the public production address: Vercel's other addresses for
// the same site (e.g. marketing-hub-git-main-….vercel.app) sit behind a Vercel login, so the PDF
// and image makers couldn't open them. SITE_URL overrides it; locally it's the address in use.
export function siteOrigin(req) {
  const env = process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "");
  return env ? env.replace(/\/+$/, "") : new URL(req.url).origin;
}

// The whole hub sits behind a password. Signed-in browsers carry a signed cookie (lib/gate.js).
import { NextResponse } from "next/server";
import { GATE_COOKIE, verifyGateToken } from "./lib/gate";

// Open without signing in:
// - the sign-in page itself, and Next.js's own files
// - static design files (fonts, template images, headshots) the PDF and image makers load
// - /api/files/…: stored PDFs and pictures, fetched by email attachments and the PDF maker
//   (each needs its exact, unguessable address)
// - /proposals/print: the page the PDF maker prints (it only shows data handed to it directly)
// - the weekly storage tidy, which has its own check
const OPEN = [/^\/login$/, /^\/api\/login$/, /^\/_next\//, /^\/favicon/, /^\/proposal\//, /^\/designs\//, /^\/headshots\//, /^\/elevation-logo\.png$/,
  /^\/api\/files\//, /^\/proposals\/print$/, /^\/api\/cron\//];

export async function middleware(req) {
  const { pathname, search } = req.nextUrl;
  if (OPEN.some((r) => r.test(pathname))) return NextResponse.next();
  if (await verifyGateToken(req.cookies.get(GATE_COOKIE)?.value)) return NextResponse.next();
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Please sign in to the Marketing Hub." }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = { matcher: "/((?!_next/static|_next/image).*)" };

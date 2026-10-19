// The whole hub sits behind a password. Signed-in browsers carry a signed cookie (lib/gate.js).
import { NextResponse } from "next/server";
import { GATE_COOKIE, verifyGateToken, SLT_COOKIE, verifySltToken } from "./lib/gate";

// Open without signing in:
// - the sign-in page itself, and Next.js's own files
// - static design files (fonts, template images, letterhead artwork, headshots) the PDF and image makers load
// - /api/files/…: stored PDFs and pictures, fetched by email attachments and the PDF maker
//   (each needs its exact, unguessable address)
// - /proposals/print and /letterhead/print: the pages the PDF maker prints (they only show data handed to them directly)
//   and /slt/print (the same for SLT documents), plus the SLT artwork (stock photos and shapes only)
// - the weekly storage tidy, which has its own check
const OPEN = [/^\/slt\/print$/, /^\/slt\/(targets|induction)\/[\w.-]+\.(jpg|png|svg)$/, /^\/slt\/photos\/(t\/)?[a-f0-9]+\.jpg$/, /^\/login$/, /^\/api\/login$/, /^\/_next\//, /^\/favicon/, /^\/proposal\//, /^\/designs\//, /^\/headshots\//, /^\/elevation-logo\.png$/,
  /^\/api\/files\//, /^\/proposals\/print$/, /^\/letterhead\/print$/, /^\/letterhead\/[\w.-]+\.(jpg|png|svg)$/, /^\/api\/cron\//];

export async function middleware(req) {
  const { pathname, search } = req.nextUrl;
  if (OPEN.some((r) => r.test(pathname))) return NextResponse.next();
  if (await verifyGateToken(req.cookies.get(GATE_COOKIE)?.value)) {
    // The SLT folder needs its own password too (the /slt page itself asks for it).
    const slt = /^\/slt\/./.test(pathname) || /^\/api\/slt\/(?!login$)/.test(pathname);
    if (!slt || (await verifySltToken(req.cookies.get(SLT_COOKIE)?.value))) return NextResponse.next();
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Please unlock the SLT folder first." }, { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = "/slt";
    url.search = "";
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Please sign in to the Marketing Hub." }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = { matcher: "/((?!_next/static|_next/image).*)" };

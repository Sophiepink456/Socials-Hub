// "Saved Docs": each person's own signed-off proposals and candidate packs (sent back to them).
// Private to that person: there are no logins, so each person gets a private link, emailed
// to their work address. The link carries their email plus a signature only the hub can make,
// so it can't be guessed or changed to open someone else's docs.
import crypto from "node:crypto";
import { saveJson, loadLatestJson, randomId, hasStore } from "./store";
import { listRecords } from "./proposals";
import { sendEmail, emailHtml } from "./mail";

const norm = (e) => String(e || "").trim().toLowerCase();
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let secretCache = null;
async function secret() {
  if (secretCache) return secretCache;
  if (process.env.SAVED_DOCS_SECRET) return (secretCache = process.env.SAVED_DOCS_SECRET);
  if (!hasStore()) return (secretCache = "local-only");
  const s = await loadLatestJson("secrets/saved-docs").catch(() => null);
  if (s && s.key) return (secretCache = s.key);
  const key = randomId(32);
  await saveJson("secrets/saved-docs", { key, createdAt: new Date().toISOString() });
  // Read back the newest in case two requests made one at the same time.
  const back = await loadLatestJson("secrets/saved-docs").catch(() => null);
  return (secretCache = (back && back.key) || key);
}

const sign = async (email) => crypto.createHmac("sha256", await secret()).update(norm(email)).digest("base64url").slice(0, 32);

export async function tokenFor(email) {
  return `${Buffer.from(norm(email)).toString("base64url")}.${await sign(email)}`;
}

export async function emailFromToken(token) {
  const [a, b] = String(token || "").split(".");
  if (!a || !b) return null;
  let email;
  try { email = Buffer.from(a, "base64url").toString("utf8"); } catch { return null; }
  if (!EMAIL.test(email)) return null;
  const want = await sign(email);
  return want.length === b.length && crypto.timingSafeEqual(Buffer.from(want), Buffer.from(b)) ? norm(email) : null;
}

export const savedDocsLink = async (origin, email) => `${origin}/saved?t=${await tokenFor(email)}`;

// Whose docs: the person who submitted it, and the consultant(s) named on it.
const owners = (r) => [r.submittedBy && r.submittedBy.email, r.data.c1 && r.data.c1.email, r.data.twoConsultants && r.data.c2 && r.data.c2.email].map(norm).filter(Boolean);

export async function myDocs(email) {
  const me = norm(email);
  const recs = await listRecords(2000).catch(() => []);
  const docs = recs.filter((r) => r.status === "sent" && r.pdf && owners(r).includes(me)).map((r) => ({
    id: r.id, kind: r.data.kind === "candidate" ? "candidate" : "proposal",
    title: `${r.data.clientName || "Client"} – ${r.data.roleTitle || "Role"}`, pdf: r.pdf, pdfName: r.pdfName,
    date: ((r.history || []).filter((h) => /Sent to consultant/.test(h.action)).pop() || {}).at || r.updatedAt || r.createdAt,
  })).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return { email: me, proposals: docs.filter((d) => d.kind === "proposal"), packs: docs.filter((d) => d.kind === "candidate") };
}

// "Email me my link". Always answers the same way, so it can't be used to find out who has docs.
export async function emailLink(email, origin) {
  const e = norm(email);
  if (!EMAIL.test(e)) throw new Error("That doesn’t look like an email address.");
  await sendEmail({
    to: e,
    subject: "Your Saved Docs link",
    html: emailHtml("Your Saved Docs", [
      "Here’s your private link to your Saved Docs on the Marketing Hub: every proposal and candidate pack of yours once it’s been signed off.",
      "Keep this email. The link only works for you, so please don’t forward it.",
    ], { href: await savedDocsLink(origin, e), label: "Open my Saved Docs" }),
  });
}


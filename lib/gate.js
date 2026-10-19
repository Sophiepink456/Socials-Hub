// Site-wide password (a stop-gap until Microsoft sign-in). Works in middleware (Edge) and routes.
//
// The password: SITE_PASSWORD in Vercel's environment variables if it's set, otherwise the
// built-in one whose scrambled form is below (this code is public, so only the scrambled form is
// kept here). Changing SITE_PASSWORD signs everyone out.
// Signing in sets a cookie that's signed with a server-only secret, valid for 30 days.

export const GATE_COOKIE = "hub_gate";
export const GATE_DAYS = 30;
const BUILT_IN = "pbkdf2-sha256$310000$pl8SsmNrj4AW0-d28v-kAg$ZBKfI2VcYbnCrgrlfsBDRwJNSVuTLKQOypGOpgNY-vQ";

const enc = new TextEncoder();
const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64url = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));

function secret() {
  const env = process.env;
  return env.SITE_GATE_SECRET || [env.SETTINGS_PASSCODE, env.BLOB_READ_WRITE_TOKEN, env.BLOB_STORE_ID, env.ANTHROPIC_API_KEY, env.ZAPIER_HOOK_URL].filter(Boolean).join("|") || "local-dev-only";
}
// Which password is in force, so changing it makes old sign-ins stop working.
const passwordVersion = () => (process.env.SITE_PASSWORD ? "env:" + process.env.SITE_PASSWORD : BUILT_IN);

async function hmac(data) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

export async function makeGateToken() {
  const exp = Date.now() + GATE_DAYS * 86400000;
  return `${exp}.${await hmac(`gate:${exp}:${passwordVersion()}`)}`;
}

export async function verifyGateToken(token) {
  const [exp, sig] = String(token || "").split(".");
  if (!exp || !sig || !(Number(exp) > Date.now())) return false;
  const want = await hmac(`gate:${exp}:${passwordVersion()}`);
  if (want.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < want.length; i++) diff |= want.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}

export async function checkSitePassword(pw) {
  const given = String(pw || "");
  if (!given) return false;
  if (process.env.SITE_PASSWORD) {
    // Compare scrambled forms so the check takes the same time whatever's typed.
    const a = new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(given)));
    const b = new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(process.env.SITE_PASSWORD)));
    return a.every((x, i) => x === b[i]);
  }
  const [, iters, salt, hash] = BUILT_IN.split("$");
  const key = await crypto.subtle.importKey("raw", enc.encode(given), "PBKDF2", false, ["deriveBits"]);
  const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: fromB64url(salt), iterations: Number(iters) }, key, 256));
  const want = fromB64url(hash);
  let diff = bits.length ^ want.length;
  for (let i = 0; i < Math.min(bits.length, want.length); i++) diff |= bits[i] ^ want[i];
  return diff === 0;
}

// ---- SLT folder: a second password on top of the hub one ----------------------------
// The SLT password: SLT_PASSWORD in Vercel's environment variables if it's set, otherwise the
// built-in one below (only its scrambled form is kept here). Unlocking lasts 12 hours on that
// browser, or until "Lock" is pressed; changing the password locks everyone out.
export const SLT_COOKIE = "slt_gate";
export const SLT_HOURS = 12;
const SLT_BUILT_IN = "pbkdf2-sha256$310000$wWXm7_ccmXZlxqL6ZKnc1Q$5M-zFcoW62WMOd7zTW5SrPzuYvakAtfcdtfmMjelCMg";
const sltVersion = () => (process.env.SLT_PASSWORD ? "env:" + process.env.SLT_PASSWORD : SLT_BUILT_IN);

export async function makeSltToken() {
  const exp = Date.now() + SLT_HOURS * 3600000;
  return `${exp}.${await hmac(`slt:${exp}:${sltVersion()}`)}`;
}

export async function verifySltToken(token) {
  const [exp, sig] = String(token || "").split(".");
  if (!exp || !sig || !(Number(exp) > Date.now())) return false;
  const want = await hmac(`slt:${exp}:${sltVersion()}`);
  if (want.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < want.length; i++) diff |= want.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}

async function matches(given, plain, hashed) {
  if (!given) return false;
  if (plain) {
    const a = new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(given)));
    const b = new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(plain)));
    return a.every((x, i) => x === b[i]);
  }
  const [, iters, salt, hash] = hashed.split("$");
  const key = await crypto.subtle.importKey("raw", enc.encode(given), "PBKDF2", false, ["deriveBits"]);
  const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: fromB64url(salt), iterations: Number(iters) }, key, 256));
  const want = fromB64url(hash);
  let diff = bits.length ^ want.length;
  for (let i = 0; i < Math.min(bits.length, want.length); i++) diff |= bits[i] ^ want[i];
  return diff === 0;
}

export const checkSltPassword = (pw) => matches(String(pw || ""), process.env.SLT_PASSWORD, SLT_BUILT_IN);

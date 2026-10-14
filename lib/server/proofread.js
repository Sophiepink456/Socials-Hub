// UK English spelling and grammar check for the proposal's text fields.
import { askClaude, parseJson } from "./claude";

// Compare text ignoring curly/straight quote and spacing differences.
const norm = (s) => String(s || "").replace(/[‘’‚‛′]/g, "'").replace(/[“”„‟″]/g, '"').replace(/[–—]/g, "-").replace(/\s+/g, " ");

// Find `find` in `text` even if Claude changed quotes or spaces; return the exact text as it
// appears in the field so the one-click fix can replace it.
function locate(text, find) {
  if (text.includes(find)) return find;
  const t = norm(text), f = norm(find).trim();
  if (!f) return null;
  const i = t.indexOf(f);
  if (i < 0) return null;
  // Map the position in the normalised text back to the original.
  let oi = 0, ni = 0;
  const map = [];
  while (oi < text.length) {
    map[ni] = oi;
    if (/\s/.test(text[oi])) { while (oi + 1 < text.length && /\s/.test(text[oi + 1])) oi++; }
    oi++; ni++;
  }
  map[ni] = text.length;
  const start = map[i], end = map[i + f.length];
  return start != null && end != null ? text.slice(start, end) : null;
}

export async function proofread(fields) {
  const entries = Object.entries(fields).filter(([, v]) => String(v || "").trim());
  if (!entries.length) return [];
  const listing = entries.map(([k, v]) => `<field name="${k}">\n${v}\n</field>`).join("\n");
  const ask = () => askClaude({
    system: "You are a meticulous UK English proofreader for a recruitment company's client proposals. You only flag real spelling mistakes, grammar mistakes, typos, wrong words, missing or doubled words, and US spellings that should be UK (e.g. organization → organisation). You do not rewrite for style, tone or length. You leave names, job titles, company names, numbers and brand terms alone unless clearly misspelled.",
    content: [{ type: "text", text: `${listing}\n\nList every mistake. "find" must be copied exactly from the field (a few words of context is fine so it is unique); "replace" is the corrected version of exactly that text. Reply with JSON only, no other text: {"issues":[{"field":"name","find":"...","replace":"...","why":"short reason"}]}. If there are none, reply {"issues":[]}.` }],
    maxTokens: 8000,
  });
  let j = null, lastErr;
  for (let attempt = 0; attempt < 2 && !j; attempt++) {
    try {
      const reply = await ask();
      const t = String(reply).replace(/^```(?:json)?\s*|\s*```$/g, "");
      j = parseJson(t);
    } catch (e) { lastErr = e; console.error("proofread attempt failed", e.message); }
  }
  if (!j) throw lastErr || new Error("The check didn't work this time. Try again.");
  const byKey = Object.fromEntries(entries);
  const out = [];
  for (const x of j.issues || []) {
    if (!x || byKey[x.field] == null || !x.find || x.find === x.replace) continue;
    const exact = locate(String(byKey[x.field]), String(x.find));
    if (!exact) { console.warn("proofread: couldn't place", x.field, x.find); continue; }
    out.push({ ...x, find: exact });
  }
  return out;
}

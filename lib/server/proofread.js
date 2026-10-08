// UK English spelling and grammar check for the proposal's text fields.
import { askClaude, parseJson } from "./claude";

export async function proofread(fields) {
  const entries = Object.entries(fields).filter(([, v]) => String(v || "").trim());
  if (!entries.length) return [];
  const listing = entries.map(([k, v]) => `<field name="${k}">\n${v}\n</field>`).join("\n");
  const reply = await askClaude({
    system: "You are a meticulous UK English proofreader for a recruitment company's client proposals. You only flag real spelling mistakes, grammar mistakes, typos, wrong words, missing or doubled words, and US spellings that should be UK (e.g. organization → organisation). You do not rewrite for style, tone or length. You leave names, job titles, company names, numbers and brand terms alone unless clearly misspelled.",
    content: [{ type: "text", text: `${listing}\n\nList every mistake. "find" must be copied exactly from the field (a few words of context is fine so it is unique); "replace" is the corrected version of exactly that text. Reply with JSON only: {"issues":[{"field":"name","find":"...","replace":"...","why":"short reason"}]}. If there are none, reply {"issues":[]}.` }],
    maxTokens: 3000,
  });
  const j = parseJson(reply);
  const byKey = Object.fromEntries(entries);
  return (j.issues || []).filter((x) => x && byKey[x.field] != null && x.find && String(byKey[x.field]).includes(x.find) && x.find !== x.replace);
}

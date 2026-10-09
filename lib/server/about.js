// Drafts the "About the client" section from the client's own website.
// Reads the home page and its about / who-we-are pages, then asks Claude to write
// a short third-person overview in British English, in the house style.
import { parse } from "node-html-parser";
import { getHtml, renderPages, normaliseUrl } from "./scrape";
import { askClaude, hasClaude } from "./claude";
import { LIMITS } from "../proposal/data";

const ABOUT = /(about|who-we-are|our-story|our-company|company|history|heritage|mission|values|what-we-do|our-business|overview|culture|careers)/i;
const SKIP = /(news|blog|press|insights|article|events|privacy|cookie|terms|login|contact|vacanc|job-)/i;

function pageText(root) {
  for (const sel of ["script", "style", "noscript", "svg", "nav", "header", "footer", "form", "iframe", "[aria-hidden=true]", ".cookie", "#cookie", "[class*=cookie]", "[class*=menu]"]) {
    for (const el of root.querySelectorAll(sel)) el.remove();
  }
  const body = root.querySelector("main") || root.querySelector("body") || root;
  return body.structuredText.split("\n").map((l) => l.replace(/\s+/g, " ").trim()).filter((l) => l.length > 2).join("\n");
}

function aboutLinks(root, base) {
  const host = new URL(base).host.replace(/^www\./, "");
  const seen = new Set();
  const scored = [];
  for (const a of root.querySelectorAll("a[href]")) {
    let u;
    try { u = new URL(a.getAttribute("href"), base); } catch { continue; }
    if (u.host.replace(/^www\./, "") !== host) continue;
    const key = u.origin + u.pathname;
    if (seen.has(key) || SKIP.test(u.pathname) || u.pathname === "/") continue;
    const hay = u.pathname + " " + a.text;
    if (!ABOUT.test(hay)) continue;
    seen.add(key);
    scored.push({ u: key, s: /about|who-we-are|our-story/i.test(hay) ? 2 : 1 });
  }
  return scored.sort((a, b) => b.s - a.s).slice(0, 3).map((x) => x.u);
}

// Tidy anything that slipped through: no dashes used as punctuation, single spaces.
export function tidy(text) {
  return String(text || "")
    .replace(/\s*[—–]\s*/g, ", ")
    .replace(/ - /g, ", ")
    .replace(/,\s*,/g, ",")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .split("\n").map((l) => l.trim()).filter(Boolean).join("\n")
    .trim();
}

function fitLength(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf(".\n"));
  return (end > max * 0.6 ? cut.slice(0, end + 1) : cut).trim();
}

export async function draftAbout(rawUrl, company = "") {
  if (!hasClaude()) throw new Error("Claude isn't connected, so the About section can't be drafted.");
  const start = normaliseUrl(rawUrl);
  if (!start) throw new Error("That doesn't look like a web address.");

  let pages = [];
  const home = await getHtml(start);
  if (home) {
    const root = parse(home.html);
    const links = aboutLinks(root, home.url);
    pages.push({ url: home.url, text: pageText(parse(home.html)) });
    const extra = await Promise.all(links.map((u) => getHtml(u)));
    extra.forEach((p, i) => p && pages.push({ url: links[i], text: pageText(parse(p.html)) }));
  }
  // Sites built with JavaScript show little text to a plain request, so open them properly.
  if (pages.reduce((n, p) => n + p.text.length, 0) < 1500) {
    const r = await renderPages([home ? home.url : start]).catch(() => []);
    if (r[0]) {
      const links = aboutLinks(r[0].root, r[0].url);
      const more = links.length ? await renderPages(links.slice(0, 2)).catch(() => []) : [];
      pages = [r[0], ...more].map((p) => ({ url: p.url, text: pageText(p.root) }));
    }
  }
  // About pages first, home page last; keep it to a sensible amount of reading.
  pages.sort((a, b) => (ABOUT.test(b.url) ? 1 : 0) - (ABOUT.test(a.url) ? 1 : 0));
  let source = "";
  for (const p of pages) {
    if (source.length > 14000) break;
    source += `\n\n=== ${p.url} ===\n${p.text.slice(0, 7000)}`;
  }
  if (source.replace(/\s/g, "").length < 300) throw new Error("Couldn't find enough about the company on that website to write this section.");

  const max = LIMITS.about;
  const system = `You write the "About the client" page of recruitment proposals for Elevation Recruitment, a UK recruitment firm. The reader is the client themselves, so the writing should feel informed, warm and professional, as if written by an experienced consultant who has done their homework.`;
  const prompt = `Using only the website text below, write the "About ${company || "the company"}" section of the proposal.

Rules:
- Write about the company in the third person ("${company || "The company"} is...", "The business...", "Its teams..."). Never "we", "our" or "you".
- British English spelling and phrasing (organisation, specialise, centre, programme, colour).
- Do not use em dashes or en dashes at all. Use commas, full stops or "and" instead.
- Do not list things in threes. Avoid groups of three adjectives, three nouns or three clauses. Use two items, or four or more, or rephrase.
- Sound like a person wrote it: plain, specific and confident. Vary sentence length. No marketing clichés or filler such as "leading provider", "passionate about", "committed to excellence", "dynamic", "cutting-edge", "in today's fast-paced world", "innovative solutions", "seamless", "robust", "delve", "boasts", "tapestry".
- Stick to facts from the website: what the business does, who for, where, its size or history if given, what makes it distinctive, and what it is like to work there if mentioned. Don't invent figures, awards or claims.
- 2 or 3 short paragraphs, separated by a single line break. Between ${Math.round(max * 0.65)} and ${max - 60} characters in total, including spaces.
- No heading, no bullet points, no quotation marks around the text. Reply with the section text only.

Website text:
${source}`;
  const model = process.env.CLAUDE_WRITE_MODEL || "claude-sonnet-5-5";
  let text = tidy(await askClaude({ system, content: prompt, maxTokens: 1200, model }));
  if (text.length > max) {
    text = tidy(await askClaude({ system, content: `Shorten this to under ${max - 60} characters, keeping the same style and rules (third person, British English, no dashes, no lists of three). Reply with the text only.\n\n${text}`, maxTokens: 1000, model }));
  }
  return { about: fitLength(text, max), pagesRead: pages.length };
}

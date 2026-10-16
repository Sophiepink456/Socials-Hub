// Turn an uploaded document into letterhead blocks (lib/letterhead/doc.js).
//   Word (.docx): read directly, keeping headings, lists, tables, bold and pictures.
//   PDF: read by Claude, which hands back the same structure (wording unchanged).
//   Text / Markdown: simple rules (# headings, - bullets, | tables).
import { parse } from "node-html-parser";
import sharp from "sharp";
import { cleanBlocks, cleanInline, textOf, escapeHtml } from "../letterhead/doc";
import { askClaude, hasClaude, parseJson } from "./claude";

const MAX_IMAGE_BYTES = 2_500_000; // all pictures together, so the PDF request stays small

// "Name: ________" style lines become signing lines.
const SIGN = /^(name|full name|print name|position|job title|title|signature|signed|date|company)\s*:?\s*[_.…\s]*$/i;
const signLine = (text) => (SIGN.test(text) && (/[_.…]{3,}/.test(text) || /:\s*$/.test(text)) ? text.replace(/[:\s_.…]+$/, "") : "");

// ---------------------------------------------------------------- Word -----
export async function parseDocx(buffer) {
  const mammoth = (await import("mammoth")).default;
  let imageBytes = 0;
  const { value } = await mammoth.convertToHtml({ buffer }, {
    styleMap: ["p[style-name='Subtitle'] => h2:fresh", "p[style-name='Quote'] => blockquote:fresh"],
    convertImage: mammoth.images.imgElement(async (image) => {
      try {
        const raw = Buffer.from(await image.read("base64"), "base64");
        const out = await sharp(raw, { failOn: "none" }).resize(1200, 1200, { fit: "inside", withoutEnlargement: true }).png({ compressionLevel: 9 }).toBuffer();
        if (imageBytes + out.length > MAX_IMAGE_BYTES) return { src: "" };
        imageBytes += out.length;
        return { src: `data:image/png;base64,${out.toString("base64")}` };
      } catch {
        return { src: "" };
      }
    }),
  });
  return blocksFromHtml(value);
}

function blocksFromHtml(html) {
  const root = parse(`<div>${html}</div>`).firstChild;
  const blocks = [];
  const walk = (nodes) => {
    for (const n of nodes) {
      if (n.nodeType !== 1) continue;
      const tag = n.tagName.toLowerCase();
      if (/^h[1-6]$/.test(tag)) {
        const t = tag === "h1" ? "h1" : tag === "h2" ? "h2" : "h3";
        blocks.push({ type: t, html: cleanInline(n.innerHTML) });
      } else if (tag === "p" || tag === "blockquote") {
        for (const img of n.querySelectorAll("img")) {
          const src = img.getAttribute("src") || "";
          if (src) blocks.push({ type: "image", src });
        }
        const inner = cleanInline(n.innerHTML);
        const text = textOf(inner);
        if (!text) continue;
        const sign = signLine(text);
        if (sign) { blocks.push({ type: "sign", label: sign }); continue; }
        // A short line that's all bold is a heading in most Word documents.
        if (/^<b>[^]*<\/b>$/.test(inner) && !/<\/b>[^]*<b>/.test(inner) && text.length <= 90 && !/[.,;:]$/.test(text)) {
          blocks.push({ type: "h2", html: escapeHtml(text) });
        } else if (/^<i>[^]*<\/i>$/.test(inner) && !/<\/i>[^]*<i>/.test(inner)) {
          blocks.push({ type: "note", html: inner.replace(/^<i>|<\/i>$/g, "") });
        } else {
          blocks.push({ type: "p", html: inner });
        }
      } else if (tag === "ul" || tag === "ol") {
        const items = [];
        const list = (el, level) => {
          for (const li of el.childNodes) {
            if (li.nodeType !== 1 || li.tagName.toLowerCase() !== "li") continue;
            const nested = li.childNodes.filter((c) => c.nodeType === 1 && /^(ul|ol)$/i.test(c.tagName));
            const own = li.childNodes.filter((c) => !nested.includes(c)).map((c) => c.toString()).join("");
            items.push({ html: cleanInline(own), level });
            for (const sub of nested) list(sub, level + 1);
          }
        };
        list(n, 0);
        blocks.push({ type: tag, items });
      } else if (tag === "table") {
        const rows = n.querySelectorAll("tr").map((tr) =>
          tr.childNodes.filter((c) => c.nodeType === 1 && /^t[dh]$/i.test(c.tagName)).map((c) => cleanInline(c.innerHTML)));
        blocks.push({ type: "table", rows, header: true });
      } else if (tag === "img") {
        const src = n.getAttribute("src") || "";
        if (src) blocks.push({ type: "image", src });
      } else {
        walk(n.childNodes);
      }
    }
  };
  walk(root.childNodes);
  return cleanBlocks(blocks);
}

// ---------------------------------------------------------- Plain text -----
export function parseText(text) {
  const blocks = [];
  const lines = String(text || "").replace(/\r\n?/g, "\n").split("\n");
  const inline = (s) => cleanInline(escapeHtml(s).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/(^|\W)\*([^*]+)\*(?=\W|$)/g, "$1<i>$2</i>"));
  let para = [];
  const flush = () => { if (para.length) { blocks.push({ type: "p", html: inline(para.join(" ")) }); para = []; } };
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l) { flush(); continue; }
    let m;
    if ((m = /^(#{1,6})\s+(.*)$/.exec(l))) { flush(); blocks.push({ type: m[1].length === 1 ? "h1" : m[1].length === 2 ? "h2" : "h3", html: inline(m[2]) }); continue; }
    if (/^([-*•])\s+/.test(l) || /^\d+[.)]\s+/.test(l)) {
      flush();
      const ordered = /^\d/.test(l);
      const items = [];
      while (i < lines.length && (/^\s*([-*•])\s+/.test(lines[i]) || /^\s*\d+[.)]\s+/.test(lines[i]))) {
        const level = Math.min(3, Math.floor((lines[i].match(/^\s*/)[0].length) / 2));
        items.push({ html: inline(lines[i].trim().replace(/^([-*•]|\d+[.)])\s+/, "")), level });
        i++;
      }
      i--;
      blocks.push({ type: ordered ? "ol" : "ul", items });
      continue;
    }
    if (/^\|.*\|$/.test(l)) {
      flush();
      const rows = [];
      while (i < lines.length && /^\|.*\|$/.test(lines[i].trim())) {
        const r = lines[i].trim().slice(1, -1).split("|").map((c) => c.trim());
        if (!r.every((c) => /^:?-{2,}:?$/.test(c))) rows.push(r.map(inline));
        i++;
      }
      i--;
      blocks.push({ type: "table", rows, header: true });
      continue;
    }
    const sign = signLine(l);
    if (sign) { flush(); blocks.push({ type: "sign", label: sign }); continue; }
    para.push(l);
  }
  flush();
  return cleanBlocks(blocks);
}

// ----------------------------------------------------------------- PDF -----
const PDF_SYSTEM = `You convert a PDF into structured content for a branded document template. Copy the wording EXACTLY as written. Never rewrite, summarise, correct, add or drop sentences.

Leave out: page numbers, running headers and footers, the original company logos and letterhead, and any cover page details (title, prepared for, prepared by, dates) — those go in "cover" instead.

Reply with JSON only, in this shape:
{
  "cover": { "title": "", "forLines": ["name and job title", "company"], "byLines": ["name and job title", "company"] },
  "blocks": [ ... ]
}
Block types, in reading order:
  {"type":"h1","text":"..."}  main section heading
  {"type":"h2","text":"..."}  sub-heading
  {"type":"h3","text":"..."}  minor heading
  {"type":"p","html":"..."}   paragraph; keep bold as <b>, italic as <i>
  {"type":"note","html":"..."} small print / italic disclaimer paragraph
  {"type":"ul","items":[{"html":"...","level":0}]}  bullet list (level 1+ for nested)
  {"type":"ol","items":[{"html":"...","level":0}]}  numbered list (don't include the numbers)
  {"type":"table","header":true,"rows":[["cell","cell"],["cell","cell"]]}  first row is the header row if it has one
  {"type":"sign","label":"Name"}  a blank line to sign or write on, like "Name: ______"
Join lines that belong to the same paragraph. Use "" or [] for cover parts that aren't in the document.`;

export async function parsePdf(buffer) {
  if (!hasClaude()) throw new Error("Reading PDFs needs Claude, and ANTHROPIC_API_KEY isn't set in Vercel. Upload a Word document instead.");
  const { text, truncated } = await askClaude({
    system: PDF_SYSTEM,
    maxTokens: 32000,
    returnMeta: true,
    content: [
      { type: "document", source: { type: "base64", media_type: "application/pdf", data: buffer.toString("base64") } },
      { type: "text", text: "Convert this document. JSON only." },
    ],
  });
  if (truncated) throw new Error("That PDF is too long to read in one go. Try splitting it, or upload the Word version.");
  const j = parseJson(text);
  return { blocks: cleanBlocks(j.blocks), cover: j.cover || {} };
}

// --------------------------------------------------- Cover suggestions -----
// For Word and text files, ask Claude (if set up) for the cover details.
const COVER_SYSTEM = `From the start of a document, pick out its cover details. Reply with JSON only:
{"title":"","forLines":["","",""],"byLines":["","",""]}
title: the document's title (e.g. "Recruitment Partnership Proposal"). forLines: who it's prepared for (person and job title on the first line, organisation on the second). byLines: who prepared it, same layout. Only use what the text actually says; leave anything missing as "".`;

export async function suggestCover(blocks) {
  if (!hasClaude()) return {};
  const text = blocks.slice(0, 40).map((b) => (b.items ? b.items.map((i) => "- " + textOf(i.html)).join("\n") : b.rows ? b.rows.map((r) => r.map(textOf).join(" | ")).join("\n") : textOf(b.html || b.label || ""))).join("\n").slice(0, 6000);
  try {
    return parseJson(await askClaude({ system: COVER_SYSTEM, content: text, maxTokens: 400 }));
  } catch (e) {
    console.warn("cover suggestion failed", e.message);
    return {};
  }
}

// The title is already on the cover, so a matching first heading isn't repeated.
export function dropCoverTitle(blocks, title) {
  const t = String(title || "").trim().toLowerCase();
  if (t && blocks[0] && /^h[12]$/.test(blocks[0].type) && textOf(blocks[0].html).toLowerCase() === t) return blocks.slice(1);
  return blocks;
}

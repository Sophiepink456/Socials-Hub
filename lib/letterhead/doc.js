// Letterheaded Documents: the content model shared by the editor, the
// parser and the PDF printer.
//
// A document is a cover (optional) plus a list of blocks:
//   { type: "h1" | "h2" | "h3" | "p" | "note", html }
//   { type: "ul" | "ol", items: [{ html, level }] }
//   { type: "table", rows: [[html, ...], ...], header: true }
//   { type: "sign", label }            a "Name: ______" line to sign on
//   { type: "image", src }             a data: URI picture from the document

const ALLOWED = new Set(["b", "strong", "i", "em", "u", "br", "sup", "sub", "a"]);
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

const decode = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
  if (e[0] === "#") {
    const n = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
    return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : "";
  }
  return ENT[e.toLowerCase()] ?? m;
});
export const escapeHtml = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Keep simple inline formatting (bold, italic, underline, links, line breaks)
// and drop every other tag and attribute.
export function cleanInline(html) {
  const s = String(html ?? "").slice(0, 20000);
  let out = "";
  for (const part of s.split(/(<[^>]*>)/)) {
    if (!part) continue;
    const m = /^<(\/?)([a-z0-9]+)\b([^>]*)>$/i.exec(part);
    if (!m) { if (!part.startsWith("<")) out += escapeHtml(decode(part)); continue; }
    const [, close, tag0, attrs] = m;
    const tag = tag0.toLowerCase() === "strong" ? "b" : tag0.toLowerCase() === "em" ? "i" : tag0.toLowerCase();
    if (!ALLOWED.has(tag)) { if (tag === "p" && close) out += "<br>"; continue; }
    if (tag === "br") { out += "<br>"; continue; }
    if (tag === "a" && !close) {
      const h = /href\s*=\s*"([^"]*)"/i.exec(attrs) || /href\s*=\s*'([^']*)'/i.exec(attrs);
      const href = h ? decode(h[1]).trim() : "";
      out += /^(https?:|mailto:)/i.test(href) ? `<a href="${escapeHtml(href)}">` : "<a>";
      continue;
    }
    out += `<${close}${tag}>`;
  }
  return out.replace(/(<br>\s*)+$/, "").trim();
}

export const textOf = (html) => decode(String(html || "").replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();

const IMG = /^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+/=]+$/i;
const LIMIT_BLOCKS = 600;

export function cleanBlocks(blocks) {
  const out = [];
  for (const b of Array.isArray(blocks) ? blocks : []) {
    if (!b || typeof b !== "object" || out.length >= LIMIT_BLOCKS) continue;
    const t = String(b.type || "");
    if (["h1", "h2", "h3", "p", "note"].includes(t)) {
      const html = cleanInline(b.html ?? escapeHtml(b.text || ""));
      if (textOf(html)) out.push({ type: t, html });
    } else if (t === "ul" || t === "ol") {
      const items = (Array.isArray(b.items) ? b.items : [])
        .map((it) => (typeof it === "string" ? { html: escapeHtml(it), level: 0 } : it || {}))
        .map((it) => ({ html: cleanInline(it.html ?? escapeHtml(it.text || "")), level: Math.max(0, Math.min(3, parseInt(it.level, 10) || 0)) }))
        .filter((it) => textOf(it.html));
      if (items.length) out.push({ type: t, items: items.slice(0, 200) });
    } else if (t === "table") {
      const rows = (Array.isArray(b.rows) ? b.rows : []).slice(0, 200)
        .map((r) => (Array.isArray(r) ? r.slice(0, 12).map((c) => cleanInline(typeof c === "string" ? c : (c && (c.html ?? escapeHtml(c.text || ""))) || "")) : []))
        .filter((r) => r.some((c) => textOf(c)));
      if (rows.length) {
        const cols = Math.max(...rows.map((r) => r.length));
        out.push({ type: "table", rows: rows.map((r) => [...r, ...Array(cols - r.length).fill("")]), header: b.header !== false });
      }
    } else if (t === "sign") {
      const label = textOf(b.label || b.html || "").replace(/[:\s_.]+$/, "").slice(0, 40);
      if (label) out.push({ type: "sign", label });
    } else if (t === "image") {
      if (IMG.test(String(b.src || ""))) out.push({ type: "image", src: b.src });
    }
  }
  return out;
}

const line = (s, n = 90) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);
// The cover title can run over up to three lines (Enter starts a new one).
const titleLines = (s) => String(s ?? "").split(/\r?\n/).map((x) => line(x, 120)).filter(Boolean).slice(0, 3).join("\n");
const lines = (a) => [0, 1, 2].map((i) => line((Array.isArray(a) ? a : [])[i]));

export function blankDoc() {
  return {
    cover: { on: true, title: "", forLines: ["", "", ""], byLines: ["", "", ""], confidential: true },
    breakSections: true,
    blocks: [],
    fileName: "",
  };
}

export function normaliseDoc(d) {
  const b = blankDoc();
  d = d && typeof d === "object" ? d : {};
  const c = d.cover || {};
  return {
    cover: {
      on: c.on !== false,
      title: titleLines(c.title),
      forLines: lines(c.forLines),
      byLines: lines(c.byLines),
      confidential: c.confidential !== false,
    },
    breakSections: d.breakSections !== false,
    blocks: cleanBlocks(d.blocks),
    fileName: line(d.fileName || b.fileName, 120),
  };
}

export function pdfName(d) {
  const base = (d.cover && d.cover.title && d.cover.title.replace(/\n/g, " – ")) || String(d.fileName || "").replace(/\.[^.]+$/, "") || "Document";
  return `${base}.pdf`.replace(/[^\w &().,'-]+/g, "").replace(/\s+/g, " ").trim();
}

// Numbers, money and percentages read better right-aligned.
const NUMERIC = /^[-+(]?[£$€]?\s?\d[\d,]*(\.\d+)?\s?(%|k|m)?\)?$/i;
export function numericColumns(rows, header) {
  const body = header ? rows.slice(1) : rows;
  const cols = rows[0] ? rows[0].length : 0;
  return Array.from({ length: cols }, (_, i) => {
    const vals = body.map((r) => textOf(r[i])).filter(Boolean);
    return i > 0 && vals.length > 0 && vals.every((v) => NUMERIC.test(v));
  });
}
export const isTotalRow = (row) => /^(grand\s+)?totals?\b/i.test(textOf(row[0]));

// Text typed into the preview: line breaks kept as "\n", everything else plain.
export function plainFromHtml(html) {
  return decode(String(html || "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/(div|p)>/gi, "\n").replace(/<[^>]*>/g, ""))
    .split("\n").map((x) => x.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n");
}
export const htmlFromPlain = (s) => escapeHtml(s).replace(/\n/g, "<br>");

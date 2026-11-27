// Free-placed boxes on added pages: headings, text (with bullet points and subheadings), tables
// and pictures. Each box has a position on the 1920 x 1080 page (x, y, width) that can be dragged
// in the form. Used by blank "build your own" pages and as extra boxes on any added page.

export const BLOCK_TYPES = [
  ["heading", "Heading"],
  ["text", "Text / bullet points"],
  ["table", "Table"],
  ["image", "Picture"],
];

export const newId = () => Math.random().toString(36).slice(2, 10);

export function newBlock(type, y = 240) {
  const base = { id: newId(), type, x: 100, y, w: 1720 };
  if (type === "heading") return { ...base, text: "Heading", size: 40 };
  if (type === "text") return { ...base, text: "Type your text here.\n- A bullet point\n- Another bullet point", size: 22 };
  if (type === "table") return { ...base, header: true, size: 20, rows: [["Heading", "Heading", "Heading"], ["", "", ""], ["", "", ""]] };
  if (type === "image") return { ...base, w: 800, h: 450, src: "" };
  return base;
}

// Text: "- " or "• " = bullet point, "## " = semibold subheading, anything else = a paragraph.
function RichText({ text, size, color, acc }) {
  const out = [];
  let list = null;
  String(text || "").split("\n").forEach((raw) => {
    const l = raw.trim();
    if (!l) { list = null; return; }
    const b = l.match(/^[-•–*]\s+(.*)$/);
    if (b) { if (!list) { list = []; out.push({ list }); } list.push(b[1]); return; }
    list = null;
    const s = l.match(/^##\s+(.*)$/);
    out.push(s ? { sub: s[1] } : { p: l });
  });
  const gap = Math.round(size * 0.6);
  return (
    <div style={{ fontSize: size, lineHeight: 1.45, color, fontWeight: 400 }}>
      {out.map((o, i) => {
        const mt = i ? gap : 0;
        if (o.list) return (
          <ul key={i} style={{ listStyle: "disc", paddingLeft: Math.round(size * 1.2), marginTop: mt }}>
            {o.list.map((t, j) => <li key={j} style={{ marginTop: j ? Math.round(size * 0.3) : 0, "--m": acc }}>{t}</li>)}
          </ul>
        );
        if (o.sub) return <p key={i} style={{ marginTop: mt, fontWeight: 600 }}>{o.sub}</p>;
        return <p key={i} style={{ marginTop: mt }}>{o.p}</p>;
      })}
    </div>
  );
}

function Table({ b, dark, acc }) {
  const rows = (b.rows || []).filter((r) => Array.isArray(r));
  const size = b.size || 20;
  const line = dark ? "rgba(255,255,255,0.22)" : "#c9c9c9";
  const text = dark ? "#fff" : "#161616";
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: size, lineHeight: 1.35, color: text, tableLayout: "fixed" }}>
      <tbody>
        {rows.map((r, i) => {
          const head = b.header && i === 0;
          return (
            <tr key={i} style={head ? { background: dark ? acc : "#161616", color: dark ? "#161616" : "#fff" } : undefined}>
              {r.map((c, j) => (
                <td key={j} style={{ padding: `${Math.round(size * 0.6)}px ${Math.round(size * 0.8)}px`, fontWeight: head ? 600 : 400,
                  borderBottom: head ? "none" : `1px solid ${line}`, verticalAlign: "top", borderRadius: 0, overflowWrap: "anywhere" }}>{c}</td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function Blocks({ blocks, dark, acc = "#BAE400" }) {
  const color = dark ? "#fff" : "#161616";
  return (
    <>
      {(blocks || []).map((b) => (
        <div key={b.id} data-block={b.id} style={{ position: "absolute", left: b.x || 0, top: b.y || 0, width: b.w || 400 }}>
          {b.type === "heading" ? (
            <div style={{ fontSize: b.size || 40, fontWeight: 500, lineHeight: 1.15, color, letterSpacing: "-0.01em" }}>
              {String(b.text || "").replace(/\.$/, "")}<span style={{ color: acc }}>.</span>
            </div>
          ) : b.type === "text" ? (
            <RichText text={b.text} size={b.size || 22} color={color} acc={acc} />
          ) : b.type === "table" ? (
            <Table b={b} dark={dark} acc={acc} />
          ) : b.type === "image" ? (
            b.src
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={b.src} alt="" style={{ display: "block", width: "100%", height: b.h || 400, objectFit: "cover", borderRadius: 20 }} />
              : <div style={{ width: "100%", height: b.h || 400, borderRadius: 20, background: dark ? "#2a2a2a" : "#d8d8d8" }} />
          ) : null}
        </div>
      ))}
    </>
  );
}

// Extra boxes laid over one of the standard page designs.
export function WithBlocks({ el, blocks, dark, acc }) {
  if (!blocks || !blocks.length) return el;
  return (
    <div style={{ position: "relative", width: 1920, height: 1080 }}>
      {el}
      <div className="pp pp26" style={{ position: "absolute", left: 0, top: 0, background: "transparent", pointerEvents: "none" }}>
        <Blocks blocks={blocks} dark={dark} acc={acc} />
      </div>
    </div>
  );
}

// ---- A document turned into pages -------------------------------------------------------
// `doc` is the hub's document reader output: { cover: { title }, blocks: [{ type: h1|h2|h3|p|note|ul|ol|table|sign, ... }] }.
const strip = (html) => String(html || "").replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();

const TOP = 230; // below the page heading
const BOTTOM = 900; // above the footer
const W = 1720;

// Rough height of a box, for splitting a long document over pages.
function textHeight(text, size, width = W) {
  const perLine = Math.max(20, Math.floor(width / (size * 0.5)));
  const lines = String(text).split("\n").reduce((n, l) => n + Math.max(1, Math.ceil(l.length / perLine)), 0);
  return Math.ceil(lines * size * 1.45 + (String(text).split("\n").length - 1) * size * 0.35);
}
function tableHeight(rows, size, width = W) {
  const cols = Math.max(1, ...rows.map((r) => r.length));
  const perLine = Math.max(8, Math.floor((width / cols - size * 1.6) / (size * 0.5)));
  return rows.reduce((h, r) => h + Math.max(...r.map((c) => Math.max(1, Math.ceil(String(c).length / perLine)))) * size * 1.35 + size * 1.2, 0);
}

// Pages of { heading, blocks } in the hub's style: a heading for each main section of the
// document, then its text, points and tables stacked down the page, carrying on over as many
// pages as it needs.
export function pagesFromDoc(doc, { maxPages = 15 } = {}) {
  let src = ((doc && doc.blocks) || []).slice();
  // A short opening line before the first heading is the document's title.
  let title = String((doc && doc.cover && doc.cover.title) || "").replace(/\n/g, " ").trim();
  if (src[0] && src[0].type === "p" && strip(src[0].html).length <= 70 && src[1] && /^h[123]$/.test(src[1].type)) {
    if (!title) title = strip(src[0].html);
    src = src.slice(1);
  }
  // Main headings start pages: h1 if the document has any, otherwise h2. Smaller ones become subheadings.
  const pageLevel = src.some((b) => b.type === "h1") ? ["h1"] : ["h2"];
  const pages = [];
  let cur = null;
  let y = TOP;
  let pendingText = null; // text being gathered into one box

  const startPage = (heading) => {
    flush();
    cur = { heading: heading || (cur ? cur.heading : title || "Introduction"), blocks: [] };
    pages.push(cur);
    y = TOP;
  };
  const room = (h) => { if (!cur) startPage(); if (y + h > BOTTOM && cur.blocks.length) startPage(cur.heading); };
  const put = (b, h) => { room(h); cur.blocks.push({ ...b, id: newId(), x: 100, y, w: W }); y += h + 30; };
  function flush() {
    if (!pendingText || !cur) { pendingText = null; return; }
    const lines = pendingText;
    pendingText = null;
    // Split long text into boxes that each fit what's left of a page.
    let chunk = [];
    const out = () => { if (chunk.length) { const t = chunk.join("\n"); put({ type: "text", text: t, size: 22 }, textHeight(t, 22)); chunk = []; } };
    for (const l of lines) {
      const next = [...chunk, l].join("\n");
      if (chunk.length && y + textHeight(next, 22) > BOTTOM) { out(); startPageKeep(); }
      chunk.push(l);
    }
    out();
  }
  function startPageKeep() {
    const h = cur.heading;
    cur = { heading: h, blocks: [] };
    pages.push(cur);
    y = TOP;
  }
  const addText = (line) => { if (!cur) startPage(); (pendingText = pendingText || []).push(line); };

  for (const b of src) {
    if (pageLevel.includes(b.type)) { startPage(strip(b.html || b.text)); continue; }
    if (/^h[1-6]$/.test(b.type)) { addText("## " + strip(b.html || b.text)); continue; }
    if (b.type === "p" || b.type === "note") { const t = strip(b.html); if (t) addText(t); continue; }
    if (b.type === "ul" || b.type === "ol") { (b.items || []).forEach((it) => { const t = strip(it.html); if (t) addText("- " + t); }); continue; }
    if (b.type === "sign") { addText(`${strip(b.label)}: ____________________`); continue; }
    if (b.type === "table") {
      flush();
      const rows = (b.rows || []).map((r) => r.map(strip));
      if (!rows.length) continue;
      // Long tables carry on over pages, repeating the header row.
      const size = rows[0].length > 5 ? 16 : 20;
      let start = 0;
      while (start < rows.length) {
        if (!cur) startPage();
        const head = b.header !== false && start > 0 ? [rows[0]] : [];
        let end = start + 1;
        while (end < rows.length && y + tableHeight([...head, ...rows.slice(start, end + 1)], size) <= BOTTOM) end++;
        const part = [...head, ...rows.slice(start, end)];
        const h = tableHeight(part, size);
        if (y + h > BOTTOM && cur.blocks.length) { startPageKeep(); continue; }
        cur.blocks.push({ id: newId(), type: "table", header: b.header !== false, size, rows: part, x: 100, y, w: W });
        y += h + 30;
        start = end;
      }
    }
  }
  flush();
  return pages.filter((pg) => pg.blocks.length || pg.heading).slice(0, maxPages);
}

// The letterhead design (Figma "Partnership Proposal" 4UnvJeuvpwslLX5qpAvYC7): a cover page and
// the body pages. Sizes are in pt, matching the Figma frames (595 x 842 = A4).
// Styles live in app/letterhead/letterhead.css.
//
// Every piece of text can be edited straight on the preview when `onEdit` is passed:
// Enter starts a new line, and anything emptied is taken out. The PDF uses the same
// components without `onEdit`.
import { useLayoutEffect, useRef } from "react";
import { numericColumns, isTotalRow, cleanInline, textOf, plainFromHtml, htmlFromPlain, BRAND } from "./doc";

// Text that's either fixed (PDF) or editable in place (preview).
function E({ as: Tag = "span", className = "", html, onEdit, single = false }) {
  const ref = useRef(null);
  // Fill it in on first show and whenever it changes from outside, but never while
  // someone is typing in it (that would jump the cursor).
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.innerHTML !== html) el.innerHTML = html;
  }, [html]);
  if (!onEdit) return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
  return (
    <Tag ref={ref} className={className + " lh-editable"} contentEditable suppressContentEditableWarning spellCheck lang="en-GB"
      onKeyDown={(e) => {
        if (e.key !== "Enter") return;
        e.preventDefault();
        if (single) e.currentTarget.blur();
        else document.execCommand("insertLineBreak");
      }}
      // Pasted text comes in plain, so it takes on the letterhead's own fonts.
      onPaste={(e) => { e.preventDefault(); document.execCommand("insertText", false, e.clipboardData.getData("text/plain")); }}
      onBlur={(e) => onEdit(e.currentTarget.innerHTML)} />
  );
}

export function Cover({ cover, onEdit, brand = "pbe" }) {
  const art = BRAND[brand] || BRAND.pbe;
  const forLines = cover.forLines.filter(Boolean);
  const byLines = cover.byLines.filter(Boolean);
  const title = cover.title || "Document title";
  const [first, ...rest] = title.split("\n");
  const editLine = (k, i) => onEdit && ((h) => onEdit(k, i, plainFromHtml(h).replace(/\n/g, " ")));
  // In the preview, empty "Prepared for/by" lines can still be filled in on the form.
  const people = (k, list, label, rule) => list.length ? (
    <div className={"lh-cover-people" + (rule ? " lh-rule" : "")}>
      <p>{label}</p>
      {cover[k].map((l, i) => (l ? <E key={i} as="p" className="b" html={htmlFromPlain(l)} single onEdit={editLine(k, i)} /> : null))}
    </div>
  ) : null;
  return (
    <div className="lh-cover">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="lh-cover-bg" src="/letterhead/cover.jpg" alt="" />
      <div className="lh-cover-body">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={"lh-lockup" + (brand === "standard" ? " std" : "")} src={art.logo} alt={brand === "standard" ? "Elevation Recruitment Group" : "Powered by Elevation"} />
        {onEdit ? (
          <E className="lh-cover-title" html={`<span class="t1">${htmlFromPlain(first)}</span>${rest.map((r) => `<br><span class="t2">${htmlFromPlain(r)}</span>`).join("")}`}
            onEdit={(h) => onEdit("title", null, plainFromHtml(h))} />
        ) : (
          <div className="lh-cover-title">
            <span className="t1">{first}</span>
            {rest.map((r, i) => <span key={i}><br /><span className="t2">{r}</span></span>)}
          </div>
        )}
        {people("forLines", forLines, "Prepared for", true)}
        {people("byLines", byLines, "Prepared by", false)}
        {cover.confidential ? <div className="lh-tag">Private &amp; Confidential</div> : null}
      </div>
    </div>
  );
}

function Table({ b, onEdit }) {
  const num = numericColumns(b.rows, b.header);
  const cell = (r, c) => onEdit && ((h) => onEdit({ ...b, rows: b.rows.map((row, i) => (i === r ? row.map((x, j) => (j === c ? cleanInline(h) : x)) : row)) }));
  return (
    <table className="lh-table">
      {b.header ? (
        <thead>
          <tr>{b.rows[0].map((c, i) => <th key={i} className={num[i] ? "r" : ""}><E html={c} onEdit={cell(0, i)} /></th>)}</tr>
        </thead>
      ) : null}
      <tbody>
        {(b.header ? b.rows.slice(1) : b.rows).map((r, i) => {
          const ri = b.header ? i + 1 : i;
          return (
            <tr key={ri} className={isTotalRow(r) ? "total" : ""}>
              {r.map((c, j) => <td key={j} className={num[j] ? "r" : ""}><E html={c} onEdit={cell(ri, j)} /></td>)}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function List({ b, onEdit }) {
  let n = 0;
  const item = (k) => onEdit && ((h) => {
    const html = cleanInline(h);
    const items = textOf(html) ? b.items.map((it, j) => (j === k ? { ...it, html } : it)) : b.items.filter((_, j) => j !== k);
    onEdit(items.length ? { ...b, items } : null);
  });
  return (
    <div className={"lh-list" + (b.type === "ol" ? " ol" : "")}>
      {b.items.map((it, i) => {
        if (!it.level) n += 1;
        return (
          <div key={i} className="lh-li" style={{ marginLeft: `${it.level * 14}pt` }}>
            <span className={"lh-mark" + (b.type === "ol" && !it.level ? " num" : "")}>{b.type === "ol" && !it.level ? `${n}.` : ""}</span>
            <E className="lh-li-text" html={it.html} onEdit={item(i)} />
          </div>
        );
      })}
    </div>
  );
}

// `onEdit(newBlock)` gets the changed block, or null when it was emptied (take it out).
export function Block({ b, first, breakBefore, onEdit }) {
  const cls = (base) => base + (first ? " first" : "") + (breakBefore ? " break" : "");
  const text = onEdit && ((h) => { const html = cleanInline(h); onEdit(textOf(html) ? { ...b, html } : null); });
  switch (b.type) {
    case "h1": return <E as="h1" className={cls("lh-h1")} html={b.html} onEdit={text} />;
    case "h2": return <E as="h2" className={cls("lh-h2")} html={b.html} onEdit={text} />;
    case "h3": return <E as="h3" className={cls("lh-h3")} html={b.html} onEdit={text} />;
    case "note": return <E as="p" className={cls("lh-note")} html={b.html} onEdit={text} />;
    case "ul":
    case "ol": return <List b={b} onEdit={onEdit} />;
    case "table": return <Table b={b} onEdit={onEdit} />;
    case "pagebreak": return <div className="lh-break" />;
    case "sign": return <div className="lh-sign"><span>{b.label}:</span><i /></div>;
    // eslint-disable-next-line @next/next/no-img-element
    case "image": return <img className="lh-img" src={b.src} alt="" />;
    default: return <E as="p" className={cls("lh-p")} html={b.html} onEdit={text} />;
  }
}

// The body: every block in order. Main headings start a new page when
// `breakSections` is on (as in the Figma, one section per page).
export function Body({ doc }) {
  let seenH1 = false;
  return (
    <div className="lh-body">
      {doc.blocks.map((b, i) => {
        const breakBefore = doc.breakSections && b.type === "h1" && seenH1;
        if (b.type === "h1") seenH1 = true;
        return <Block key={i} b={b} first={i === 0} breakBefore={breakBefore} />;
      })}
    </div>
  );
}

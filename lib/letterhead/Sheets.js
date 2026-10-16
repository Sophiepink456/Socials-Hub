// The letterhead design (Figma "Partnership Proposal"): a cover page and the
// body pages. Sizes are in pt, matching the Figma frames (595 x 842 = A4).
// Styles live in app/letterhead/letterhead.css.
import { numericColumns, isTotalRow } from "./doc";

const H = ({ html }) => <span dangerouslySetInnerHTML={{ __html: html }} />;

export function Cover({ cover }) {
  const forLines = cover.forLines.filter(Boolean);
  const byLines = cover.byLines.filter(Boolean);
  return (
    <div className="lh-cover">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="lh-cover-bg" src="/letterhead/cover.jpg" alt="" />
      <div className="lh-cover-body">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="lh-lockup" src="/letterhead/cover-lockup.svg" alt="Powered by Elevation" />
        <div className="lh-cover-title">{cover.title || "Document title"}</div>
        {forLines.length ? (
          <div className="lh-cover-people lh-rule">
            <p>Prepared for</p>
            {forLines.map((l, i) => <p key={i} className="b">{l}</p>)}
          </div>
        ) : null}
        {byLines.length ? (
          <div className="lh-cover-people">
            <p>Prepared by</p>
            {byLines.map((l, i) => <p key={i} className="b">{l}</p>)}
          </div>
        ) : null}
        {cover.confidential ? <div className="lh-tag">Private &amp; Confidential</div> : null}
      </div>
    </div>
  );
}

function Table({ b }) {
  const num = numericColumns(b.rows, b.header);
  return (
    <table className="lh-table">
      {b.header ? (
        <thead>
          <tr>{b.rows[0].map((c, i) => <th key={i} className={num[i] ? "r" : ""}><H html={c} /></th>)}</tr>
        </thead>
      ) : null}
      <tbody>
        {(b.header ? b.rows.slice(1) : b.rows).map((r, i) => (
          <tr key={i} className={isTotalRow(r) ? "total" : ""}>
            {r.map((c, j) => <td key={j} className={num[j] ? "r" : ""}><H html={c} /></td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function List({ b }) {
  let n = 0;
  return (
    <div className={"lh-list" + (b.type === "ol" ? " ol" : "")}>
      {b.items.map((it, i) => {
        if (!it.level) n += 1;
        return (
          <div key={i} className="lh-li" style={{ marginLeft: `${it.level * 14}pt` }}>
            <span className="lh-mark">{b.type === "ol" && !it.level ? `${n}.` : "•"}</span>
            <span className="lh-li-text"><H html={it.html} /></span>
          </div>
        );
      })}
    </div>
  );
}

export function Block({ b, first, breakBefore }) {
  const cls = (base) => base + (first ? " first" : "") + (breakBefore ? " break" : "");
  switch (b.type) {
    case "h1": return <h1 className={cls("lh-h1")}><H html={b.html} /></h1>;
    case "h2": return <h2 className={cls("lh-h2")}><H html={b.html} /></h2>;
    case "h3": return <h3 className={cls("lh-h3")}><H html={b.html} /></h3>;
    case "note": return <p className={cls("lh-note")}><H html={b.html} /></p>;
    case "ul":
    case "ol": return <List b={b} />;
    case "table": return <Table b={b} />;
    case "sign": return <div className="lh-sign"><span>{b.label}:</span><i /></div>;
    // eslint-disable-next-line @next/next/no-img-element
    case "image": return <img className="lh-img" src={b.src} alt="" />;
    default: return <p className={cls("lh-p")}><H html={b.html} /></p>;
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

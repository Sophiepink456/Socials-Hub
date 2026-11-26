import { ElevationLogo } from "../Wordmarks";

export const metadata = { title: "Commercial Hub · Elevation Hub" };

// Tools in the Commercial Hub. Add new ones here; `href: null` shows a tile as coming soon,
// `external: true` opens it in a new tab.
const TOOLS = [
  {
    id: "hiring-radar",
    title: "Hiring Radar",
    blurb: "See who's hiring and what competitors are advertising. Search by company, role, or discipline and area, or watch competitor agencies.",
    tags: ["Company search", "Role search", "Discipline & area", "Competitor watch"],
    href: "https://hiring-radar-six.vercel.app",
    external: true,
    note: "Opens in a new tab and uses its own team password.",
  },
];

function Arrow({ external }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {external ? <path d="M7 17 17 7M9 7h8v8" /> : <path d="M5 12h14M13 6l6 6-6 6" />}
    </svg>
  );
}

export default function CommercialHub() {
  return (
    <div className="eh">
      <header className="eh-top eh-top-sub">
        <a href="/" aria-label="Elevation Hub home"><ElevationLogo className="eh-logo" /></a>
        <a href="/api/logout" className="eh-pill">Sign out</a>
      </header>

      <main className="eh-main">
        <a href="/" className="eh-back">← Elevation Hub</a>
        <h1 className="eh-title">Commercial Hub<span className="g">.</span></h1>
        <p className="eh-lede">Tools for winning and growing business.</p>

        <div className="eh-grid eh-grid-3">
          {TOOLS.map((t) => {
            const inner = (
              <>
                <h3>{t.title}</h3>
                <p>{t.blurb}</p>
                {t.tags && <ul className="eh-tags">{t.tags.map((x) => <li key={x}>{x}</li>)}</ul>}
                <span className={"eh-go" + (t.href ? "" : " soon")}>
                  {t.href ? <>Open <Arrow external={t.external} /></> : "Coming soon"}
                </span>
                {t.note && <span className="eh-note">{t.note}</span>}
              </>
            );
            return t.href
              ? <a key={t.id} href={t.href} className="eh-tile" {...(t.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{inner}</a>
              : <div key={t.id} className="eh-tile eh-soon" aria-disabled="true">{inner}</div>;
          })}
        </div>
      </main>
    </div>
  );
}

import { DESIGNS } from "../lib/designs";

// Tools shown above the social designs. `href: null` means it's coming soon:
// the tile is shown with a placeholder preview but isn't clickable yet.
const TOOLS = [
  {
    id: "proposals",
    title: "Proposals & Candidate Packs",
    blurb: "Client proposals and candidate packs, ready to send.",
    href: null,
    icon: "doc",
  },
  {
    id: "request",
    title: "Marketing Request Form",
    blurb: "Ask the marketing team for something new.",
    href: null,
    icon: "form",
  },
  {
    id: "content",
    title: "Content Portal",
    blurb: "Our shared marketing content, in Google Drive.",
    href: "https://drive.google.com/drive/folders/1mYJ6Nixmu8soKt-tno6B7CiWPBDqioeX?usp=drive_link",
    icon: "folder",
    external: true,
  },
];

const ICONS = {
  doc: (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M13 5h15l10 10v26a2 2 0 0 1-2 2H13a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
      <path d="M28 5v10h10M17 24h14M17 30h14M17 36h9" />
    </svg>
  ),
  form: (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <rect x="9" y="6" width="30" height="37" rx="3" />
      <path d="M18 6v-1h12v1M15 17h4M23 17h10M15 26h4M23 26h10M15 35h4M23 35h10" />
    </svg>
  ),
  folder: (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M5 13a3 3 0 0 1 3-3h10l4 5h18a3 3 0 0 1 3 3v19a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V13Z" />
      <path d="M5 20h38" />
    </svg>
  ),
};

function ToolCard({ t }) {
  const inner = (
    <>
      <h2 className="card-title">{t.title}</h2>
      <div className={"tool-img" + (t.href ? "" : " soon")}>
        <div className="tool-icon">{ICONS[t.icon]}</div>
        <span className={"tool-tag" + (t.href ? " live" : "")}>{t.href ? (t.external ? "Open in Google Drive ↗" : "Open") : "Coming soon"}</span>
      </div>
      <div className="card-meta">{t.blurb}</div>
    </>
  );
  if (!t.href) return <div className="card card-soon" aria-disabled="true">{inner}</div>;
  return (
    <a href={t.href} className="card" {...(t.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {inner}
    </a>
  );
}

export default function Home() {
  return (
    <main className="wrap">
      <h1 className="h1">Marketing Hub<span className="g">.</span></h1>
      <p className="lede">Everything you need from marketing in one place.</p>

      <div className="tools">
        {TOOLS.map((t) => <ToolCard key={t.id} t={t} />)}
      </div>

      <h2 className="section-title">Social designs<span className="g">.</span></h2>
      <p className="lede">Pick the post you want to make, fill in the details and download it ready for LinkedIn.</p>

      <div className="grid">
        {DESIGNS.map((d) => (
          <a key={d.id} href={`/d/${d.id}`} className="card">
            <h2 className="card-title">{d.title}</h2>
            <div className="card-img">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/render/${d.id}?sample=1`} alt={`${d.title} example`} loading="lazy" />
            </div>
            <div className="card-meta">{d.slidesLabel || (d.slides === 1 ? "1 image" : `${d.slides} slides`)} · {d.blurb}</div>
          </a>
        ))}
      </div>
    </main>
  );
}

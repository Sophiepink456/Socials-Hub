import { ElevationLogo, ElevationWordmark } from "./Wordmarks";

export const metadata = { title: "Elevation Hub" };

// The hub's front door. Each area gets a tile; `href: null` shows it as coming soon.
const AREAS = [
  {
    id: "marketing",
    title: "Marketing Hub",
    blurb: "Social designs, proposals, candidate packs, letterheads and marketing requests.",
    href: "/marketing",
  },
  {
    id: "finance",
    title: "Finance Hub",
    blurb: "Finance tools and documents.",
    href: null,
  },
  {
    id: "commercial",
    title: "Commercial Hub",
    blurb: "Hiring Radar and other commercial tools.",
    href: "/commercial",
  },
  {
    id: "bookings",
    title: "Bookings",
    blurb: "Make and manage bookings.",
    href: null,
  },
];

// The hero video and its first frame come from the Elevation website, so the hub matches it.
const SITE = "https://www.elevationrecruitmentgroup.com/wp-content/uploads/2026/11";

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export default function ElevationHub() {
  return (
    <div className="eh">
      <section className="eh-hero">
        <video className="eh-video" autoPlay muted loop playsInline preload="metadata" poster={`${SITE}/erg_showreel_first_frame.jpg`} aria-hidden="true">
          <source src={`${SITE}/ERG_Showreel_30-seconds-1.mp4`} type="video/mp4" />
        </video>
        <div className="eh-shade" aria-hidden="true" />
        <div className="eh-top">
          <a href="/" aria-label="Elevation Hub home"><ElevationLogo className="eh-logo" /></a>
          <a href="/api/logout" className="eh-pill">Sign out</a>
        </div>
        <div className="eh-hero-text">
          <h1 className="eh-word">
            <ElevationWordmark className="eh-wordmark" />
            <span className="eh-hub">Hub<span className="g">.</span></span>
          </h1>
        </div>
      </section>

      <main className="eh-main">
        <div className="eh-intro">
          <h2>Where do you want to go?</h2>
          <p>Everything you need from across Elevation, in one place.</p>
        </div>
        <div className="eh-grid">
          {AREAS.map((a, i) => {
            const inner = (
              <>
                <span className="eh-num">0{i + 1}</span>
                <h3>{a.title}</h3>
                <p>{a.blurb}</p>
                <span className={"eh-go" + (a.href ? "" : " soon")}>
                  {a.href ? <>Open <Arrow /></> : "Coming soon"}
                </span>
              </>
            );
            return a.href
              ? <a key={a.id} href={a.href} className="eh-tile">{inner}</a>
              : <div key={a.id} className="eh-tile eh-soon" aria-disabled="true">{inner}</div>;
          })}
        </div>
      </main>
    </div>
  );
}

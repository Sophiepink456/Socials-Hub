import { ElevationLogo } from "../Wordmarks";

export const metadata = { title: "Bookings · Elevation Hub" };

// Booking types. They're placeholders for now: give one an `href` to switch its tile on.
const BOOKINGS = [
  { id: "car-wash", title: "Car Wash Bookings", blurb: "Book a car wash.", href: null },
  { id: "seb", title: "Seb Bookings", blurb: "Book time with Seb.", href: null },
  { id: "sarah-lee-training", title: "Sarah-Lee Training", blurb: "Book a training session with Sarah-Lee.", href: null },
];

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export default function Bookings() {
  return (
    <div className="eh">
      <header className="eh-top eh-top-sub">
        <a href="/" aria-label="Elevation Hub home"><ElevationLogo className="eh-logo" /></a>
        <a href="/api/logout" className="eh-pill">Sign out</a>
      </header>

      <main className="eh-main">
        <a href="/" className="eh-back">← Elevation Hub</a>
        <h1 className="eh-title">Bookings<span className="g">.</span></h1>
        <p className="eh-lede">Choose what you&apos;d like to book.</p>

        <div className="eh-grid eh-grid-3">
          {BOOKINGS.map((b, i) => {
            const inner = (
              <>
                <span className="eh-num">0{i + 1}</span>
                <h3>{b.title}</h3>
                <p>{b.blurb}</p>
                <span className={"eh-go" + (b.href ? "" : " soon")}>
                  {b.href ? <>Book <Arrow /></> : "Coming soon"}
                </span>
              </>
            );
            return b.href
              ? <a key={b.id} href={b.href} className="eh-tile">{inner}</a>
              : <div key={b.id} className="eh-tile eh-soon" aria-disabled="true">{inner}</div>;
          })}
        </div>
      </main>
    </div>
  );
}

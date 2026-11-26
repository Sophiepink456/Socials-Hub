import { ElevationLogo } from "../../Wordmarks";

export const metadata = { title: "Sarah-Lee Training · Elevation Hub" };

// Sarah-Lee's existing Microsoft Bookings page, shown inside the hub. Bookings still go through
// Microsoft straight into her Outlook calendar (only when she's free); the hub stores nothing.
// To change services, times or availability, edit the booking page in Microsoft Bookings.
const BOOKING_PAGE = "https://outlook.office365.com/owa/calendar/SarahLeeTrainingSessions@elevationrecruitment.com/bookings/";

export default function SarahLeeTraining() {
  return (
    <div className="eh">
      <header className="eh-top eh-top-sub">
        <a href="/" aria-label="Elevation Hub home"><ElevationLogo className="eh-logo" /></a>
        <a href="/api/logout" className="eh-pill">Sign out</a>
      </header>
      <main className="eh-main">
        <a href="/bookings" className="eh-back">← Bookings</a>
        <h1 className="eh-title">Sarah-Lee Training<span className="g">.</span></h1>
        <p className="eh-lede">
          Pick a training slot, then a date and time Sarah-Lee is free. Your booking goes straight into her calendar and you&apos;ll get a confirmation email.{" "}
          <a href={BOOKING_PAGE} target="_blank" rel="noopener noreferrer" className="sl-out">Open in a new tab ↗</a>
        </p>
        <div className="sl-frame">
          <iframe src={BOOKING_PAGE} title="Book a training session with Sarah-Lee" loading="lazy" allow="clipboard-write" />
        </div>
      </main>
    </div>
  );
}

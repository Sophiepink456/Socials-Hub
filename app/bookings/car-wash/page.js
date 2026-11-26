import { ElevationLogo } from "../../Wordmarks";
import CarWash from "./CarWash";

export const metadata = { title: "Car Wash Bookings · Elevation Hub" };

export default function CarWashPage() {
  return (
    <div className="eh">
      <header className="eh-top eh-top-sub">
        <a href="/" aria-label="Elevation Hub home"><ElevationLogo className="eh-logo" /></a>
        <a href="/api/logout" className="eh-pill">Sign out</a>
      </header>
      <main className="eh-main">
        <a href="/bookings" className="eh-back">← Bookings</a>
        <h1 className="eh-title">Car Wash Bookings<span className="g">.</span></h1>
        <p className="eh-lede">The car wash comes every other Tuesday. Type your name, then book a date.</p>
        <CarWash />
      </main>
    </div>
  );
}

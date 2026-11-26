import { ElevationLogo } from "../../Wordmarks";
import Policies from "./Policies";

export const metadata = { title: "External Policies · Commercial Hub" };

export default function PoliciesPage() {
  return (
    <div className="eh">
      <header className="eh-top eh-top-sub">
        <a href="/" aria-label="Elevation Hub home"><ElevationLogo className="eh-logo" /></a>
        <a href="/api/logout" className="eh-pill">Sign out</a>
      </header>
      <main className="eh-main">
        <a href="/commercial" className="eh-back">← Commercial Hub</a>
        <h1 className="eh-title">External Policies<span className="g">.</span></h1>
        <p className="eh-lede">Elevation&apos;s policies for clients, tenders and PSLs. Open one to read it, or download it to send on.</p>
        <Policies />
      </main>
    </div>
  );
}

import Settings from "./Settings";

export const metadata = { title: "Settings · Marketing Hub", robots: { index: false } };

export default function SettingsPage() {
  return (
    <main className="wrap">
      <a href="/" className="back">← Marketing Hub</a>
      <h1 className="h1">Settings<span className="g">.</span></h1>
      <p className="lede">Every proposal in progress, who proposals go to, and links used in the PDFs.</p>
      <Settings />
    </main>
  );
}

import Letterhead from "./Letterhead";

export default function LetterheadPage() {
  return (
    <main className="wrap wrap-wide">
      <a href="/" className="back">← Marketing Hub</a>
      <h1 className="h1">Elevation Marketing Hub<span className="g">.</span></h1>
      <p className="lede">Upload a Word document, PDF or text file. The hub lays it out on the Powered by Elevation letterhead, with our fonts, headings, tables and colours. Then send it for proof-reading: once it’s checked and signed off, the finished PDF comes back to you by email and into your Saved Docs.</p>
      <Letterhead />
    </main>
  );
}

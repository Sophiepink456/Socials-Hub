import Letterhead from "./Letterhead";

export default function LetterheadPage() {
  return (
    <main className="wrap wrap-wide">
      <a href="/" className="back">← Marketing Hub</a>
      <h1 className="h1">Powered by Elevation<span className="g">.</span></h1>
      <p className="lede">Upload a Word document, PDF or text file. The hub lays it out on the Elevation letterhead, with our fonts, headings, tables and colours, ready to download as a PDF.</p>
      <Letterhead />
    </main>
  );
}

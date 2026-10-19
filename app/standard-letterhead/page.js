import Letterhead from "../letterhead/Letterhead";

export const metadata = { title: "Standard Letterheads · Marketing Hub" };

// Same tool as Powered by Elevation, on the Elevation Recruitment Group letterhead.
export default function StandardLetterheadPage() {
  return (
    <main className="wrap wrap-wide">
      <a href="/" className="back">← Marketing Hub</a>
      <h1 className="h1">Standard Letterheads<span className="g">.</span></h1>
      <p className="lede">Upload a Word document, PDF or text file. The hub lays it out on the Elevation Recruitment Group letterhead, with our fonts, headings, tables and colours. Then send it for proof-reading: once it’s checked and signed off, the finished PDF comes back to you by email and into your Saved Docs.</p>
      <Letterhead brand="standard" />
    </main>
  );
}

import CandidateEditor from "../CandidateEditor";

export const metadata = { title: "Candidate Pack · Marketing Hub" };

export default function CandidatePackPage() {
  return (
    <main className="wrap wrap-wide">
      <a href="/proposals" className="back">← Proposals & Candidate Packs</a>
      <h1 className="h1">Candidate Pack<span className="g">.</span></h1>
      <p className="lede">Fill in each section and the pack builds alongside. Boxes stop at their limit so everything fits the design.</p>
      <CandidateEditor />
    </main>
  );
}

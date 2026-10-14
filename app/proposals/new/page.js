import ProposalEditor from "../ProposalEditor";

export const metadata = { title: "Proposal · Marketing Hub" };

export default function NewProposalPage() {
  return (
    <main className="wrap wrap-wide">
      <a href="/proposals" className="back">← Proposals & Candidate Packs</a>
      <h1 className="h1">Recruitment Proposal<span className="g">.</span></h1>
      <p className="lede">Fill in each section and the proposal builds alongside. Boxes stop at their limit so everything fits the design.</p>
      <ProposalEditor />
    </main>
  );
}

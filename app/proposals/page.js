import ProposalEditor from "./ProposalEditor";

export const metadata = { title: "Proposals & Candidate Packs · Marketing Hub" };

// Choose what to make. Older draft links (/proposals?draft=…) still open the proposal form.
export default function ProposalsPage({ searchParams }) {
  if (searchParams && searchParams.draft) {
    return (
      <main className="wrap wrap-wide">
        <a href="/proposals" className="back">← Proposals & Candidate Packs</a>
        <h1 className="h1">Recruitment Proposal<span className="g">.</span></h1>
        <p className="lede">Fill in each section and the proposal builds alongside. Boxes stop at their limit so everything fits the design.</p>
        <ProposalEditor />
      </main>
    );
  }
  const cards = [
    { href: "/proposals/new", title: "Proposal", img: "/proposal/preview.jpg", tag: "Start a proposal", blurb: "The client proposal: our understanding, approach, search process, terms and fees." },
    { href: "/proposals/candidate-pack", title: "Candidate Pack", img: "/proposal/pack-preview.jpg", tag: "Start a candidate pack", blurb: "The pack for candidates: about the client, the role, what's on offer and next steps." },
  ];
  return (
    <main className="wrap">
      <a href="/" className="back">← Marketing Hub</a>
      <h1 className="h1">Proposals & Candidate Packs<span className="g">.</span></h1>
      <p className="lede">What would you like to put together?</p>
      <div className="tools" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        {cards.map((c) => (
          <a key={c.href} href={c.href} className="card">
            <h2 className="card-title">{c.title}</h2>
            <div className="tool-img">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.img} alt="" className="tool-photo" />
              <span className="tool-tag live">{c.tag}</span>
            </div>
            <div className="card-meta">{c.blurb}</div>
          </a>
        ))}
      </div>
    </main>
  );
}

import InductionEditor from "./InductionEditor";

export const metadata = { title: "Induction Schedule · SLT" };

export default function Page() {
  return (
    <main className="wrap" style={{ maxWidth: 1400 }}>
      <p className="hint" style={{ margin: "0 0 8px" }}><a href="/slt">← SLT</a></p>
      <h1 className="h1">Induction Schedule<span className="g">.</span></h1>
      <p className="lede">Pick the buddy and the people in the colour key from the headshots, fill in the sessions and download the PDF. Nothing is saved on the hub.</p>
      <InductionEditor />
    </main>
  );
}

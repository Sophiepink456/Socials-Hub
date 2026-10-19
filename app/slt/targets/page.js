import TargetsEditor from "./TargetsEditor";

export const metadata = { title: "Promotional Targets · SLT" };

export default function Page() {
  return (
    <main className="wrap" style={{ maxWidth: 1400 }}>
      <p className="hint" style={{ margin: "0 0 8px" }}><a href="/slt">← SLT</a></p>
      <h1 className="h1">Promotional Targets<span className="g">.</span></h1>
      <p className="lede">Fill in the targets and download the slides as a PDF. Nothing is saved on the hub.</p>
      <TargetsEditor />
    </main>
  );
}

import { notFound } from "next/navigation";
import { getDesign } from "../../../lib/designs";
import Editor from "./Editor";

export default function DesignPage({ params }) {
  const design = getDesign(params.id);
  if (!design) notFound();
  return (
    <main className="wrap">
      <a href="/" className="back">← All designs</a>
      <h1 className="h1">{design.title}<span className="g">.</span></h1>
      <p className="lede">Fill in the details. The preview updates as you type.</p>
      <Editor id={design.id} />
    </main>
  );
}

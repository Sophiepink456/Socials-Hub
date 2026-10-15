import { Suspense } from "react";
import Library from "./Library";

export const metadata = { title: "Saved Docs · Marketing Hub", robots: { index: false } };

export default function SavedPage() {
  return (
    <main className="wrap">
      <a href="/" className="back">← Marketing Hub</a>
      <h1 className="h1">Saved Docs<span className="g">.</span></h1>
      <Suspense fallback={<p className="hint">Opening…</p>}>
        <Library />
      </Suspense>
    </main>
  );
}

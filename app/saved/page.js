import { Suspense } from "react";
import Library from "./Library";

export const metadata = { title: "Saved designs · Marketing Hub", robots: { index: false } };

export default function SavedPage() {
  return (
    <main className="wrap">
      <Suspense fallback={<p className="hint">Opening…</p>}>
        <Library />
      </Suspense>
    </main>
  );
}

import Review from "./Review";

export const metadata = { title: "Proof-read proposal · Marketing Hub", robots: { index: false } };

export default function ReviewPage({ params, searchParams }) {
  return (
    <main className="wrap wrap-wide">
      <a href="/settings" className="back">← Settings</a>
      <Review id={params.id} k={searchParams.k || ""} />
    </main>
  );
}

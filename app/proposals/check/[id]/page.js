import Check from "./Check";

export const metadata = { title: "Check proposal · Marketing Hub", robots: { index: false } };

export default function CheckPage({ params, searchParams }) {
  return (
    <main className="wrap">
      <Check id={params.id} c={searchParams.c || ""} />
    </main>
  );
}

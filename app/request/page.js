import RequestForm from "./RequestForm";

export const metadata = { title: "Marketing Request Form · Marketing Hub" };

export default function RequestPage() {
  return (
    <main className="wrap" style={{ maxWidth: 820 }}>
      <p className="hint" style={{ margin: "0 0 8px" }}><a href="/">← Back to the hub</a></p>
      <h1 className="h1">Marketing Request Form<span className="g">.</span></h1>
      <p className="lede">Ask the marketing team for something new. Fill in the form and it goes straight onto the marketing team’s board on monday.com. If you have any specific instructions or extra notes, add them under Content required.</p>
      <RequestForm />
    </main>
  );
}

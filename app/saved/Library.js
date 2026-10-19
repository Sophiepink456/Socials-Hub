"use client";

// Saved Docs: your own proposals and candidate packs once they've been signed off.
// Private to you: opened with the private link emailed to you, which this browser then remembers.
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const KEY = "hub-saved-docs";
const day = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");

export default function Library() {
  const qs = useSearchParams();
  const [token, setToken] = useState(undefined);
  const [docs, setDocs] = useState(null);
  const [err, setErr] = useState("");

  // A link from the email wins; otherwise use the one this browser remembers.
  useEffect(() => {
    const t = qs.get("t");
    let saved = "";
    try { saved = localStorage.getItem(KEY) || ""; } catch {}
    if (t) {
      try { localStorage.setItem(KEY, t); } catch {}
      window.history.replaceState(null, "", "/saved");
    }
    setToken(t || saved || "");
  }, [qs]);

  useEffect(() => {
    if (!token) return;
    setDocs(null); setErr("");
    fetch(`/api/library?t=${encodeURIComponent(token)}`, { cache: "no-store" }).then((r) => r.json()).then((j) => {
      if (j.error) { setErr(j.error); try { localStorage.removeItem(KEY); } catch {} setToken(""); return; }
      setDocs(j);
    }).catch(() => setErr("Couldn't open your Saved Docs. Try again in a moment."));
  }, [token]);

  function signOut() {
    try { localStorage.removeItem(KEY); } catch {}
    setDocs(null); setToken("");
  }

  if (token === undefined) return <p className="hint">Opening…</p>;
  if (!token) return <AskForLink err={err} />;
  if (!docs) return err ? <p className="hint warn">{err}</p> : <p className="hint">Opening your Saved Docs…</p>;

  const list = (items, word) => (
    <>
      <h2 className="section-title">{word}<span className="g">.</span></h2>
      {items.length ? (
        <table className="table">
          <thead><tr><th>Document</th><th>Signed off</th><th></th></tr></thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.id}>
                <td>{d.title}</td>
                <td style={{ whiteSpace: "nowrap" }}>{day(d.date)}</td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}><a href={d.pdf} target="_blank" rel="noreferrer">Open PDF</a> · <a href={d.pdf} download={d.pdfName || true}>Download</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : <p className="hint">None signed off yet.</p>}
    </>
  );
  return (
    <>
      <p className="lede">Your proposals, candidate packs, Powered by Elevation documents and Standard Letterheads once they’ve been signed off. Only you can see this page: it’s opened with your private link.</p>
      <p className="hint" style={{ marginTop: -18 }}>{docs.email} · <button type="button" className="link muted" onClick={signOut}>Not you? Sign out of this browser</button></p>
      {list(docs.proposals, "Proposals")}
      {list(docs.packs, "Candidate packs")}
      {list(docs.letters || [], "Powered by Elevation documents")}
      {list(docs.standard || [], "Standard Letterheads")}
    </>
  );
}

function AskForLink({ err }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState({ busy: false, msg: "" });
  async function send(e) {
    e.preventDefault();
    setState({ busy: true, msg: "" });
    try {
      const r = await fetch("/api/library", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setState({ busy: false, msg: `Sent. Check ${email.trim()} for “Your Saved Docs link” and open it on this computer. It’ll remember you after that.` });
    } catch (x) { setState({ busy: false, msg: x.message || "Couldn't send the link." }); }
  }
  return (
    <>
      <p className="lede">Your own proposals, candidate packs, Powered by Elevation documents and Standard Letterheads once they’ve been signed off. Each person’s Saved Docs are private: enter your work email and we’ll email you your own link.</p>
      {err ? <p className="hint warn">{err}</p> : null}
      <form className="panel" style={{ maxWidth: 460 }} onSubmit={send}>
        <div className="row">
          <label className="label" htmlFor="sd-email"><span>Your work email</span></label>
          <input id="sd-email" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@elevationrecruitment.com" autoFocus />
        </div>
        {state.msg ? <div className="done-msg" style={{ marginBottom: 10 }}>{state.msg}</div> : null}
        <div className="actions"><button className="btn btn-primary" type="submit" disabled={state.busy}>{state.busy ? "Sending…" : "Email me my link"}</button></div>
      </form>
    </>
  );
}

"use client";

import { useState } from "react";

export default function Unlock() {
  const [pw, setPw] = useState("");
  const [state, setState] = useState({ busy: false, err: "" });
  async function submit(e) {
    e.preventDefault();
    setState({ busy: true, err: "" });
    try {
      const r = await fetch("/api/slt/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      window.location.reload();
    } catch (x) { setState({ busy: false, err: x.message || "Couldn't unlock." }); }
  }
  return (
    <form className="panel slt-lock" onSubmit={submit}>
      <div className="row">
        <label className="label" htmlFor="slt-pw"><span>SLT password</span></label>
        <input id="slt-pw" type="password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus autoComplete="off" required />
      </div>
      {state.err ? <div className="hint warn">{state.err}</div> : null}
      <div className="actions"><button className="btn btn-primary" type="submit" disabled={state.busy}>{state.busy ? "Checking…" : "Unlock"}</button></div>
      <p className="hint" style={{ marginBottom: 0 }}>Stays unlocked on this browser for 12 hours, or until you press Lock.</p>
    </form>
  );
}

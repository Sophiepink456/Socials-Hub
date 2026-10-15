"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function LoginForm() {
  const next = useSearchParams().get("next") || "/";
  const [pw, setPw] = useState("");
  const [state, setState] = useState({ busy: false, err: "" });
  async function submit(e) {
    e.preventDefault();
    setState({ busy: true, err: "" });
    try {
      const r = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      // Only go back to a page on this site.
      window.location.assign(next.startsWith("/") && !next.startsWith("//") ? next : "/");
    } catch (x) { setState({ busy: false, err: x.message || "Couldn't sign in." }); }
  }
  return (
    <form className="panel" style={{ maxWidth: 420 }} onSubmit={submit}>
      <div className="row">
        <label className="label" htmlFor="pw"><span>Password</span></label>
        <input id="pw" type="password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus autoComplete="current-password" required />
      </div>
      {state.err ? <div className="hint warn">{state.err}</div> : null}
      <div className="actions"><button className="btn btn-primary" type="submit" disabled={state.busy}>{state.busy ? "Checking…" : "Sign in"}</button></div>
      <p className="hint" style={{ marginBottom: 0 }}>This browser stays signed in for 30 days.</p>
    </form>
  );
}

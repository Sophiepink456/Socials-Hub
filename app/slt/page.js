// The SLT folder: confidential documents for the senior leadership team. It needs its own
// password on top of the hub one (lib/gate.js); nothing made here is stored on the hub.
import { cookies } from "next/headers";
import { SLT_COOKIE, verifySltToken } from "../../lib/gate";
import Unlock from "./Unlock";

export const dynamic = "force-dynamic";

const DOCS = [
  { href: "/slt/targets", title: "Promotional Targets", blurb: "Slide deck of promotion targets: objective, expectations and key skills.",
    icon: <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="17" /><circle cx="24" cy="24" r="10" /><circle cx="24" cy="24" r="3" /><path d="M24 24 40 8M34 8h6v6" /></svg> },
  { href: "/slt/induction", title: "Induction Schedule", blurb: "Two-week induction timetable with the buddy and colour key.",
    icon: <svg viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="9" width="36" height="33" rx="3" /><path d="M6 18h36M15 5v8M33 5v8M13 25h6M21 25h6M29 25h6M13 32h6M21 32h6" /></svg> },
];

export default async function SltPage() {
  const ok = await verifySltToken(cookies().get(SLT_COOKIE)?.value);
  return (
    <main className="wrap">
      <div className="slt-head">
        <div>
          <h1 className="h1">SLT<span className="g">.</span></h1>
          <p className="lede">{ok ? "Confidential documents. Fill one in and download the PDF – nothing is saved on the hub." : "This folder is password protected."}</p>
        </div>
        <div className="actions" style={{ margin: 0 }}>
          <a className="btn btn-ghost" href="/">← Back to the hub</a>
          {ok ? <a className="btn btn-ghost" href="/api/slt/lock">Lock</a> : null}
        </div>
      </div>
      {ok ? (
        <div className="slt-list">
          {DOCS.map((d) => (
            <a key={d.href} href={d.href} className="slt-doc">
              {d.icon}
              <div><strong>{d.title}</strong><span>{d.blurb}</span></div>
            </a>
          ))}
        </div>
      ) : <Unlock />}
    </main>
  );
}

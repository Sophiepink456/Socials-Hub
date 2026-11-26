"use client";
import { useEffect, useState } from "react";
import { longDate } from "../../../lib/carwash";

const NAME_KEY = "carwash-name";
const MINE_KEY = "carwash-mine"; // { bookingId: key } for bookings made in this browser
const PASS_KEY = "hub-passcode"; // same passcode as Marketing Team Access (Settings)

const readMine = () => { try { return JSON.parse(localStorage.getItem(MINE_KEY) || "{}"); } catch { return {}; } };
const writeMine = (m) => { try { localStorage.setItem(MINE_KEY, JSON.stringify(m)); } catch {} };

export default function CarWash() {
  const [data, setData] = useState(null);
  const [name, setName] = useState("");
  const [mine, setMine] = useState({});
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [manage, setManage] = useState(false);
  const [pass, setPass] = useState("");
  const [cap, setCap] = useState("");
  const [newDate, setNewDate] = useState("");

  async function call(method, body, admin) {
    const r = await fetch("/api/carwash", {
      method,
      headers: { "Content-Type": "application/json", ...(admin ? { "x-passcode": pass } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: "no-store",
    }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    if (!r || !r.ok) {
      if (r && r.status === 401) { try { sessionStorage.removeItem(PASS_KEY); } catch {} }
      throw new Error(j.error || "Something went wrong. Please try again.");
    }
    if (admin) { try { sessionStorage.setItem(PASS_KEY, pass); } catch {} }
    if (j.dates) { setData(j); setCap(String(j.capacity)); }
    return j;
  }

  useEffect(() => {
    try { setName(localStorage.getItem(NAME_KEY) || ""); setPass(sessionStorage.getItem(PASS_KEY) || ""); } catch {}
    setMine(readMine());
    call("GET").catch((e) => setErr(e.message));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function run(label, fn) {
    setBusy(label); setErr(""); setMsg("");
    try { await fn(); } catch (e) { setErr(e.message); }
    setBusy("");
  }

  const book = (day) => run(day.date, async () => {
    if (!name.trim()) throw new Error("Type your name at the top first.");
    try { localStorage.setItem(NAME_KEY, name.trim()); } catch {}
    const j = await call("POST", { date: day.date, name });
    const m = { ...readMine(), [j.id]: j.key };
    writeMine(m); setMine(m);
    const full = day.bookings.length >= data.capacity;
    setMsg(`${j.name} is ${full ? "on the reserve list" : "booked in"} for ${longDate(day.date)}.`);
  });

  const unbook = (day, b) => run(day.date, async () => {
    if (!window.confirm(`Remove ${b.name} from ${longDate(day.date)}?`)) return;
    await call("DELETE", { date: day.date, id: b.id, key: mine[b.id] }, manage && !mine[b.id]);
    const m = readMine(); delete m[b.id]; writeMine(m); setMine(m);
    setMsg(`${b.name} removed from ${longDate(day.date)}.`);
  });

  const setting = (s, label) => run(label, () => call("POST", { settings: s }, true));

  const removeDay = (day) => {
    const n = day.bookings.length;
    const warn = n ? ` ${n} ${n === 1 ? "person is" : "people are"} booked on it and won't see it any more.` : "";
    if (!window.confirm(`Remove ${longDate(day.date)} from the page?${warn}`)) return;
    setting({ removeDate: day.date }, day.date).then(() => setMsg(`${longDate(day.date)} removed. You can put it back at the bottom of the page.`));
  };

  if (!data) return err ? <p className="pol-err">{err}</p> : <p className="pol-empty">Loading…</p>;
  const next = data.dates.find((d) => !d.cancelled);

  return (
    <div className="cw">
      <div className="cw-bar">
        <label className="cw-label" htmlFor="cw-name">Your name</label>
        <input id="cw-name" className="pol-search" placeholder="e.g. Kelly J" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        <span className="cw-hint">{data.capacity} places each time. Once it&apos;s full you&apos;ll go on the reserve list.</span>
      </div>
      {!manage && msg && <p className="pol-msg">{msg}</p>}
      {!manage && err && <p className="pol-err">{err}</p>}

      <div className="cw-grid">
        {data.dates.map((day) => {
          const booked = day.bookings.slice(0, data.capacity);
          const reserve = day.bookings.slice(data.capacity);
          const left = data.capacity - booked.length;
          const already = name.trim() && day.bookings.some((b) => b.name.toLowerCase() === name.trim().toLowerCase());
          return (
            <section key={day.date} className={"cw-day" + (day.cancelled ? " off" : "") + (next && next.date === day.date ? " next" : "")}>
              <div className="cw-head">
                <h3>{longDate(day.date)}</h3>
                {day.cancelled ? <span className="cw-tag">Not running</span>
                  : next && next.date === day.date ? <span className="cw-tag on">Next</span>
                  : day.extra ? <span className="cw-tag">Extra date</span> : null}
              </div>
              {!day.cancelled && <p className="cw-count">{left > 0 ? `${left} of ${data.capacity} places left` : "Full"}</p>}
              <ol className="cw-list">
                {booked.map((b) => (
                  <li key={b.id}>
                    <span>{b.name}</span>
                    {(mine[b.id] || manage) && <button type="button" className="cw-x" onClick={() => unbook(day, b)} disabled={!!busy}>Remove</button>}
                  </li>
                ))}
                {!day.cancelled && Array.from({ length: Math.max(0, left) }).map((_, i) => <li key={"e" + i} className="cw-empty">Free</li>)}
              </ol>
              {reserve.length > 0 && (
                <>
                  <p className="cw-sub">Reserve list</p>
                  <ol className="cw-list cw-reserve">
                    {reserve.map((b) => (
                      <li key={b.id}>
                        <span>{b.name}</span>
                        {(mine[b.id] || manage) && <button type="button" className="cw-x" onClick={() => unbook(day, b)} disabled={!!busy}>Remove</button>}
                      </li>
                    ))}
                  </ol>
                </>
              )}
              {!day.cancelled && (
                <button type="button" className={"cw-book" + (left > 0 ? "" : " alt")} onClick={() => book(day)} disabled={!!busy || already}>
                  {busy === day.date ? "Saving…" : already ? "You're on this date" : left > 0 ? "Book me in" : "Join the reserve list"}
                </button>
              )}
              {manage && (
                <div className="cw-admin-day">
                  {day.cancelled
                    ? <button type="button" className="pol-btn" onClick={() => setting({ restore: day.date }, day.date)} disabled={!!busy || !pass}>Car wash is running</button>
                    : <button type="button" className="pol-btn pol-del" onClick={() => setting({ cancel: day.date }, day.date)} disabled={!!busy || !pass}>Not running this date</button>}
                  <button type="button" className="pol-btn pol-del" onClick={() => removeDay(day)} disabled={!!busy || !pass}>Remove date</button>
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div className="pol-foot">
        <button type="button" className="pol-manage" onClick={() => { setManage(!manage); setMsg(""); setErr(""); }}>
          {manage ? "Done" : "Marketing team: manage car wash dates"}
        </button>
        {manage && (
          <div className="pol-admin">
            <p>Enter the Marketing Team Access passcode. Each date above now has “Not running this date” (it stays on the page, greyed out) and “Remove date” (it comes off the page altogether), plus Remove buttons on every booking. Use “Add a date” when the car wash comes on a different day (for example a Wednesday instead of the Tuesday). Mark the usual Tuesday as not running too.</p>
            <div className="pol-admin-row">
              <input className="pol-search" type="password" placeholder="Passcode" value={pass} onChange={(e) => setPass(e.target.value)} aria-label="Marketing Team Access passcode" autoComplete="off" />
            </div>
            <div className="pol-admin-row cw-admin-row">
              <label className="cw-label" htmlFor="cw-cap">Places per date</label>
              <input id="cw-cap" className="pol-search cw-small" type="number" min="1" max="50" value={cap} onChange={(e) => setCap(e.target.value)} />
              <button type="button" className="pol-btn" onClick={() => setting({ capacity: Number(cap) }, "cap")} disabled={!!busy || !pass}>Save</button>
            </div>
            <div className="pol-admin-row cw-admin-row">
              <label className="cw-label" htmlFor="cw-add">Add a date</label>
              <input id="cw-add" className="pol-search cw-small" type="date" min={data.today} value={newDate} onChange={(e) => setNewDate(e.target.value)} />
              <button type="button" className="pol-btn" onClick={() => setting({ addDate: newDate }, "add").then(() => setNewDate(""))} disabled={!!busy || !pass || !newDate}>Add</button>
            </div>
            {data.removed && data.removed.length > 0 && (
              <div className="cw-removed">
                <p className="cw-label">Removed dates</p>
                <ul>
                  {data.removed.map((d) => (
                    <li key={d}>
                      <span>{longDate(d)}</span>
                      <button type="button" className="pol-btn" onClick={() => setting({ putBack: d }, d)} disabled={!!busy || !pass}>Put back</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {msg && <p className="pol-msg">{msg}</p>}
            {err && <p className="pol-err">{err}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

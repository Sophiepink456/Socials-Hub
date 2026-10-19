// The induction schedule, one A4 landscape page (1123 x 794 px), laid out from the Figma
// "Schedule — Buddy" frame (rD8fazmrI53ABdD4hWcTrn, node 39:2). Fonts: Poppins.
import { Fit, px } from "./Fit";
import { OWNERS, ownerById, photoOf, normaliseInduction } from "./induction";

const W = 1123;
const H = 794;
const INNER = W - 60;
const P = "/slt/induction/";

const Face = ({ name, size, ring }) => {
  const src = photoOf(name);
  return (
    <div style={{ width: size, height: size, flex: "none", borderRadius: 38, border: `2.5px solid ${ring}`, overflow: "hidden", background: "#3a3839" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : null}
    </div>
  );
};

function Cell({ label, list }) {
  const shown = list.filter((s) => String(s.text).trim());
  return (
    <div style={{ height: 220, background: "rgba(255,255,255,0.16)", borderRadius: 2, padding: "9px 7px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
      <p style={{ fontWeight: 300, fontSize: 8, letterSpacing: 0.8, textAlign: "center", lineHeight: "normal" }}>{label}</p>
      <Fit style={{ position: "relative", flex: "1 1 0", minHeight: 0, display: "flex", flexDirection: "column", gap: px(10), alignItems: "center", justifyContent: "center" }}>
        {shown.map((s, i) => {
          const o = ownerById(s.who);
          return (
            <p key={i} className="ind-pre" style={{ fontWeight: 600, fontSize: px(9.5), lineHeight: 1.22, textAlign: "center", width: "100%", color: o ? o.text : "#fff", overflowWrap: "break-word" }}>{String(s.text).trim().replace(/\//g, "/\u200b")}</p>
          );
        })}
      </Fit>
    </div>
  );
}

function Day({ d, width }) {
  return (
    <div style={{ width, flex: "none", display: "flex", flexDirection: "column", gap: 5, height: "100%" }}>
      <div style={{ height: 30, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <p style={{ fontWeight: 300, fontSize: 14.5, lineHeight: 1.25, letterSpacing: 1.1, width: "100%", textTransform: "uppercase", whiteSpace: "nowrap" }}>{d.name}</p>
        {String(d.note).trim() ? <p style={{ fontWeight: 300, fontSize: 7.6, lineHeight: 1.1, letterSpacing: 0.4, color: "rgba(255,255,255,0.72)", width: "100%" }}>{d.note}</p> : null}
      </div>
      <Cell label="AM" list={d.am} />
      <div style={{ height: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontWeight: 500, fontSize: 9, textAlign: "center", lineHeight: "normal", whiteSpace: "nowrap", overflow: "hidden" }}>{d.lunch}</p>
      </div>
      <Cell label="PM" list={d.pm} />
    </div>
  );
}

const WeekLabel = ({ label }) => (
  <div style={{ width: 22, flex: "none", height: "100%", position: "relative" }}>
    <div style={{ position: "absolute", left: 11, top: 251.5, transform: "translate(-50%, -50%) rotate(-90deg)", whiteSpace: "nowrap" }}>
      <p style={{ fontWeight: 300, fontSize: 15, letterSpacing: 4.5, lineHeight: "normal" }}>{label}</p>
    </div>
  </div>
);

export function InductionSheet({ data }) {
  const d = normaliseInduction(data);
  const weeks = d.weeks.filter((w) => w.days.length);
  const nDays = weeks.reduce((n, w) => n + w.days.length, 0) || 1;
  const nWeeks = weeks.length || 1;
  // Day columns share the width left after the week labels and the 8px gaps.
  const dayW = (INNER - 22 * nWeeks - 8 * (2 * nWeeks - 1) - 8 * (nDays - nWeeks)) / nDays;
  const key = d.key.filter((k) => String(k.person).trim());
  const buddy = String(d.buddy).trim();
  return (
    <div className="ind" style={{ width: W, height: H }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={P + "bg.jpg"} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 12, padding: "26px 30px 20px", height: "100%" }}>
        <div style={{ display: "flex", gap: 24, alignItems: "flex-end", justifyContent: "flex-end", width: "100%" }}>
          <div style={{ flex: "1 1 0", minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 11, alignItems: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={P + "erg-mark.png"} alt="" style={{ width: 54, height: 53, objectFit: "contain", flex: "none" }} />
              <p style={{ fontWeight: 300, fontSize: 62, lineHeight: 1.1, letterSpacing: 0.5, whiteSpace: "nowrap" }}>{d.title}</p>
            </div>
            {String(d.intro1).trim() ? <p className="ind-pre" style={{ fontWeight: 500, fontSize: 12, lineHeight: 1.52, width: 509 }}>{d.intro1}</p> : null}
            {String(d.intro2).trim() ? <p className="ind-pre" style={{ fontWeight: 500, fontSize: 12, lineHeight: 1.52, width: 509 }}>{d.intro2}</p> : null}
          </div>
          {buddy ? (
            <div style={{ width: 469, height: 126, flex: "none", display: "flex", gap: 13, alignItems: "flex-start", justifyContent: "flex-end" }}>
              <div style={{ flex: "1 1 0", minWidth: 0, display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", textAlign: "right", fontWeight: 300 }}>
                <p style={{ fontSize: 19.5, lineHeight: 1.2, width: "100%" }}>Your Buddy</p>
                <p style={{ fontSize: 12, lineHeight: 1.5, width: "100%" }}>
                  If you need any support or have questions during your induction, your buddy is <span style={{ fontWeight: 600 }}>{buddy}</span>, who will be happy to help.
                </p>
              </div>
              <Face name={buddy} size={88} ring="#fff" />
            </div>
          ) : null}
        </div>

        <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 2, padding: "3px 12px", display: "flex", gap: 10, alignItems: "flex-start", width: "100%", minHeight: 59 }}>
          <p style={{ fontWeight: 300, fontSize: 9, letterSpacing: 2.6, lineHeight: "normal", flex: "none" }}>KEY</p>
          <div style={{ flex: "1 1 0", minWidth: 0, display: "flex", alignItems: "center" }}>
            {key.map((k) => {
              const o = ownerById(k.owner) || OWNERS[0];
              return (
                <div key={k.owner} style={{ flex: "1 1 0", minWidth: 0, display: "flex", gap: 6, alignItems: "center" }}>
                  <Face name={k.person} size={53} ring={o.ring} />
                  <p style={{ flex: "1 1 0", minWidth: 0, fontWeight: 600, fontSize: 10, lineHeight: 1.28, color: o.text }}>{k.person}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, height: 503, alignItems: "flex-start", width: "100%" }}>
          {weeks.map((w, wi) => (
            <div key={wi} style={{ display: "contents" }}>
              <WeekLabel label={w.label} />
              <div style={{ display: "flex", gap: 8, height: "100%" }}>
                {w.days.map((dd, i) => <Day key={i} d={dd} width={dayW} />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

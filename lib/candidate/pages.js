// The candidate pack pages, each 1920 x 1080, laid out to match the
// "Candidate Pack Design (Live)" Figma file. The client's accent colour replaces Figma's blue.
import { Grad, Fill, Photo, Svg, Header, EMark, stripDot, lines, logoK, INK } from "../proposal/pages";
import { linkedin, instagram, facebook, SOCIAL_URLS } from "../proposal/icons";
import { PACK_TEXT, DEFAULT_ACCENT, DEFAULT_DARK, headshotUrl } from "./data";
import { packPlan, packExtraProps } from "./extra";
import { PHONE30, EMAIL30, INFO30, TICK28, MOUSE, STEP_ICONS, DOTS, LAPTOP, LAPTOP_SCREEN } from "./icons";

const OFF = "#ebebeb";
const okHex = (v, d) => (/^#[0-9a-f]{6}$/i.test(String(v || "").trim()) ? String(v).trim() : d);
const acc = (p) => okHex(p.accent, DEFAULT_ACCENT);
const dark = (p) => okHex(p.dark, DEFAULT_DARK);
// Standard wording, unless changed for this pack in the back office.
const W = (p, k) => {
  const v = p && p.pageText && p.pageText[k];
  return v != null && String(v).trim() !== "" ? String(v) : PACK_TEXT[k];
};
const pos = (p, k) => (p.photoPos || {})[k];
const Dot = ({ p }) => <span style={{ color: acc(p) }}>.</span>;
const site = (u) => {
  const s = String(u || "").trim();
  return !s ? "" : /^https?:\/\//i.test(s) ? s : `https://${s}`;
};


// Centre a block on a line (y = cy) without transforms: Chrome splits PDF pages using the
// layout before transforms, so translate-centred blocks near the bottom could be cut in two.
function Mid({ cy, left, className = "", style, children }) {
  return (
    <div className="abs" style={{ left: 0, top: cy - 540, width: 1920, height: 1080, display: "flex", alignItems: "center", pointerEvents: "none" }}>
      <div className={className} style={{ marginLeft: left, pointerEvents: "auto", ...style }}>{children}</div>
    </div>
  );
}

// A column of text centred in the space between the header and 30px above the footer line.
// The form measures it (data-fit) and won't let more go in once it's full.
function FitBox({ name, x, w, children }) {
  return (
    <div className="abs" data-fit={name} style={{ left: x, top: 130, width: w, height: 804, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div data-fit-inner="">{children}</div>
    </div>
  );
}

function PPage({ p, bg, children }) {
  return <div className="pp" style={{ background: bg, "--acc": acc(p) }}>{children}</div>;
}

// Footer: socials on the left, our website and "Visit Client" on the right.
function Footer({ p, left = INK, right = INK, bg, line = true }) {
  return (
    <div className="abs" style={{ left: 0, top: 964, width: 1920, height: 116, background: bg, borderTop: line ? "1px solid #939393" : "none",
      display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 25, color: left }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 10, height: 10, borderRadius: 5, background: "#93bf20", flex: "none" }} />
          <span className="trim" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.5, whiteSpace: "nowrap" }}>Follow us on socials</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
          <a href={SOCIAL_URLS.linkedin}><Svg svg={linkedin(left)} w={26} h={26} /></a>
          <a href={SOCIAL_URLS.instagram}><Svg svg={instagram(left)} w={26} h={26} /></a>
          <a href={SOCIAL_URLS.facebook}><Svg svg={facebook(left)} w={26} h={26} /></a>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 25, color: right }}>
        <a href="https://www.elevationrecruitmentgroup.com/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Svg svg={MOUSE} w={30} h={30.5} />
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-1px", whiteSpace: "nowrap" }}>www.elevationrg.com</span>
        </a>
        <a href={site(p.clientWebsite) || undefined} style={{ height: 46, padding: "0 16px", border: `1px solid ${right}`, borderRadius: 40, display: "flex", alignItems: "center" }}>
          <span className="trim" style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.5, whiteSpace: "nowrap" }}>Visit Client</span>
        </a>
      </div>
    </div>
  );
}

const PackHeader = ({ line }) => (
  <>
    <Header pill="Candidate Pack" />
    {line ? <Fill y={99} w={1920} h={1} color="#939393" /> : null}
  </>
);

function Dots({ color, x, y }) {
  return <div className="abs" style={{ left: x, top: y, width: 360, height: 364 }}><Svg svg={DOTS(color)} w={360} h={364} /></div>;
}

// Off-white page with Figma's soft shade (#666 transparent to black at `to`, multiply).
function OffWhite({ to = 0.2, from = 0, end = 1 }) {
  const stops = [["#666666", 0, from], ["#000000", to, end]];
  return (
    <>
      <Fill w={1920} h={1080} color={OFF} />
      <Grad w={1920} h={1080} stops={stops} blend="multiply" />
    </>
  );
}

// Photo panel with the template's darkening (40% black, then shade to 75% black at the bottom).
function DarkPhoto({ src, pos: ps, x, y, w, h }) {
  return (
    <>
      <Photo src={src} pos={ps} x={x} y={y} w={w} h={h} />
      <div className="abs" style={{ left: x, top: y, width: w, height: h, backgroundImage: "linear-gradient(180deg, rgba(102,102,102,0) 0%, rgba(0,0,0,0.75) 100%), linear-gradient(90deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.4) 100%)" }} />
    </>
  );
}

function Logo({ p, maxW, maxH, white }) {
  if (!p.clientLogo) return null;
  const k = logoK(p);
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={p.clientLogo} alt="" style={{ maxWidth: Math.round(maxW * k), maxHeight: Math.round(maxH * k), objectFit: "contain", objectPosition: "left center", display: "block",
    filter: white || !p.logoColour ? "brightness(0) invert(1)" : "none" }} />;
}

// ---- 1. Title ---------------------------------------------------------------------
export function PackTitle({ p }) {
  return (
    <PPage p={p} bg={INK}>
      <Photo src={p.photoTitle} pos={pos(p, "photoTitle")} y={100} w={1920} h={864} />
      <Fill y={100} w={1920} h={864} color="#000" opacity={0.5} />
      <Grad y={100} w={1920} h={864} stops={[["#666666", 0, 0], ["#000000", 0.75, 1]]} blend="multiply" />
      <Mid cy={540.43} left={234} className="col" style={{ width: 643, gap: 20 }}>
        {p.clientLogo ? <div style={{ height: Math.round(40 * logoK(p)), display: "flex", alignItems: "center" }}><Logo p={p} maxW={439} maxH={40} /></div> : null}
        <div className="col" style={{ gap: 25, color: "#fff" }}>
          <div style={{ fontSize: 75, fontWeight: 900, lineHeight: "normal" }}>{stripDot(p.roleTitle) || "Job Title"}<Dot p={p} /></div>
          <div className="poppins" style={{ fontSize: 25, letterSpacing: "-1.25px", lineHeight: "normal" }}>{W(p, "sub")}</div>
        </div>
      </Mid>
      <Dots color="#fff" x={-230} y={358} />
      <PackHeader />
      <Footer p={p} left="#fff" right="#fff" bg={INK} line={false} />
    </PPage>
  );
}

// Headings: the words between *stars* (or, without stars, the last word) and the full stop
// are in the client's colour, as in the Figma file ("Key *Responsibilities*").
function Head({ text, color = INK, hi, style }) {
  const raw = stripDot(text);
  let parts;
  if (raw.includes("*")) parts = raw.split("*").map((t, i) => [t, i % 2 === 1]);
  else {
    const i = raw.lastIndexOf(" ");
    parts = i > 0 ? [[raw.slice(0, i + 1), false], [raw.slice(i + 1), true]] : [[raw, true]];
  }
  const last = parts.filter(([t]) => t).slice(-1)[0];
  return (
    <div style={{ color, ...style }}>
      {parts.map(([t, on], i) => (t ? <span key={i} style={on ? { color: hi } : undefined}>{t}</span> : null))}
      <span style={{ color: last && last[1] ? hi : hi }}>.</span>
    </div>
  );
}
const paraList = (text) => lines(text);
function Paras({ text, gap, style, fallback }) {
  const ps = paraList(text);
  return (
    <div className="trim" style={style}>
      {(ps.length ? ps : [fallback || ""]).map((t, i) => <p key={i} style={{ marginTop: i ? gap : 0 }}>{t}</p>)}
    </div>
  );
}

// ---- 2. About ---------------------------------------------------------------------
export function PackAbout({ p }) {
  const S = LAPTOP_SCREEN;
  return (
    <PPage p={p}>
      <OffWhite />
      <Fill x={1235} w={685} h={1080} color={dark(p)} />
      <Grad x={1235} w={685} h={1080} stops={[["#666666", 0, 0], ["#000000", 0.5, 1]]} blend="multiply" />
      <Mid cy={529} left={100} className="col" style={{ width: 783, gap: 40 }}>
        <Head text={`About *${stripDot(p.clientName) || "Client"}*`} hi={dark(p)} style={{ fontSize: 48, fontWeight: 900, lineHeight: 1, letterSpacing: "-0.48px" }} />
        <Paras text={p.about} gap={25} fallback="About the client." style={{ fontSize: 18, fontWeight: 700, lineHeight: "25px" }} />
      </Mid>
      <div className="abs" style={{ left: 976, top: 226, width: 1080, height: 627 }}>
        <div className="abs" style={{ left: S.x, top: S.y, width: S.w, height: S.h, background: "#e3e8e8", overflow: "hidden" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {p.siteShot ? <img src={p.siteShot} alt="" className="full cover" style={{ objectPosition: "center top" }} /> : null}
        </div>
        <div className="abs" style={{ left: 0, top: 0 }}><Svg svg={LAPTOP} w={1080} h={627} /></div>
      </div>
      <PackHeader />
      <Footer p={p} left={INK} right="#fff" />
    </PPage>
  );
}

// ---- 2b. The Opportunity ------------------------------------------------------------
export function PackOpportunity({ p }) {
  return (
    <PPage p={p} bg={INK}>
      <div className="abs" style={{ left: 977, top: 100, width: 946, height: 980, overflow: "hidden" }}>
        <Photo src={p.photoOpportunity} pos={pos(p, "photoOpportunity")} w={946} h={980} />
        <div className="abs" style={{ left: 0, top: 0, width: 946, height: 980, backgroundImage: "linear-gradient(0deg, rgba(0,0,0,0.5) 0%, rgba(102,102,102,0) 63.827%), linear-gradient(90deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.5) 100%)" }} />
      </div>
      <div className="abs" style={{ left: 0, top: 100, width: 977, height: 980, backgroundImage: "linear-gradient(0deg, rgba(0,0,0,0.3) 0%, rgba(102,102,102,0) 61.122%), linear-gradient(90deg, #ebebeb 0%, #ebebeb 100%)" }} />
      <FitBox name="The Opportunity" x={100} w={777}>
        <div className="col" style={{ gap: 40 }}>
          <Head text={W(p, "oppTitle")} hi={dark(p)} style={{ fontSize: 48, fontWeight: 900, lineHeight: 1, letterSpacing: "-0.48px" }} />
          <Paras text={p.opportunity} gap={30} fallback="Add the opportunity in the form." style={{ fontSize: 18, fontWeight: 500, lineHeight: "30px" }} />
        </div>
      </FitBox>
      <PackHeader />
      <Footer p={p} left={INK} right="#fff" />
    </PPage>
  );
}

// ---- 3. The Role ------------------------------------------------------------------
export function PackRole({ p }) {
  const rows = [
    [W(p, "l1"), p.jobTitle], [W(p, "l2"), p.location], [W(p, "l3"), p.reportingTo],
    ...(p.noDirectReports ? [] : [[W(p, "l4"), p.directReports]]),
  ];
  return (
    <PPage p={p}>
      <OffWhite />
      <EMark x={777} y={35} w={1417} h={1087} />
      <div className="abs col" style={{ left: 0, top: 103, width: 1135, height: 977, overflow: "hidden", padding: "50px 100px 150px", justifyContent: "center" }}>
        <DarkPhoto src={p.photoRole} pos={pos(p, "photoRole")} x={0} y={0} w={1135} h={977} />
        <div className="col" style={{ position: "relative", width: "100%", padding: 50, borderRadius: 20, background: "rgba(0,0,0,0.55)", gap: 40 }}>
          <Head text={W(p, "roleBox")} color="#fff" hi={acc(p)} style={{ fontSize: 60, fontWeight: 900, lineHeight: 1, letterSpacing: "-0.6px" }} />
          {rows.map(([k, v], i) => (
            <div key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.2)", paddingBottom: 25 }}>
              <div className="trim" style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.6, color: "#fff" }}>
                <span style={{ fontWeight: 900 }}>{k}</span> | {v || "—"}
              </div>
            </div>
          ))}
        </div>
      </div>
      <FitBox name="The Role" x={1235} w={585}>
        <div className="col" style={{ gap: 25 }}>
          <Head text={W(p, "roleProfile")} hi={acc(p)} style={{ fontSize: 35, fontWeight: 900, lineHeight: 1, letterSpacing: "-0.35px" }} />
          <Paras text={p.roleProfile} gap={30} fallback="Role profile." style={{ fontSize: 22, fontWeight: 600, lineHeight: "30px" }} />
        </div>
      </FitBox>
      <PackHeader />
      <Footer p={p} left="#fff" right={INK} />
    </PPage>
  );
}

// ---- 4 & 5. Key Responsibilities / What We're Looking For -------------------------
function LeftTitle({ p, title, intro, cy, titleSize, textW, gap }) {
  return (
    <Mid cy={cy} left={-225} style={{ display: "flex", alignItems: "center", gap }}>
      <div style={{ width: 360, height: 364, flex: "none" }}><Svg svg={DOTS("#fff")} w={360} h={364} /></div>
      <div className="col" style={{ width: textW, gap: 25, color: "#fff" }}>
        <Head text={title} color="#fff" hi={acc(p)} style={{ fontSize: titleSize, fontWeight: 900, lineHeight: 1, letterSpacing: `${-titleSize / 100}px` }} />
        <div className="trim" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.6 }}>{intro}</div>
      </div>
    </Mid>
  );
}
const cleanList = (xs) => (xs || []).map((x) => String(x || "").trim()).filter(Boolean);

export function PackKey({ p }) {
  const list = cleanList(p.keyPoints);
  const paras = paraList(p.keyText);
  return (
    <PPage p={p}>
      <OffWhite from={0.09861} />
      <FitBox name="Key Responsibilities" x={933} w={887}>
        <div style={{ borderLeft: `2px solid ${acc(p)}`, padding: "10px 0 10px 25px" }}>
          <div className="trim" style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.6, overflowWrap: "anywhere" }}>
            {paras.map((t, i) => <p key={i} style={{ marginBottom: 5 }}>{t}</p>)}
            {paras.length ? <p style={{ marginBottom: 5 }}>&nbsp;</p> : null}
            <p style={{ fontWeight: 900, marginBottom: 5 }}>{W(p, "keyListTitle")}</p>
            <ul style={{ listStyle: "disc", paddingLeft: 24 }}>
              {(list.length ? list : ["Add the responsibilities in the form."]).map((t, i) => <li key={i} style={{ marginBottom: i < list.length - 1 ? 5 : 0 }}>{t}</li>)}
            </ul>
          </div>
        </div>
      </FitBox>
      <div className="abs" style={{ left: 0, top: 100, width: 833, height: 980, overflow: "hidden" }}>
        <DarkPhoto src={p.photoKey} pos={pos(p, "photoKey")} x={0} y={0} w={833} h={980} />
      </div>
      <LeftTitle p={p} title={W(p, "keyTitle")} intro={W(p, "keyIntro")} cy={710} titleSize={50} textW={539} gap={50} />
      <PackHeader />
      <Footer p={p} left="#fff" right={INK} />
    </PPage>
  );
}

export function PackLooking({ p }) {
  const list = cleanList(p.lookingPoints);
  const paras = paraList(p.lookingText);
  const outro = paraList(p.lookingOutro);
  return (
    <PPage p={p}>
      <OffWhite />
      <FitBox name="What We’re Looking For" x={933} w={887}>
        <div className="col" style={{ gap: 25 }}>
          <div className="trim" style={{ fontSize: 18, lineHeight: "30px" }}>
            {paras.map((t, i) => <p key={i} style={{ fontWeight: 500, marginBottom: 30 }}>{t}</p>)}
            <p style={{ fontWeight: 900 }}>{W(p, "lookingListTitle")}</p>
          </div>
          <div style={{ borderLeft: `2px solid ${acc(p)}`, padding: "10px 0 10px 25px" }}>
            <div className="trim" style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.15, overflowWrap: "anywhere" }}>
              <ul style={{ listStyle: "disc", paddingLeft: 24 }}>
                {(list.length ? list : ["Add the points in the form."]).map((t, i) => <li key={i} style={{ marginBottom: i < list.length - 1 ? 25 : 0 }}>{t}</li>)}
              </ul>
              {outro.length ? <div style={{ marginTop: 18 }}>{outro.map((t, i) => <p key={i}>{t}</p>)}</div> : null}
            </div>
          </div>
        </div>
      </FitBox>
      <div className="abs" style={{ left: 0, top: 100, width: 833, height: 980, overflow: "hidden" }}>
        <DarkPhoto src={p.photoLooking} pos={pos(p, "photoLooking")} x={0} y={0} w={833} h={980} />
      </div>
      <LeftTitle p={p} title={W(p, "lookingTitle")} intro={W(p, "lookingIntro")} cy={703} titleSize={60} textW={476} gap={96} />
      <PackHeader />
      <Footer p={p} left="#fff" right={INK} />
    </PPage>
  );
}

// ---- 6. What's on offer -----------------------------------------------------------
export function PackOffer({ p }) {
  const ben = cleanList(p.benefits);
  const subs = [p.salary, p.contract].map((x) => String(x || "").trim()).filter(Boolean);
  return (
    <PPage p={p}>
      <OffWhite to={0.3} />
      <EMark x={993} y={35} w={1417} h={1087} />
      <div className="abs" style={{ left: 0, top: 100, width: 999, height: 980, overflow: "hidden" }}>
        <Photo src={p.photoOffer} pos={pos(p, "photoOffer")} w={999} h={980} />
        <Fill w={999} h={980} color="#000" opacity={0.6} />
        <div className="abs col" style={{ left: 103, top: 113, width: 793, height: 654, padding: 50, borderRadius: 12, background: "rgba(0,0,0,0.5)", justifyContent: "center", overflow: "hidden" }}>
          {/* Measured by the form so the salary, contract and benefits can't run out of the box. */}
          <div data-fit="What’s on offer box" style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", overflow: "hidden" }}>
          <div data-fit-inner className="col" style={{ gap: 25, flex: "none" }}>
            <div className="col" style={{ gap: 30 }}>
              <Head text={W(p, "offer")} color="#fff" hi={acc(p)} style={{ fontSize: 75, fontWeight: 900, lineHeight: "70px", letterSpacing: "-1.5px" }} />
              {(subs.length ? subs : ["Salary", "Contract"]).map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                  <Svg svg={TICK28(acc(p))} w={28} h={28} />
                  <div style={{ flex: 1, fontSize: 18, fontWeight: 500, lineHeight: 1.6, color: "#fff" }}>{t}</div>
                </div>
              ))}
              <div style={{ height: 1, background: "rgba(255,255,255,0.4)" }} />
            </div>
            {ben.length ? (
              <div className="col" style={{ gap: 10 }}>
                <div style={{ fontSize: 24, fontWeight: 900, lineHeight: "44px", letterSpacing: "-0.48px", color: acc(p) }}>{stripDot(W(p, "benefitsTitle")).replace(/\*/g, "")}</div>
                <ul style={{ listStyle: "disc", paddingLeft: 27, color: "#fff", fontSize: 18, fontWeight: 500, lineHeight: 1.6 }}>
                  {ben.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              </div>
            ) : null}
          </div>
          </div>
        </div>
      </div>
      <FitBox name="What’s on Offer" x={1099} w={721}>
        <div className="col" style={{ gap: 40 }}>
          <Head text={W(p, "whyTitle")} hi={acc(p)} style={{ fontSize: 30, fontWeight: 900, lineHeight: 1, letterSpacing: "-0.3px" }} />
          <Paras text={p.why} gap={30} fallback="Why this role stands out." style={{ fontSize: 22, fontWeight: 700, lineHeight: "30px" }} />
        </div>
      </FitBox>
      <PackHeader />
      <Footer p={p} left="#fff" right={INK} />
    </PPage>
  );
}

// ---- 7. Next Steps ----------------------------------------------------------------
export function PackNext({ p }) {
  const steps = [1, 2, 3].map((n) => [W(p, `step${n}t`), W(p, `step${n}x`)]);
  return (
    <PPage p={p} bg={OFF}>
      <div className="abs" style={{ left: 0, top: 568, width: 1920, height: 512, overflow: "hidden" }}>
        <Photo src={p.photoNext} pos={pos(p, "photoNext")} w={1920} h={512} />
        <Fill w={1920} h={512} color="#000" opacity={0.5} />
        <Grad w={1920} h={512} stops={[["#666666", 0.55, 0], ["#000000", 0.55, 1]]} blend="multiply" />
      </div>
      <div className="abs" style={{ left: 0, top: 100, width: 1920, height: 468, padding: 100, display: "flex", alignItems: "center", gap: 150,
        backgroundImage: "linear-gradient(0deg, rgba(0,0,0,0.2) 0%, rgba(102,102,102,0) 100%), linear-gradient(90deg, #ebebeb 0%, #ebebeb 100%)" }}>
        <Head text={W(p, "nextTitle")} hi={acc(p)} style={{ fontSize: 100, fontWeight: 900, lineHeight: 1.25, letterSpacing: "-1px", whiteSpace: "nowrap" }} />
        <div className="trim" style={{ flex: 1, fontSize: 22, lineHeight: "30px" }}>
          <p style={{ fontWeight: 700 }}>{W(p, "next1")}</p>
          <p style={{ fontWeight: 400, marginTop: 30 }}>{W(p, "next2")}</p>
        </div>
      </div>
      <div className="abs" style={{ left: 96, top: 545, width: 1725, display: "flex", gap: 106, alignItems: "flex-start" }}>
        {steps.map(([t, x], i) => (
          <div key={i} className="col" style={{ flex: 1, gap: 32, color: "#fff" }}>
            <div style={{ width: 49, height: 49, borderRadius: 24.5, background: INK, border: `3px solid ${acc(p)}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="poppins trim" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.6, letterSpacing: "2px" }}>{String(i + 1).padStart(2, "0")}</span>
            </div>
            <div className="trim" style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.4 }}>{stripDot(t)}<span style={{ color: acc(p) }}>.</span></div>
            <div className="trim" style={{ fontSize: 20, fontWeight: 400, lineHeight: 1.6 }}>{x}</div>
          </div>
        ))}
      </div>
      <PackHeader />
      <Footer p={p} left="#fff" right="#fff" />
    </PPage>
  );
}

// ---- 8. Contact -------------------------------------------------------------------
function Circle({ name, photo, size, x, y }) {
  const src = photo || headshotUrl(name);
  return (
    <div className={x != null ? "abs" : ""} style={{ left: x, top: y, width: size, height: size, borderRadius: "50%", overflow: "hidden", background: "#cfcfcf", flex: "none" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img src={src} alt="" className="full cover" style={{ position: "relative", width: "100%", height: "100%", objectPosition: "center 20%" }} /> : null}
    </div>
  );
}

function ContactLine({ icon, text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
      <Svg svg={icon} w={30} h={30} />
      <span className="trim" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.5, whiteSpace: "nowrap" }}>{text}</span>
    </div>
  );
}

export function PackContact({ p }) {
  const two = !!p.twoConsultants;
  const people = [1, ...(two ? [2] : [])].map((n) => {
    const c = p[`c${n}`] || {};
    return { ...c, name: c.name || p[`consultant${n}`] || (n === 1 ? "Consultant" : "Second consultant") };
  });
  const a = acc(p);
  return (
    <PPage p={p}>
      <Fill w={1920} h={1080} color={OFF} />
      <Grad w={1920} h={1080} stops={[["#666666", 0, 0.43194], ["#000000", 0.3, 0.63426]]} blend="multiply" />
      <Fill y={708} w={1920} h={372} color="#202020" />
      <Grad y={708} w={1920} h={372} stops={[["#666666", 0.2, 0], ["#000000", 0.2, 1]]} blend="multiply" />
      {two ? (
        <>
          <div className="abs col" style={{ left: 205, top: 278, width: 627, gap: 50 }}>
            <div className="trim" style={{ fontSize: 64, fontWeight: 900, lineHeight: 1.6 }}>{W(p, "contactTwo1")} <span style={{ color: a }}>{stripDot(W(p, "contactTwo2"))}.</span></div>
            <div className="trim" style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.6 }}>{W(p, "contactText")}</div>
          </div>
          {people.map((c, i) => (
            <div key={i} className="abs" style={{ left: 1010, top: i ? 426 : 174, display: "flex", alignItems: "center", gap: 48 }}>
              <Circle name={c.name} size={197} />
              <div className="col" style={{ width: 534, gap: 23 }}>
                <div className="trim" style={{ fontSize: 36, fontWeight: 900, lineHeight: 1.6 }}>{c.name}</div>
                {c.title ? <div className="trim" style={{ fontSize: 20, fontWeight: 500, lineHeight: 1.6 }}>{c.title}</div> : null}
                <div className="col" style={{ gap: 10 }}>
                  {c.phone ? <ContactLine icon={PHONE30(a)} text={c.phone} /> : null}
                  {c.email ? <ContactLine icon={EMAIL30(a)} text={c.email} /> : null}
                </div>
              </div>
            </div>
          ))}
          <Dots color={INK} x={-230} y={202} />
        </>
      ) : (
        <>
          <Circle name={people[0].name} size={376} x={1326} y={235} />
          <div className="abs col" style={{ left: 205, top: 238, gap: 50 }}>
            <div className="col" style={{ width: 1041, gap: 32 }}>
              <div className="trim" style={{ fontSize: 24, fontWeight: 600, lineHeight: 1.6 }}>{W(p, "contactOne")}</div>
              <div style={{ fontSize: 90, fontWeight: 900, lineHeight: 1, letterSpacing: "-0.9px" }}>{people[0].name}</div>
            </div>
            <div className="col" style={{ gap: 35 }}>
              {people[0].title ? <div className="trim" style={{ width: 589, fontSize: 30, fontWeight: 600, lineHeight: 1.6 }}>{people[0].title}</div> : null}
              <div style={{ display: "flex", gap: 56 }}>
                {people[0].phone ? <ContactLine icon={PHONE30(a)} text={people[0].phone} /> : null}
                {people[0].email ? <ContactLine icon={EMAIL30(a)} text={people[0].email} /> : null}
              </div>
            </div>
            <div className="trim" style={{ width: 1041, fontSize: 20, fontWeight: 500, lineHeight: 1.6 }}>{W(p, "contactText")}</div>
          </div>
          <Dots color={INK} x={-230} y={257} />
        </>
      )}
      <div className="abs" style={{ left: 205, top: 761, width: 1565, display: "flex", gap: 45, color: "#fff" }}>
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="col" style={{ flex: 1, gap: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Svg svg={STEP_ICONS[n - 1]} w={48} h={48} />
              <div className="trim" style={{ flex: 1, fontSize: 25, fontWeight: 700, lineHeight: 1.6 }}>{W(p, `proc${n}t`)}</div>
            </div>
            <div className="trim" style={{ fontSize: 18, fontWeight: 400, lineHeight: 1.6 }}>{W(p, `proc${n}x`)}</div>
          </div>
        ))}
      </div>
      <PackHeader />
      <Footer p={p} left="#fff" right="#fff" />
    </PPage>
  );
}

// ---- 9. End -----------------------------------------------------------------------
export function PackEnd({ p }) {
  return (
    <PPage p={p} bg={dark(p)}>
      <div className="abs" style={{ left: 0, top: 0, width: 1920, height: 1080, background: `linear-gradient(180deg, ${INK} 25.185%, ${dark(p)} 100%)` }} />
      <div className="abs" style={{ left: -475, top: -130, width: 1539, height: 1432, borderRadius: "50%", overflow: "hidden" }}>
        <Fill w={1539} h={1432} color="#000" opacity={0.3} />
        <div className="abs" style={{ left: 0, top: 0, width: 1539, height: 1432, opacity: 0.1 }}>
          <Photo src={p.photoEnd} pos={pos(p, "photoEnd")} w={1539} h={1432} />
        </div>
      </div>
      <div className="abs" style={{ left: 198, top: 534, width: 571, height: 52, display: "flex", alignItems: "center" }}>
        {p.clientLogo ? <Logo p={p} maxW={571} maxH={52} white={!p.logoColour} />
          : <span style={{ fontSize: 48, fontWeight: 900, color: "#fff" }}>{p.clientName}</span>}
      </div>
      <Mid cy={540.5} left={1161} className="col" style={{ width: 663, gap: 25, color: "#fff" }}>
        <div style={{ fontSize: 75, fontWeight: 900, lineHeight: "normal", letterSpacing: "-0.75px" }}>{W(p, "end1")}<br />{stripDot(W(p, "end2"))}<Dot p={p} /></div>
        <div className="poppins" style={{ fontSize: 25, lineHeight: "normal", letterSpacing: "-1.25px" }}>{W(p, "endText")}</div>
      </Mid>
      <PackHeader line />
      <Footer p={p} left="#fff" right="#fff" />
    </PPage>
  );
}

// ---- The full pack: [{key, label, el}] in page order --------------------------------
const PACK_COMPONENTS = { title: PackTitle, about: PackAbout, opportunity: PackOpportunity, role: PackRole, key: PackKey, looking: PackLooking, offer: PackOffer, next: PackNext, contact: PackContact, end: PackEnd };

export function packPages(p) {
  return packPlan(p).map((x) => {
    const C = PACK_COMPONENTS[x.extra ? x.extra.style : x.key];
    return { key: x.key, label: x.label, extra: !!x.extra, el: <C p={x.extra ? packExtraProps(p, x.extra) : p} /> };
  });
}

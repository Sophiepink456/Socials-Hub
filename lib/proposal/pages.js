// The proposal pages, each a 1920 x 1080 block of HTML laid out to match the
// LIVE-TEMPLATE Figma file. Positions and type sizes are taken from Figma.
// Rendered in the editor preview and, through headless Chrome, into the PDF.
import { HEADER_LOGO, linkedin, instagram, facebook, SOCIAL_URLS, TICK, TICK_ROUND, EMAIL_ICON, PHONE_ICON, INFO_ICON, svgUri } from "./icons";
import { E_PATH, E_W, E_H } from "./shapes";
import {
  APPROACH, APPROACH_INTRO, BRANDED_TEXT, CANDIDATE_PACK_TEXT, SEARCH, TERMS_POINTS, NEXT_STEPS,
  sectionsFor, appendices, appendicesDesc, headshotUrl,
} from "./data";

const GREEN = "#93bf20";
const INK = "#161616";

// ---- Figma-style layers ------------------------------------------------------

// A Figma linear gradient. `T` is the first row of Figma's gradientTransform
// (t = a*x + b*y + c in the layer's 0..1 space). Stops are [hex, alpha, position].
// Extra stops are added so colours blend the way Figma does (not premultiplied).
let gid = 0;
function Grad({ x = 0, y = 0, w, h, stops, T = [0, 1, 0], opacity = 1, blend = "normal" }) {
  const [a, b, c] = T;
  const gx = a / w, gy = b / h;
  const len2 = gx * gx + gy * gy || 1;
  const cx = w / 2, cy = h / 2;
  const tc = a * 0.5 + b * 0.5 + c;
  const p = (t) => [cx + ((t - tc) * gx) / len2, cy + ((t - tc) * gy) / len2];
  const [x1, y1] = p(0), [x2, y2] = p(1);
  const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const dense = [];
  for (let i = 0; i < stops.length - 1; i++) {
    const [c0, a0, p0] = stops[i], [c1, a1, p1] = stops[i + 1];
    const A = rgb(c0), B = rgb(c1);
    for (let k = 0; k <= 10; k++) {
      const u = k / 10;
      dense.push([p0 + (p1 - p0) * u, A.map((v, j) => Math.round(v + (B[j] - v) * u)), a0 + (a1 - a0) * u]);
    }
  }
  const id = `g${++gid}`;
  return (
    <svg className="abs" style={{ left: x, top: y, width: w, height: h, opacity, mixBlendMode: blend }} width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={x1} y1={y1} x2={x2} y2={y2}>
          {dense.map(([o, [r, g, bb], al], i) => (
            <stop key={i} offset={Math.min(1, Math.max(0, o))} stopColor={`rgb(${r},${g},${bb})`} stopOpacity={al} />
          ))}
        </linearGradient>
      </defs>
      <rect width={w} height={h} fill={`url(#${id})`} />
    </svg>
  );
}
// The template's usual shade: #666 transparent -> black.
const SHADE = [["#666666", 0, 0], ["#000000", 1, 1]];
const SHADE_REV = [["#000000", 1, 0], ["#666666", 0, 1]];

function Fill({ x = 0, y = 0, w, h, color, opacity = 1, blend = "normal", radius }) {
  return <div className="abs" style={{ left: x, top: y, width: w, height: h, background: color, opacity, mixBlendMode: blend, borderRadius: radius }} />;
}

// The faint brand "e" behind most pages.
function EMark({ x, y, w, h, color = "#0b0b0b", opacity = 0.03 }) {
  return (
    <svg className="abs" style={{ left: x, top: y, width: w, height: h }} viewBox={`0 0 ${E_W} ${E_H}`} preserveAspectRatio="none">
      <path d={E_PATH} fill={color} fillOpacity={opacity} />
    </svg>
  );
}

function Photo({ src, x = 0, y = 0, w, h, position = "center" }) {
  if (!src) return <Fill x={x} y={y} w={w} h={h} color="#2a2a2a" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className="abs cover" style={{ left: x, top: y, width: w, height: h, objectPosition: position }} />;
}

const Svg = ({ svg, w, h, style }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={svgUri(svg)} alt="" width={w} height={h} style={{ display: "block", width: w, height: h, flex: "none", ...style }} />
);

// Text split into paragraphs with Figma's paragraph spacing.
function Paras({ text, ps = 15, className = "", style }) {
  const parts = String(text || "").split(/\n\s*\n|\n/).map((x) => x.trim()).filter(Boolean);
  return (
    <div className={"paras trim " + className} style={{ "--ps": `${ps}px`, ...style }}>
      {parts.map((t, i) => <p key={i}>{t}</p>)}
    </div>
  );
}

// "Heading" + green full stop.
const Dot = ({ children }) => <>{children}<span className="g">.</span></>;
const stripDot = (s) => String(s || "").trim().replace(/\.+$/, "");

// ---- Header and footer ------------------------------------------------------

function Header({ pill = "Proposal" }) {
  return (
    <div className="abs" style={{ left: 0, top: 0, width: 1920, height: 100, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 32 }}>
      <Svg svg={HEADER_LOGO} w={176} h={38} />
      <div style={{ height: 46, padding: "0 16px", border: "1px solid #939393", borderRadius: 40, display: "flex", alignItems: "center" }}>
        <span className="trim" style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.5, color: INK }}>{pill}</span>
      </div>
    </div>
  );
}

function Footer({ label, left = INK, right = INK, bg, line = true, children }) {
  return (
    <div className="abs" style={{ left: 0, top: 964, width: 1920, height: 116, background: bg, borderTop: line ? "1px solid #939393" : "none" }}>
      {label || children ? (
        <div className="abs" style={{ left: 100, top: 49, display: "flex", alignItems: "center", gap: children ? 5 : 20, color: left }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, background: GREEN, flex: "none" }} />
          {children || <span className="trim" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.5, whiteSpace: "nowrap" }}>{label}</span>}
        </div>
      ) : null}
      <div className="abs" style={{ left: 1322, top: 34, height: 46, display: "flex", alignItems: "center", color: right }}>
        <span style={{ width: 10, height: 10, borderRadius: 5, background: GREEN, marginRight: 10 }} />
        <span className="trim" style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.5, marginRight: 25, whiteSpace: "nowrap" }}>Follow us on socials</span>
        <a href={SOCIAL_URLS.linkedin} style={{ marginRight: 15 }}><Svg svg={linkedin(right)} w={26} h={26} /></a>
        <a href={SOCIAL_URLS.instagram} style={{ marginRight: 15 }}><Svg svg={instagram(right)} w={26} h={26} /></a>
        <a href={SOCIAL_URLS.facebook} style={{ marginRight: 25 }}><Svg svg={facebook(right)} w={26} h={26} /></a>
        <a href={SOCIAL_URLS.site} style={{ height: 46, padding: "0 16px", border: `2px solid ${right}`, borderRadius: 40, display: "flex", alignItems: "center" }}>
          <span className="trim" style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.5, whiteSpace: "nowrap" }}>Visit our site</span>
        </a>
      </div>
    </div>
  );
}

const Page = ({ bg, children }) => <div className="pp" style={{ background: bg }}>{children}</div>;

// Page background: base colour + the template's 20% shade.
function Base({ color, T = [0, 1, 0], stops = SHADE, blend = "multiply" }) {
  return (
    <>
      <Fill w={1920} h={1080} color={color} />
      <Grad w={1920} h={1080} stops={stops} T={T} opacity={0.2} blend={blend} />
    </>
  );
}

// Left-bordered block used for headings with a line or paragraph beneath.
function Block({ border = 3, pad = "20px 0 20px 25px", gap = 24, width, children, style }) {
  return (
    <div className="col" style={{ borderLeft: `${border}px solid ${GREEN}`, padding: pad, gap, width, ...style }}>{children}</div>
  );
}

const footerLabel = (s) => (s ? `${s.num} | ${s.name}` : "");

// ---- 1. Title ---------------------------------------------------------------
export function TitlePage({ p, ctx }) {
  const role = stripDot(p.roleTitle) || "Job Title";
  const long = role.length > 45;
  const names = p.twoConsultants ? [p.consultant1, p.consultant2].filter(Boolean).join(" & ") : p.consultant1;
  const email = !p.twoConsultants && p.consultant1 ? (p.c1.email || "") : "";
  return (
    <Page bg={INK}>
      <Photo src={p.photoTitle} w={1920} h={1080} />
      <Fill w={1920} h={1080} color="#000" opacity={0.5} />
      <Grad w={1920} h={1080} stops={SHADE} opacity={0.75} blend="multiply" />

      <div className="abs col" style={{ left: 397, width: 1126, top: 540, transform: "translateY(-50%)", alignItems: "center", gap: 20 }}>
        <div className="col" style={{ alignItems: "center", gap: 25, width: "100%" }}>
          {p.clientLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.clientLogo} alt="" style={{ maxWidth: Math.round(424 * logoK(p)), maxHeight: Math.round(80 * logoK(p)), objectFit: "contain", display: "block", filter: p.logoColour ? "none" : "brightness(0) invert(1)" }} />
          ) : null}
          <div style={{ fontSize: 96, fontWeight: 900, letterSpacing: "-0.01em", lineHeight: 1.2, textAlign: "center", color: "#fff" }}>
            <span className="g">Recruitment</span> Proposal<span className="g">.</span>
          </div>
          <div className="poppins" style={{ fontSize: long ? 26 : 30, letterSpacing: "-0.05em", lineHeight: 1.5, textAlign: "center", color: "#fff", maxWidth: 1126 }}>
            For the Appointment of {role}<span className="g">.</span>
          </div>
        </div>
        <div className="poppins" style={{ border: `1px solid ${GREEN}`, borderRadius: 10, padding: "10px 25px", color: "#fff", fontSize: 18, letterSpacing: "-0.05em", lineHeight: 1.5 }}>
          PRIVATE AND STRICTLY CONFIDENTIAL
        </div>
      </div>

      <Header />
      <Footer left="#fff" right="#fff">
        <span className="trim" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.5, whiteSpace: "nowrap" }}>
          Prepared by {names || "Consultant"}{email ? <> | {email}</> : null}
        </span>
      </Footer>
    </Page>
  );
}

// ---- 2. Contents --------------------------------------------------------------
export function ContentsPage({ p }) {
  const secs = sectionsFor(p);
  const half = Math.ceil(secs.length / 2);
  const cells = [];
  for (let r = 0; r < half; r++) {
    cells.push(secs[r]);
    cells.push(secs[r + half] || null);
  }
  const client = String(p.clientName || "").trim();
  return (
    <Page>
      <Base color="#ebebeb" />
      <EMark x={4} y={-195} w={1967} h={1509} />
      <div className="abs col" style={{ left: 106, top: 171, gap: 45 }}>
        <div style={{ fontSize: 75, fontWeight: 900, letterSpacing: "-0.01em", lineHeight: 1, height: 75 }}>Contents<span className="g">.</span></div>
        <div style={{ display: "grid", gridTemplateColumns: "608px 608px", columnGap: 200, rowGap: 35, alignItems: "center" }}>
          {cells.map((s, i) => s ? (
            <Block key={i} pad="8px 0 8px 25px" gap={15} style={i % 2 === 0 && !cells[i + 1] ? { gridColumn: "1 / span 2" } : undefined}>
              <div className="trim" style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.4, whiteSpace: "nowrap" }}>
                {s.num} | {s.id === "about" && client ? `About ${client}` : s.name}<span className="g">.</span>
              </div>
              <div className="trim" style={{ fontSize: 15, lineHeight: 1.6, maxWidth: i % 2 === 0 && !cells[i + 1] ? 1390 : 583 }}>
                {s.id === "appendices" ? appendicesDesc(p) : s.desc}
              </div>
            </Block>
          ) : null)}
        </div>
      </div>
      <Header />
      <Footer label="Contents" />
    </Page>
  );
}

// ---- 3. Our Understanding ---------------------------------------------------
export function UnderstandingPage({ p, sec }) {
  return (
    <Page>
      <Base color="#ebebeb" stops={SHADE_REV} T={[0, -1.09, 1.09]} />
      <EMark x={4} y={35} w={1417} h={1087} />
      <Photo src={p.photoUnderstanding} x={1127} y={0} w={793} h={1080} />
      <Grad x={1127} y={0} w={793} h={1080} stops={SHADE} opacity={0.55} blend="multiply" />
      <div className="abs col" style={{ left: 100, top: 200, width: 927, height: 705, justifyContent: "center", gap: 40 }}>
        <div style={{ fontSize: 75, fontWeight: 900, letterSpacing: "-0.01em", lineHeight: 1 }}>Our Understanding<span className="g">.</span></div>
        <Paras text={p.understanding} style={{ fontSize: 22, fontWeight: 600, lineHeight: "30px" }} />
      </div>
      <Header />
      <Footer label={footerLabel(sec)} left={INK} right="#fff" />
    </Page>
  );
}

// ---- 4. About -----------------------------------------------------------------
export function AboutPage({ p, sec }) {
  const client = String(p.clientName || "").trim() || "Client";
  return (
    <Page>
      <Base color={INK} stops={SHADE_REV} T={[0, -2.14, 2.14]} blend="normal" />
      <EMark x={693} y={35} w={1417} h={1087} color="#ffffff" />
      <Photo src={p.photoAbout} x={0} y={100} w={833} h={980} />
      <Grad x={0} y={100} w={833} h={980} stops={SHADE} opacity={0.5} />
      <div className="abs col" style={{ left: 933, top: 200, width: 887, height: 730, justifyContent: "center", gap: 40, color: "#fff" }}>
        <div style={{ fontSize: 75, fontWeight: 900, letterSpacing: "-0.01em", lineHeight: 1 }}>About {client}<span className="g">.</span></div>
        <Paras text={p.about} style={{ fontSize: 20, fontWeight: 600, lineHeight: "30px" }} />
      </div>
      <Header />
      <Footer label={`${sec.num} | About ${client}`} left="#fff" right="#fff" />
    </Page>
  );
}

// ---- 5. Role Profile ------------------------------------------------------------
function InfoRow({ label, value, top }) {
  return (
    <div className="row" style={{ alignItems: top ? "flex-start" : "center", gap: 20, minHeight: 23 }}>
      <div className="row" style={{ alignItems: "center", gap: 20, flex: "none", height: 23 }}>
        <div className="trim" style={{ width: 150, fontSize: 20, fontWeight: 700, lineHeight: 1.6, color: "#fff" }}>{label}</div>
        <div style={{ width: 2, height: 23, background: GREEN }} />
      </div>
      <div className="trim" style={{ fontSize: 20, fontWeight: 500, lineHeight: 1.6, color: "#fff", flex: 1, paddingTop: top ? 3 : 0 }}>{value}</div>
    </div>
  );
}

export function RolePage({ p, sec }) {
  const benefits = (p.benefits || []).map((b) => String(b || "").trim()).filter(Boolean);
  const twoCol = benefits.length > 4;
  const offer = [p.salary, p.contract].map((x) => String(x || "").trim()).filter(Boolean);
  return (
    <Page>
      <Base color="#ebebeb" stops={SHADE_REV} T={[0, -1.09, 1.09]} />
      <EMark x={618} y={35} w={1417} h={1087} />
      <Photo src={p.photoRole} x={0} y={100} w={908} h={980} />
      <Fill x={0} y={100} w={908} h={980} color="#000" opacity={0.5} />
      <Grad x={0} y={100} w={908} h={980} stops={SHADE_REV} T={[-1, 0, 1]} opacity={0.5} />

      <div className="abs" style={{ left: 75, top: 175, width: 758, height: 755, display: "flex", alignItems: "center" }}>
        <div className="col" style={{ width: 758, borderRadius: 12, padding: 50, gap: 30, position: "relative", overflow: "hidden" }}>
          <div className="full" style={{ background: "#000", opacity: 0.4, mixBlendMode: "multiply" }} />
          <div style={{ position: "relative", fontSize: 50, fontWeight: 900, letterSpacing: "-0.01em", lineHeight: 1, color: "#fff" }}>The Role<span className="g">.</span></div>
          <div className="col" style={{ position: "relative", gap: 15 }}>
            <InfoRow label="Job Title" value={p.jobTitle} />
            <InfoRow label="Location" value={p.location} />
            <InfoRow label="Reporting to" value={p.reportingTo} />
            {!p.noDirectReports && String(p.directReports || "").trim() ? <InfoRow label="Direct Reports" value={p.directReports} top /> : null}
          </div>
          <div className="col" style={{ position: "relative", gap: 15 }}>
            <div className="col" style={{ gap: 10 }}>
              <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: "44px", color: GREEN }}>What’s on offer.</div>
              <div className="col" style={{ gap: 10 }}>
                {offer.map((o, i) => (
                  <div key={i} className="row" style={{ gap: 20, alignItems: "flex-start" }}>
                    <Svg svg={TICK()} w={28} h={28} />
                    <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.6, color: "#fff" }}>{o}</div>
                  </div>
                ))}
              </div>
              <div style={{ height: 2, background: "rgba(255,255,255,0.18)" }} />
            </div>
            <div className="col" style={{ gap: 10 }}>
              <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: "44px", color: GREEN }}>Benefits</div>
              <ul className="bul" style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.6, color: "#fff", columnCount: twoCol ? 2 : 1, columnGap: 30 }}>
                {(benefits.length ? benefits : ["TBC"]).map((b, i) => <li key={i} style={{ breakInside: "avoid" }}>{b}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="abs col" style={{ left: 991, top: 200, width: 829, height: 680, justifyContent: "center", gap: 30 }}>
        <div className="trim" style={{ fontSize: 50, fontWeight: 900, lineHeight: 1.6 }}>Role Profile<span className="g">.</span></div>
        <div className="trim pre" style={{ fontSize: 20, fontWeight: 500, lineHeight: "30px" }}>{p.roleProfile}</div>
      </div>
      <Header />
      <Footer label={footerLabel(sec)} left="#fff" right={INK} />
    </Page>
  );
}

// ---- 6. Our Approach -------------------------------------------------------------
export function ApproachPage({ p, sec }) {
  const items = APPROACH.map((a) => ({ title: a.title, text: p[a.key] }));
  return (
    <Page>
      <Base color="#ebebeb" stops={SHADE_REV} T={[0, -1.61, 1.61]} />
      <Photo src={p.photoApproach} x={0} y={100} w={1920} h={340} />
      <Fill x={0} y={100} w={1920} h={340} color="#000" opacity={0.5} />
      <Grad x={0} y={100} w={1920} h={340} stops={SHADE} opacity={0.5} blend="multiply" />
      <div className="abs" style={{ left: 100, top: 198, height: 60, display: "flex", alignItems: "center", fontSize: 75, fontWeight: 900, letterSpacing: "-0.01em", lineHeight: "90px", color: "#fff", whiteSpace: "nowrap" }}>
        Our Approach<span className="g">.</span>
      </div>
      <div className="abs trim" style={{ left: 100, top: 298, width: 1724, fontSize: 20, fontWeight: 700, lineHeight: 1.4, color: "#fff" }}>{APPROACH_INTRO}</div>
      <div className="abs" style={{ left: 100, top: 415, height: 49, padding: "0 20px", borderRadius: 50, background: GREEN, display: "flex", alignItems: "center" }}>
        <span className="trim" style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.6, color: "#fff", whiteSpace: "nowrap" }}>How we get it right</span>
      </div>
      <div className="abs" style={{ left: 106, top: 540, width: 1708, height: 340, display: "flex", alignItems: "center" }}>
        <div style={{ display: "grid", gridTemplateColumns: "834px 834px", columnGap: 41, rowGap: 50, alignItems: "center", width: 1708 }}>
          {items.map((it, i) => (
            <Block key={i} gap={24}>
              <div className="trim" style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.4 }}>{it.title}<span className="g">.</span></div>
              <div className="trim pre" style={{ fontSize: 15, lineHeight: 1.6, width: 809 }}>{it.text}</div>
            </Block>
          ))}
        </div>
      </div>
      <Header />
      <Footer label={footerLabel(sec)} />
    </Page>
  );
}

// Logo size chosen in the form: 100 = standard, up to 250.
const logoK = (p) => Math.min(2.5, Math.max(0.6, (Number(p.logoSize) || 100) / 100));

// ---- 7. Branded Campaigns (fixed page; first tile is the chosen branded ad) --------
export function BrandedPage({ p, sec, ctx }) {
  return (
    <Page>
      <Base color="#ebebeb" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/proposal/branded-bg.jpg" alt="" className="abs" style={{ left: 0, top: 100, width: 1920, height: 864 }} />
      {p.brandedAd ? (
        <div className="abs" style={{ left: 651, top: 273, width: 365, height: 456, borderRadius: 15, overflow: "hidden", background: "#111" }}>
          {/* Fit options: fill the tile (trimming top/bottom or sides, never stretched), keep the top or
              bottom when trimming a tall ad, or show the whole ad over a soft blurred fill. */}
          {p.brandedFit === "whole" ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.brandedAd} alt="" className="full" style={{ objectFit: "cover", filter: "blur(18px) brightness(0.8)", transform: "scale(1.15)" }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.brandedAd} alt="" className="full" style={{ objectFit: "contain" }} />
            </>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.brandedAd} alt="" className="full" style={{ objectFit: "cover", objectPosition: p.brandedFit === "top" ? "center top" : p.brandedFit === "bottom" ? "center bottom" : "center" }} />
          )}
        </div>
      ) : null}
      {ctx && ctx.mediaLinks && ctx.mediaLinks[0] ? <a href={ctx.mediaLinks[0]} target="_blank" rel="noreferrer" className="abs" style={{ left: 1156, top: 826, width: 169, height: 42 }} /> : null}
      {ctx && ctx.mediaLinks && ctx.mediaLinks[1] ? <a href={ctx.mediaLinks[1]} target="_blank" rel="noreferrer" className="abs" style={{ left: 1560, top: 826, width: 169, height: 42 }} /> : null}
      <Header />
      <Footer label={footerLabel(sec)} />
    </Page>
  );
}

// ---- 8. Candidate Packs (fixed page) ------------------------------------------------
export function CandidatePage({ sec }) {
  return (
    <Page>
      <Base color="#ebebeb" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/proposal/candidate-packs-bg.jpg" alt="" className="abs" style={{ left: 0, top: 100, width: 1920, height: 864 }} />
      <Header />
      <Footer label={footerLabel(sec)} />
    </Page>
  );
}

// ---- 9. Search Process ----------------------------------------------------------
function Ticks({ items, width }) {
  return (
    <div className="col" style={{ gap: 30 }}>
      {items.map((t, i) => {
        const last = i === items.length - 1;
        return (
          <div key={i} className="row" style={{ gap: 20, alignItems: last ? "flex-start" : "center", paddingBottom: 25, borderBottom: last ? "none" : "1px solid rgba(147,147,147,0.25)" }}>
            <Svg svg={TICK_ROUND()} w={28} h={28} />
            <div className="trim" style={{ fontSize: 16, lineHeight: 1.6, color: "#fff", width }}>{t}</div>
          </div>
        );
      })}
    </div>
  );
}

function StageCard({ x, w, title, items, textW, children }) {
  return (
    <div className="abs col" style={{ left: x, top: 402, width: w, height: 524, background: "#1d1d1d", borderRadius: 20, padding: 50, gap: 30 }}>
      <div className="col" style={{ gap: 40 }}>
        <div style={{ borderBottom: `1px solid ${GREEN}`, padding: "35px 0", display: "flex", justifyContent: "center" }}>
          <div className="trim" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.4, color: "#fff", textAlign: "center" }}>{title}<span className="g">.</span></div>
        </div>
        <Ticks items={items} width={textW} />
      </div>
      {children}
    </div>
  );
}

function StagePill({ x, label }) {
  return (
    <div className="abs" style={{ left: x, top: 382, height: 39, padding: "0 15px", borderRadius: 10, background: GREEN, display: "flex", alignItems: "center" }}>
      <span className="trim" style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.6, color: "#fff", whiteSpace: "nowrap" }}>{label}</span>
    </div>
  );
}

export function SearchPage({ p, sec }) {
  const [s1, s2, s3] = SEARCH.stages;
  return (
    <Page>
      <Base color={INK} stops={SHADE_REV} T={[0, -1.61, 1.61]} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/proposal/search-banner.jpg" alt="" className="abs" style={{ left: 0, top: 100, width: 1920, height: 340 }} />
      <StageCard x={100} w={390} title={s1.title} items={s1.items} textW={242} />
      <StageCard x={559} w={807} title={s2.title} items={s2.items} textW={659}>
        <div className="row" style={{ justifyContent: "center", gap: 5 }}>
          <span className="trim" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.4, color: "#fff" }}>Projected Timeframe:</span>
          <span className="trim" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.4, color: GREEN }}>{p.timeframe}</span>
        </div>
      </StageCard>
      <StageCard x={1435} w={390} title={s3.title} items={s3.items} textW={242} />
      <StagePill x={237} label="Stage 1" />
      <StagePill x={900} label="Stage 2" />
      <StagePill x={1569} label="Stage 3" />
      <Header />
      <Footer label={footerLabel(sec)} left="#fff" right="#fff" />
    </Page>
  );
}

// ---- 10. Credentials ------------------------------------------------------------
function ContactLines({ c, color, icon }) {
  return (
    <div className="col" style={{ gap: 15 }}>
      {c.email ? (
        <div className="row" style={{ gap: 20, alignItems: "center" }}>
          <Svg svg={EMAIL_ICON(icon)} w={35} h={35} />
          <span className="trim" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.5, color }}>{c.email}</span>
        </div>
      ) : null}
      {c.phone ? (
        <div className="row" style={{ gap: 20, alignItems: "center" }}>
          <Svg svg={PHONE_ICON(icon)} w={35} h={35} />
          <span className="trim" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.5, color }}>{c.phone}</span>
        </div>
      ) : null}
    </div>
  );
}

function AboutMe({ text, width, pad = "10px 0 10px 50px" }) {
  return (
    <Block border={2} pad={pad} gap={24} style={{ width: width + (pad.endsWith("50px") ? 52 : 27) }}>
      <div className="trim" style={{ fontSize: 25, fontWeight: 800, lineHeight: 1.4 }}>About me<span className="g">.</span></div>
      <Paras text={text} style={{ fontSize: 18, lineHeight: 1.6, width }} />
    </Block>
  );
}

function Headshot({ name, x, y, w, h }) {
  const src = headshotUrl(name);
  return (
    <div className="abs" style={{ left: x, top: y, width: w, height: h, borderRadius: 20, overflow: "hidden", background: "#cfcfcf" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img src={src} alt="" className="full cover" style={{ objectPosition: "center 20%" }} /> : null}
    </div>
  );
}

export function CredentialsPage({ p, sec }) {
  if (p.twoConsultants) return <CredentialsTwo p={p} sec={sec} />;
  const c = { ...p.c1, name: p.c1.name || p.consultant1 };
  return (
    <Page>
      <Fill w={1920} h={1080} color="#ebebeb" />
      <Fill x={0} y={100} w={423} h={980} color={INK} />
      <EMark x={-77} y={-276} w={2131} h={1635} color="#000000" />
      <div className="abs" style={{ left: 107, top: 177, fontSize: 24, fontWeight: 900, letterSpacing: "-0.01em", lineHeight: 1.25, color: "#fff", whiteSpace: "nowrap" }}>
        Your Specialist<span className="g">.</span>
      </div>
      <Headshot name={c.name} x={100} y={231} w={447} h={680} />
      <div className="abs col" style={{ left: 622, top: 231, width: 1198, height: 680, justifyContent: "center", gap: 40 }}>
        <div className="col" style={{ gap: 30 }}>
          <div className="col" style={{ gap: 30 }}>
            <div className="trim" style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.6 }}>{c.name}</div>
            {c.title ? <div className="trim" style={{ fontSize: 25, fontWeight: 500, lineHeight: 1.5, color: GREEN }}>{c.title}</div> : null}
          </div>
          <ContactLines c={c} color={INK} icon={GREEN} />
        </div>
        {c.about ? <AboutMe text={c.about} width={1146} /> : null}
      </div>
      <Header />
      <Footer label={footerLabel(sec)} left="#fff" right={INK} />
    </Page>
  );
}

function Profile({ c, x }) {
  return (
    <>
      <Headshot name={c.name} x={x} y={227} w={282} h={381} />
      <div className="abs col" style={{ left: x + 357, top: 227, width: 449, height: 381, justifyContent: "center", gap: 50 }}>
        <div className="col" style={{ gap: 30 }}>
          <div className="col" style={{ gap: 21 }}>
            <div className="trim" style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.6, color: "#fff" }}>{c.name}</div>
            {c.title ? <div className="trim" style={{ fontSize: 20, fontWeight: 500, lineHeight: 1.5, color: "#fff" }}>{c.title}</div> : null}
          </div>
          <ContactLines c={c} color="#fff" icon="#ffffff" />
        </div>
        {String(c.placements || "").trim() ? (
          <Block border={2} pad="10px 0 10px 25px" gap={20}>
            <div className="trim" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.4 }}>Recent Placements</div>
            <div className="trim" style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.4, width: 422 }}>{c.placements}</div>
          </Block>
        ) : null}
      </div>
      {c.about ? (
        <div className="abs" style={{ left: x, top: 680 }}>
          <AboutMe text={c.about} width={779} pad="10px 0 10px 25px" />
        </div>
      ) : null}
    </>
  );
}

function CredentialsTwo({ p, sec }) {
  const a = { ...p.c1, name: p.c1.name || p.consultant1 };
  const b = { ...p.c2, name: p.c2.name || p.consultant2 };
  return (
    <Page>
      <Fill w={1920} h={1080} color="#ebebeb" />
      <Fill x={0} y={100} w={1920} h={353} color={GREEN} />
      <EMark x={-77} y={-276} w={2131} h={1635} color="#000000" />
      <div className="abs" style={{ left: 106, top: 160, fontSize: 24, fontWeight: 900, letterSpacing: "-0.01em", lineHeight: 1.25, color: "#fff", whiteSpace: "nowrap" }}>
        Your Contacts.
      </div>
      <Profile c={a} x={100} />
      <Profile c={b} x={1018} />
      <Header />
      <Footer label={footerLabel(sec)} />
    </Page>
  );
}

// ---- 11. Terms & Fee Structure ----------------------------------------------------
export function TermsPage({ p, sec }) {
  const covered = [!p.nda ? "Branded Media Adverts" : null, "Candidate Pack", "NDA Led Search"].filter(Boolean);
  const fee = String(p.fee || "").trim() || "25%";
  const widths = [276, 289, 272, 230];
  return (
    <Page>
      <Base color={INK} stops={SHADE_REV} T={[0, -2.08, 2.08]} />
      <Fill x={559} y={680} w={1361} h={400} color="#ebebeb" />
      <div className="abs row" style={{ left: 634, top: 755, gap: 45, alignItems: "flex-start" }}>
        {TERMS_POINTS.map((t, i) => (
          <div key={i} className="col" style={{ width: widths[i], borderLeft: `1px solid ${GREEN}`, paddingLeft: 25, gap: 20 }}>
            <div className="trim" style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.6, color: GREEN }}>{t.title}</div>
            <div className="trim" style={{ fontSize: 18, fontWeight: t.weight || 600, lineHeight: 1.6 }}>
              {t.text}{t.bold ? <span style={{ fontWeight: 900 }}>{t.bold}</span> : null}
            </div>
          </div>
        ))}
      </div>
      <EMark x={735} y={352} w={1204} h={924} color="#000000" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/proposal/terms-photo.jpg" alt="" className="abs" style={{ left: 559, top: 100, width: 1361, height: 580 }} />
      <Fill x={0} y={100} w={559} h={980} color="#ffffff" opacity={0.03} />

      <div className="abs col" style={{ left: 100, top: 200, width: 398, height: 705, justifyContent: "center", gap: 50, color: "#fff" }}>
        <div className="col" style={{ gap: 25 }}>
          <div className="col" style={{ gap: 30 }}>
            <div className="trim" style={{ fontSize: 35, fontWeight: 700, lineHeight: 1.4, whiteSpace: "nowrap" }}>Terms & Fee Structure<span className="g">.</span></div>
            <div className="row" style={{ alignItems: "center", gap: 5 }}>
              <Svg svg={INFO_ICON()} w={30} h={30} />
              <span className="trim" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.4, whiteSpace: "pre" }}>Fee | {fee} + VAT of package<span className="g">.</span></span>
            </div>
          </div>
          <div className="col" style={{ gap: 24 }}>
            <div className="trim" style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.4, color: GREEN }}>Payment Terms.</div>
            <div className="col" style={{ gap: 10 }}>
              <ul className="bul" style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.6, display: "flex", flexDirection: "column", gap: 10 }}>
                <li>1/3 on commencement</li>
                <li>1/3 on presentation of shortlist</li>
                <li>1/3 on start date</li>
              </ul>
              <div style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.6 }}>*Any variation to the salary and fee will be calculated in the final 3rd.</div>
            </div>
          </div>
        </div>
        <div className="col" style={{ gap: 25, width: 359 }}>
          <div className="trim" style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.4, color: GREEN }}>Everything Covered.</div>
          <div className="col" style={{ gap: 15 }}>
            {covered.map((t, i) => (
              <div key={t} className="row" style={{ gap: 20, alignItems: "center", paddingBottom: 5, borderBottom: i < covered.length - 1 ? "1px solid rgba(147,147,147,0.25)" : "none" }}>
                <Svg svg={TICK_ROUND()} w={28} h={28} />
                <span className="trim" style={{ fontSize: 16, lineHeight: 1.6 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Header />
      <Footer label={footerLabel(sec)} left="#fff" right={INK} />
    </Page>
  );
}

// ---- 12. Next Steps -------------------------------------------------------------
export function NextPage({ p, sec }) {
  const client = String(p.clientName || "").trim();
  const field = (label, h = 45) => (
    <div className="row" style={{ alignItems: "center", height: h }}>
      <span className="trim" style={{ width: 125, fontSize: 18, fontWeight: 600, lineHeight: 1.6 }}>{label}</span>
      <div style={{ width: 602, height: h, background: "#fff", borderRadius: 10 }} />
    </div>
  );
  return (
    <Page bg={INK}>
      <EMark x={-77} y={-276} w={2131} h={1635} color="#000000" />
      <div className="abs col" style={{ left: 100, top: 168, width: 1720, gap: 40, color: "#fff" }}>
        <div className="col" style={{ gap: 25 }}>
          <div style={{ fontSize: 100, fontWeight: 900, letterSpacing: "-0.01em", lineHeight: 1.25, height: 125 }}>Next Steps<span className="g">.</span></div>
          <div className="row" style={{ gap: 50 }}>
            {NEXT_STEPS.points.map((t, i) => (
              <div key={i} className="row" style={{ gap: 10, alignItems: "center" }}>
                <div style={{ width: 35, height: 35, borderRadius: 21.5, border: `2px solid ${GREEN}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="trim" style={{ fontSize: 14, fontWeight: 700 }}>{String(i + 1).padStart(2, "0")}</span>
                </div>
                <span className="trim" style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.4, whiteSpace: "nowrap" }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
        <Block border={2} pad="0 0 0 25px" gap={32}>
          <div className="trim" style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.6, color: GREEN }}>Agreement of terms</div>
          <div className="trim" style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.6 }}>{NEXT_STEPS.text}</div>
        </Block>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/proposal/next-steps-photo.jpg" alt="" className="abs" style={{ left: 0, top: 560, width: 993, height: 520 }} />
      <Fill x={993} y={560} w={927} h={520} color="#ebebeb" />
      <div className="abs col" style={{ left: 1093, top: 620, width: 727, gap: 18 }}>
        <div className="col" style={{ gap: 20 }}>
          <span className="trim" style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.6 }}>Signed on behalf of {client}</span>
          <div style={{ height: 79, background: "#fff", borderRadius: 10 }} />
        </div>
        {field("Name")}
        {field("Position", 44)}
        {field("Date")}
      </div>
      <Header />
      <Footer label={footerLabel(sec)} left="#fff" right={INK} />
    </Page>
  );
}

// Stored documents are served from the hub; links in the PDF need the full address.
const absLink = (u) => {
  if (!u) return undefined;
  if (u.startsWith("/") && typeof window !== "undefined") return window.location.origin + u;
  return u;
};

// ---- Appendices ------------------------------------------------------------------
export function AppendicesPage({ p, sec }) {
  const list = appendices(p);
  return (
    <Page>
      <Base color="#ebebeb" />
      <EMark x={4} y={-195} w={1967} h={1509} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/proposal/appendix-photo.jpg" alt="" className="abs" style={{ left: 1008, top: 100, width: 912, height: 980, clipPath: "ellipse(769.5px 716px at 769.5px 486px)" }} />
      <div className="abs col" style={{ left: 106, top: 540, width: 820, transform: "translateY(-50%)", gap: 45 }}>
        <div style={{ fontSize: 75, fontWeight: 900, letterSpacing: "-0.01em", lineHeight: 1 }}>Appendices<span className="g">.</span></div>
        <div className="col" style={{ gap: 30 }}>
          {list.map((a, i) => (
            <Block key={i} pad="8px 0 8px 25px" gap={25}>
              <div className="trim" style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.4 }}>Appendix {i + 1} | {stripDot(a.title)}<span className="g">.</span></div>
              <a href={absLink(a.link)} style={{ width: 78, height: 42, border: `2px solid ${INK}`, borderRadius: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="trim" style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.5 }}>View</span>
              </a>
            </Block>
          ))}
        </div>
      </div>
      <Header />
      <Footer label={footerLabel(sec)} left={INK} right="#fff" />
    </Page>
  );
}

// ---- End slide -------------------------------------------------------------------
export function EndPage() {
  return (
    <Page>
      <Base color="#ebebeb" />
      <EMark x={588} y={-22} w={1487} h={1141} color="#000000" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/proposal/end-photo.jpg" alt="" className="abs" style={{ left: 0, top: 100, width: 1024, height: 864, clipPath: "ellipse(769.5px 716px at 254.5px 486px)" }} />
      <div className="abs" style={{ left: 1127, top: 442, width: 697, fontSize: 75, fontWeight: 900, lineHeight: 1.2 }}>
        <span className="g">Begin your search</span><br />journey today<span className="g">.</span>
      </div>
      <Header />
      <Footer bg={INK} line={false} right="#fff" />
    </Page>
  );
}

// ---- The full proposal ------------------------------------------------------------
// Returns [{key, label, el}] in page order.
export function proposalPages(p, ctx = {}) {
  const secs = Object.fromEntries(sectionsFor(p).map((s) => [s.id, s]));
  const out = [
    { key: "title", label: "Title", el: <TitlePage p={p} ctx={ctx} /> },
    { key: "contents", label: "Contents", el: <ContentsPage p={p} /> },
    { key: "understanding", label: "Our Understanding", el: <UnderstandingPage p={p} sec={secs.understanding} /> },
    { key: "about", label: "About", el: <AboutPage p={p} sec={secs.about} /> },
    { key: "role", label: "Role Profile", el: <RolePage p={p} sec={secs.role} /> },
    { key: "approach", label: "Our Approach", el: <ApproachPage p={p} sec={secs.approach} /> },
  ];
  if (secs.branded) out.push({ key: "branded", label: "Branded Campaigns", el: <BrandedPage p={p} sec={secs.branded} ctx={ctx} /> });
  out.push(
    { key: "candidate", label: "Candidate Packs", el: <CandidatePage sec={secs.candidate} /> },
    { key: "search", label: "Search Process", el: <SearchPage p={p} sec={secs.search} /> },
    { key: "credentials", label: "Credentials", el: <CredentialsPage p={p} sec={secs.credentials} /> },
    { key: "terms", label: "Terms & Fees", el: <TermsPage p={p} sec={secs.terms} /> },
    { key: "next", label: "Next Steps", el: <NextPage p={p} sec={secs.next} /> },
  );
  if (secs.appendices) out.push({ key: "appendices", label: "Appendices", el: <AppendicesPage p={p} sec={secs.appendices} /> });
  out.push({ key: "end", label: "End", el: <EndPage /> });
  return out;
}

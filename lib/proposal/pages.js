// The proposal pages, each a 1920 x 1080 block of HTML laid out to match the 2026 Brand System
// Figma file ("Proposal Pack Design", file dQpO0rDkzxM9bmGr0aDWqR). Positions and type sizes are
// taken from Figma. Rendered in the editor preview and, through headless Chrome, into the PDF.
// Artwork from the design (textures, logos, icons, default photos) lives in public/brand26/.
import { svgUri, TICK, TICK_ROUND, EMAIL_ICON, PHONE_ICON, INFO_ICON, SOCIAL_URLS } from "./icons";
import { E_PATH, E_W, E_H } from "./shapes";
import { pagePlan, extraProps, styleById } from "./extra";
import { Blocks, WithBlocks } from "../blocks";
import {
  APPROACH, APPROACH_INTRO, BRANDED_TEXT, CANDIDATE_PACK_TEXT, SEARCH, TERMS_POINTS, NEXT_STEPS, PAYMENT_TERMS, PAYMENT_NOTE,
  appendices, appendicesDesc, headshotUrl, roleList,
  teamSize, team,
} from "./data";
import { Fit } from "../slt/Fit";
import { px } from "../slt/px";

const GREEN = "#BAE400";
const LINE_GREEN = "#93BF20";
const INK = "#161616";
const OFF = "#ebebeb";
const B = "/brand26";

// ---- Small building blocks ------------------------------------------------------

// A Figma linear gradient (kept for the candidate pack pages and older added pages).
let gid = 0;
function Grad({ x = 0, y = 0, w, h, stops, T = [0, 1, 0], opacity = 1, blend = "normal" }) {
  const [a, b, c] = T;
  const gx = a / w, gy = b / h;
  const len2 = gx * gx + gy * gy || 1;
  const cx = w / 2, cy = h / 2;
  const tc = a * 0.5 + b * 0.5 + c;
  const pt = (t) => [cx + ((t - tc) * gx) / len2, cy + ((t - tc) * gy) / len2];
  const [x1, y1] = pt(0), [x2, y2] = pt(1);
  const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const dense = [];
  for (let i = 0; i < stops.length - 1; i++) {
    const [c0, a0, p0] = stops[i], [c1, a1, p1] = stops[i + 1];
    const A = rgb(c0), Bc = rgb(c1);
    for (let k = 0; k <= 10; k++) {
      const u = k / 10;
      dense.push([p0 + (p1 - p0) * u, A.map((v, j) => Math.round(v + (Bc[j] - v) * u)), a0 + (a1 - a0) * u]);
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
const SHADE = [["#666666", 0, 0], ["#000000", 1, 1]];
const SHADE_REV = [["#000000", 1, 0], ["#666666", 0, 1]];

function Fill({ x = 0, y = 0, w, h, color, opacity = 1, blend = "normal", radius }) {
  return <div className="abs" style={{ left: x, top: y, width: w, height: h, background: color, opacity, mixBlendMode: blend, borderRadius: radius }} />;
}

// A CSS background layer (Figma's "image + overlays" fills).
function Layer({ x = 0, y = 0, w, h, bg, blend }) {
  return <div className="abs" style={{ left: x, top: y, width: w, height: h, background: bg, mixBlendMode: blend }} />;
}
// Figma's usual photo darkening: transparent grey at the top to black at the bottom, multiplied.
const fadeDown = (to) => `linear-gradient(180deg, rgba(102,102,102,0) 0%, rgba(0,0,0,${to}) 100%)`;

// The faint brand "e" (still used on a few pages).
function EMark({ x, y, w, h, color = "#0b0b0b", opacity = 0.03 }) {
  return (
    <svg className="abs" style={{ left: x, top: y, width: w, height: h }} viewBox={`0 0 ${E_W} ${E_H}`} preserveAspectRatio="none">
      <path d={E_PATH} fill={color} fillOpacity={opacity} />
    </svg>
  );
}

// The brand textures: light (soft white swoosh), dark and dark2 (graphite).
const TEXTURE = { light: `${B}/texture-light.jpg`, dark: `${B}/texture-dark.jpg`, dark2: `${B}/texture-dark2.jpg` };
function Tex({ x = 0, y = 0, w = 1920, h = 1080, kind = "light", position = "center" }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={TEXTURE[kind]} alt="" className="abs cover" style={{ left: x, top: y, width: w, height: h, objectPosition: position }} />;
}

// A photo always fills its space. `pos` ({x, y} as 0–100%) slides it within that space.
function Photo({ src, x = 0, y = 0, w, h, position = "center", pos }) {
  if (!src) return <Fill x={x} y={y} w={w} h={h} color="#2a2a2a" />;
  const op = pos && (pos.x != null || pos.y != null) ? `${pos.x ?? 50}% ${pos.y ?? 50}%` : position;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className="abs cover" style={{ left: x, top: y, width: w, height: h, objectPosition: op }} />;
}

const Svg = ({ svg, w, h, style }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={svgUri(svg)} alt="" width={w} height={h} style={{ display: "block", width: w, height: h, flex: "none", ...style }} />
);
const Img = ({ src, w, h, style }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={src} alt="" width={w} height={h} style={{ display: "block", width: w, height: h, flex: "none", ...style }} />
);

// Text in paragraphs. A line starting "- " or "• " is a bullet point, and a line wrapped in
// **double stars** is a semibold subheading (used to section out long lists).
function Rich({ text, ps = 15, style, bulletIndent = 33, subStyle }) {
  const rows = String(text || "").split("\n").map((l) => l.trim()).filter(Boolean);
  const out = [];
  let list = null;
  rows.forEach((l, i) => {
    const m = l.match(/^[-•–]\s+(.*)$/);
    if (m) {
      if (!list) { list = []; out.push({ list }); }
      list.push(m[1]);
      return;
    }
    list = null;
    const sub = l.match(/^\*\*(.+?)\*\*$/);
    out.push(sub ? { sub: sub[1] } : { p: l, i });
  });
  return (
    <div className="trim" style={style}>
      {out.map((o, i) => {
        const mt = i ? ps : 0;
        if (o.list) return <ul key={i} style={{ listStyle: "disc", paddingLeft: bulletIndent, marginTop: mt }}>{o.list.map((t, j) => <li key={j}>{t}</li>)}</ul>;
        if (o.sub) return <p key={i} style={{ marginTop: mt, fontWeight: 600, ...subStyle }}>{o.sub}</p>;
        return <p key={i} style={{ marginTop: mt }}>{o.p}</p>;
      })}
    </div>
  );
}
// Older name, kept for the pages and added-page styles that use it.
const Paras = ({ text, ps = 15, style }) => <Rich text={text} ps={ps} style={style} />;

// Text on added (back-office) pages can replace any fixed wording. Normal pages have no
// overrides, so they always show the standard text.
const T = (p, k, d) => (p && p.tx && p.tx[k] != null && (p.tx.__extra || String(p.tx[k]).trim() !== "") ? String(p.tx[k]) : d);
const lines = (v) => String(v || "").split("\n").map((l) => l.trim()).filter(Boolean);
const stripDot = (s) => String(s || "").trim().replace(/\.+$/, "");

// "Heading" + green full stop, in the new medium weight.
function Heading({ text, size, color = INK, lh = 1, track = -0.01, style, dot = GREEN, children }) {
  return (
    <div style={{ fontSize: size, fontWeight: 500, lineHeight: lh, letterSpacing: `${track}em`, color, ...style }}>
      {children ?? stripDot(text)}<span style={{ color: dot }}>.</span>
    </div>
  );
}

// Left-bordered block used for headings with a line or paragraph beneath.
function Block({ border = 3, pad = "20px 0 20px 25px", gap = 24, width, children, style }) {
  return <div className="col" style={{ borderLeft: `${border}px solid ${GREEN}`, padding: pad, gap, width, ...style }}>{children}</div>;
}

// Centre a block vertically on a line (y = cy) without transforms: Chrome splits PDF pages using
// the layout before transforms, so translate-centred blocks near the bottom could be cut in two.
function Mid({ cy, left, width, style, children, className = "col" }) {
  return (
    <div className="abs" style={{ left: 0, top: cy - 540, width: 1920, height: 1080, display: "flex", alignItems: "center", pointerEvents: "none" }}>
      <div className={className} style={{ marginLeft: left, width, pointerEvents: "auto", ...style }}>{children}</div>
    </div>
  );
}

// ---- Footer -----------------------------------------------------------------------
// Logo on the left (and "Prepared by" on the title page), socials and our website on the right.
// `logo` and `text` follow what's behind each side; `bg` is a solid bar, `border` a grey top line.
function Footer({ logo = "white", text = "#fff", bg, border = false, prepared, children }) {
  const dark = text !== "#fff";
  const ic = (n) => `${B}/${n}${dark ? "-dark" : ""}.svg`;
  return (
    <div className="abs" style={{ left: 0, top: 964, width: 1920, height: 116, background: bg, borderTop: border ? "1px solid #939393" : "none",
      display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 100px" }}>
      <div className="row" style={{ alignItems: "center", gap: 50 }}>
        <Img src={`${B}/logo-${logo}.svg`} w={223} h={46} />
        {prepared || children ? (
          <div className="row" style={{ alignItems: "center", gap: 20, color: "#fff" }}>
            <Img src={`${B}/dot8.svg`} w={8} h={8} />
            <span className="trim" style={{ fontSize: 20, fontWeight: 500, lineHeight: 1.5, whiteSpace: "nowrap" }}>{children || prepared}</span>
          </div>
        ) : null}
      </div>
      <div className="row" style={{ alignItems: "center", gap: 50, color: text }}>
        <div className="row" style={{ alignItems: "center", gap: 25 }}>
          <div className="row" style={{ alignItems: "center", gap: 10 }}>
            <Img src={`${B}/dot10.svg`} w={10} h={10} />
            <span className="trim" style={{ fontSize: 20, fontWeight: 500, lineHeight: 1.5, whiteSpace: "nowrap" }}>Follow us on socials</span>
          </div>
          <div className="row" style={{ alignItems: "center", gap: 15 }}>
            <a href={SOCIAL_URLS.linkedin}><Img src={ic("linkedin")} w={26} h={26} /></a>
            <a href={SOCIAL_URLS.instagram}><Img src={ic("instagram")} w={26} h={26} /></a>
            <a href={SOCIAL_URLS.facebook}><Img src={ic("facebook")} w={26} h={26} /></a>
          </div>
        </div>
        <a href="https://www.elevationrecruitmentgroup.com/" className="row" style={{ alignItems: "center", gap: 10 }}>
          <Img src={`${B}/mouse.svg`} w={30} h={30.5} />
          <span style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-1px", whiteSpace: "nowrap", lineHeight: "normal" }}>www.elevationrg.com</span>
        </a>
      </div>
    </div>
  );
}
// The old white header bar is gone in the 2026 brand; kept as a no-op for anything that still imports it.
const Header = () => null;

const Page = ({ bg, children }) => <div className="pp pp26" style={{ background: bg }}>{children}</div>;

// Page background (kept for added pages and the candidate pack).
function Base({ color, T: Tr = [0, 1, 0], stops = SHADE, blend = "multiply" }) {
  return (
    <>
      <Fill w={1920} h={1080} color={color} />
      <Grad w={1920} h={1080} stops={stops} T={Tr} opacity={0.2} blend={blend} />
    </>
  );
}

// Logo size chosen in the form: 100 = standard, up to 250.
const logoK = (p) => Math.min(2.5, Math.max(0.6, (Number(p.logoSize) || 100) / 100));

// Pictures swapped in the back office (blank = the standard picture).
const bo = (p) => (p && p.boPhotos) || {};
// Where a back-office picture sits in its space (dragged in the back office), as CSS object-position.
const boPos = (p, k, fallback = "center") => {
  const q = p && p.photoPos && p.photoPos[k];
  return q && (q.x != null || q.y != null) ? `${q.x ?? 50}% ${q.y ?? 50}%` : fallback;
};

// ---- 1. Title ---------------------------------------------------------------------
export function TitlePage({ p }) {
  const role = stripDot(p.roleTitle) || "Job Title";
  const long = role.length > 45;
  const all = team(p).map((c) => c.name).filter(Boolean);
  const names = all.length > 1 ? `${all.slice(0, -1).join(", ")} & ${all[all.length - 1]}` : all[0] || "";
  const email = teamSize(p) === 1 && p.consultant1 ? (p.c1.email || "") : "";
  const k = logoK(p);
  return (
    <Page bg={INK}>
      <Photo src={p.photoTitle} pos={(p.photoPos || {}).photoTitle} w={1920} h={964} />
      <Layer w={1920} h={964} bg="rgba(0,0,0,0.5)" />
      <Layer w={1920} h={964} bg={fadeDown(0.75)} blend="multiply" />
      <Mid cy={486} left={234} width={876} style={{ gap: 30 }}>
        {p.clientLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.clientLogo} alt="" style={{ maxWidth: Math.round(372 * k), maxHeight: Math.round(93 * k), objectFit: "contain", objectPosition: "left center", display: "block", filter: p.logoColour ? "none" : "brightness(0) invert(1)" }} />
        ) : null}
        <div className="col" style={{ gap: 15, color: "#fff" }}>
          <div style={{ fontSize: 96, fontWeight: 500, letterSpacing: "-0.96px", lineHeight: "normal", width: 876 }}>
            <span style={{ color: GREEN }}>{T(p, "title1", "Recruitment")}</span> {stripDot(T(p, "title2", "Proposal"))}<span style={{ color: GREEN }}>.</span>
          </div>
          <div style={{ fontSize: long ? 26 : 30, fontWeight: 500, letterSpacing: "-1.5px", lineHeight: "normal", maxWidth: 1100 }}>
            {stripDot(T(p, "sub", `For the Appointment of ${role}`))}.
          </div>
        </div>
        <div style={{ border: `1px solid ${GREEN}`, borderRadius: 50, padding: 20, alignSelf: "flex-start" }}>
          <div className="trim" style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.5, color: "#fff", whiteSpace: "nowrap" }}>{T(p, "badge", "PRIVATE & STRICTLY CONFIDENTIAL")}</div>
        </div>
      </Mid>
      <Footer bg={INK} prepared={T(p, "footer", null) ?? `Prepared by ${names || "Consultant"}${email ? ` | ${email}` : ""}`} />
    </Page>
  );
}

// ---- 2. Contents --------------------------------------------------------------------
export function ContentsPage({ p }) {
  const secs = pagePlan(p).filter((x) => x.sec && x.sec.inContents !== false).map((x) => x.sec);
  // More than five rows (added pages): tighten the spacing and type so it still fits above the footer.
  const rows = Math.ceil(secs.length / 2);
  const k = rows <= 5 ? 1 : Math.max(0.6, 5 / rows);
  const half = Math.ceil(secs.length / 2);
  const cells = [];
  for (let r = 0; r < half; r++) {
    cells.push(secs[r]);
    cells.push(secs[r + half] || null);
  }
  const client = String(p.clientName || "").trim();
  return (
    <Page bg={OFF}>
      <Tex />
      <Mid cy={506} left={106} width={1718} style={{ gap: Math.round(75 * Math.max(k, 0.7)) }}>
        <Heading text={T(p, "heading", "Contents")} size={75} style={{ height: 75 }} />
        <div style={{ display: "grid", gridTemplateColumns: "759px 759px", columnGap: 200, rowGap: Math.round(35 * k * k), alignItems: "center" }}>
          {cells.map((s, i) => s ? (
            <Block key={i} pad={k < 1 ? "4px 0 4px 25px" : "8px 0 8px 25px"} gap={Math.round(15 * k)} style={i % 2 === 0 && !cells[i + 1] ? { gridColumn: "1 / span 2" } : undefined}>
              <div className="trim" style={{ fontSize: Math.round(30 * Math.max(k, 0.8)), fontWeight: 500, lineHeight: 1.4, whiteSpace: "nowrap", ...(k < 1 ? { overflow: "hidden", textOverflow: "ellipsis" } : null) }}>
                {s.num} | {s.id === "about" && client ? `About ${client}` : s.name}<span style={{ color: GREEN }}>.</span>
              </div>
              <div className="trim" style={{ fontSize: k < 1 ? 14 : 15, fontWeight: 500, lineHeight: k < 1 ? 1.45 : 1.6, maxWidth: i % 2 === 0 && !cells[i + 1] ? 1390 : 734 }}>
                {s.id === "appendices" && !s.ownDesc ? appendicesDesc(p) : s.desc}
              </div>
            </Block>
          ) : null)}
        </div>
      </Mid>
      <Footer bg={INK} />
    </Page>
  );
}

// ---- 3. Our Understanding -------------------------------------------------------------
export function UnderstandingPage({ p }) {
  return (
    <Page bg={OFF}>
      <Tex kind="dark" w={1235} h={964} />
      <Photo src={p.photoUnderstanding} pos={(p.photoPos || {}).photoUnderstanding} x={1235} y={0} w={685} h={964} />
      <Layer x={1235} w={685} h={964} bg={fadeDown(0.55)} blend="multiply" />
      <div className="abs col" style={{ left: 0, top: 0, width: 1235, height: 964, padding: 100, justifyContent: "center", gap: 50 }}>
        <Heading text={T(p, "heading", "Our Understanding")} size={75} color="#fff" />
        <Rich text={p.understanding} style={{ fontSize: 22, fontWeight: 400, lineHeight: "30px", color: "#fff" }} />
      </div>
      <Footer logo="dark" text={INK} />
    </Page>
  );
}

// ---- 4. About -------------------------------------------------------------------------
export function AboutPage({ p }) {
  const client = String(p.clientName || "").trim() || "Client";
  return (
    <Page bg={INK}>
      <Photo src={p.photoAbout} pos={(p.photoPos || {}).photoAbout} x={0} y={0} w={833} h={964} />
      <Layer w={833} h={964} bg="linear-gradient(180deg, rgba(102,102,102,0) 0%, rgba(0,0,0,0.5) 100%)" />
      <Tex x={833} w={1087} h={964} />
      <div className="abs col" style={{ left: 833, top: 0, width: 1087, height: 964, padding: 100, justifyContent: "center", gap: 40 }}>
        <Heading text={T(p, "heading", `About ${client}`)} size={48} />
        <Rich text={p.about} style={{ fontSize: 22, fontWeight: 400, lineHeight: "30px" }} />
      </div>
      <Footer bg={INK} />
    </Page>
  );
}

// ---- 5. Role Profile ------------------------------------------------------------------
const VLine = ({ h = 22.5 }) => <div style={{ width: 2, height: h, background: LINE_GREEN, borderRadius: 1, flex: "none" }} />;

function InfoRow({ label, value, top }) {
  return (
    <div className="row" style={{ alignItems: top ? "flex-start" : "center", gap: 20 }}>
      <div className="row" style={{ alignItems: "center", gap: 20, flex: "none" }}>
        <div className="trim" style={{ width: 150, fontSize: 20, fontWeight: 500, lineHeight: 1.6, color: "#fff" }}>{label}</div>
        <VLine />
      </div>
      <div className="trim" style={{ fontSize: 20, fontWeight: 500, lineHeight: 1.6, color: "#fff", flex: 1 }}>{value}</div>
    </div>
  );
}

function MiniRow({ label, value, narrow }) {
  if (!String(value || "").trim()) return null;
  return (
    <div className="row" style={{ alignItems: "flex-start", gap: px(narrow ? 12 : 16) }}>
      <div className="row" style={{ alignItems: "center", gap: px(narrow ? 12 : 16), flex: "none" }}>
        <div style={{ width: px(narrow ? 112 : 130), fontSize: px(17), fontWeight: 500, lineHeight: 1.45, color: "#fff" }}>{label}</div>
        <div style={{ width: 2, alignSelf: "stretch", background: LINE_GREEN }} />
      </div>
      <div style={{ fontSize: px(17), fontWeight: 500, lineHeight: 1.45, color: "#fff", flex: 1 }}>{value}</div>
    </div>
  );
}

// The photo panel and darkening shared by the Role Profile pages.
function RolePhoto({ p }) {
  return (
    <>
      <Photo src={p.photoRole} pos={(p.photoPos || {}).photoRole} x={0} y={0} w={908} h={1080} />
      <Layer w={908} h={1080} bg="linear-gradient(270deg, rgba(0,0,0,0.5) 0%, rgba(102,102,102,0) 100%), rgba(0,0,0,0.5)" />
      <Tex kind="dark2" x={908} w={1012} h={1080} position="left center" />
    </>
  );
}
const roleBoxBg = <div className="full" style={{ background: "#000", opacity: 0.4, mixBlendMode: "multiply", borderRadius: 12 }} />;

// The Role Profile page with several roles.
function RolesPage({ p }) {
  const roles = roleList(p);
  const benefits = (p.benefits || []).map((b) => String(b || "").trim()).filter(Boolean);
  return (
    <Page bg={OFF}>
      <RolePhoto p={p} />
      <Fit className="abs" margin={[0, 0]} style={{ left: 100, top: 100, width: 708, height: 830, display: "flex", alignItems: "center" }}>
        <div className="col" style={{ width: 708, borderRadius: 12, padding: px(45), gap: px(22), position: "relative", overflow: "hidden" }}>
          {roleBoxBg}
          <Heading text={T(p, "rolesBox", "The Roles")} size={px(48)} color="#fff" style={{ position: "relative" }} />
          <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr", rowGap: px(16) }}>
            {roles.map((r, i) => (
              <div key={i} className="col" style={{ gap: px(8), paddingTop: i > 0 ? px(16) : 0, borderTop: i > 0 ? "2px solid rgba(255,255,255,0.18)" : "none" }}>
                <MiniRow label={T(p, "l1", "Job Title")} value={r.jobTitle} />
                <MiniRow label={T(p, "l2", "Location")} value={r.location} />
                <MiniRow label={T(p, "l3", "Reporting to")} value={r.reportingTo} />
                {!r.noDirectReports ? <MiniRow label={T(p, "l4", "Direct Reports")} value={r.directReports} /> : null}
                <MiniRow label="Salary" value={r.salary} />
                <MiniRow label="Contract" value={r.contract} />
              </div>
            ))}
          </div>
          {benefits.length ? (
            <div className="col" style={{ position: "relative", gap: px(8), paddingTop: px(16), borderTop: "2px solid rgba(255,255,255,0.18)" }}>
              <div style={{ fontSize: px(24), fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.5, color: GREEN }}>{T(p, "benefitsTitle", "Benefits")}</div>
              <ul style={{ listStyle: "disc", paddingLeft: 22.5, fontSize: px(15), fontWeight: 500, lineHeight: 1.6, color: "#fff", columnCount: benefits.length > 4 ? 2 : 1, columnGap: 30 }}>
                {benefits.map((b, i) => <li key={i} style={{ breakInside: "avoid" }}>{b}</li>)}
              </ul>
            </div>
          ) : null}
        </div>
      </Fit>
      <Fit className="abs col" margin={[0, 0]} style={{ left: 1008, top: 100, width: 812, height: 830, justifyContent: "center", gap: px(26) }}>
        <Heading text={T(p, "rolesHeading", "Role Profiles")} size={px(48)} color="#fff" lh={1.3} />
        {roles.filter((r) => String(r.jobTitle || "").trim() || String(r.profile || "").trim()).map((r, i) => (
          <div key={i} className="col" style={{ gap: px(14) }}>
            {String(r.jobTitle || "").trim() ? <div className="trim" style={{ fontSize: px(26), fontWeight: 600, lineHeight: 1.3, color: "#fff" }}>{r.jobTitle}</div> : null}
            {String(r.profile || "").trim() ? <Rich text={r.profile} ps={px(12)} style={{ fontSize: px(18), fontWeight: 400, lineHeight: 1.6, color: "#fff" }} /> : null}
          </div>
        ))}
      </Fit>
      <Footer border />
    </Page>
  );
}

export function RolePage({ p, sec }) {
  if (p.multiRole && (p.roles || []).length) return <RolesPage p={p} sec={sec} />;
  const benefits = (p.benefits || []).map((b) => String(b || "").trim()).filter(Boolean);
  const twoCol = benefits.length > 4;
  const offer = [p.salary, p.contract].map((x) => String(x || "").trim()).filter(Boolean);
  return (
    <Page bg={OFF}>
      <RolePhoto p={p} />
      <div className="abs" style={{ left: 100, top: 100, width: 708, height: 880, display: "flex", alignItems: "center" }}>
        <div className="col" style={{ width: 708, borderRadius: 12, padding: 50, gap: 30, position: "relative", overflow: "hidden" }}>
          {roleBoxBg}
          <Heading text={T(p, "roleBox", "The Role")} size={48} color="#fff" style={{ position: "relative" }} />
          <div className="col" style={{ position: "relative", gap: 15 }}>
            <InfoRow label={T(p, "l1", "Job Title")} value={p.jobTitle} />
            <InfoRow label={T(p, "l2", "Location")} value={p.location} />
            <InfoRow label={T(p, "l3", "Reporting to")} value={p.reportingTo} />
            {!p.noDirectReports && String(p.directReports || "").trim() ? <InfoRow label={T(p, "l4", "Direct Reports")} value={p.directReports} top /> : null}
          </div>
          <div className="col" style={{ position: "relative", gap: 15 }}>
            <div className="col" style={{ gap: 10 }}>
              <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.48px", lineHeight: "44px", color: GREEN }}>{T(p, "offer", "What’s on offer.")}</div>
              <div className="col" style={{ gap: 10 }}>
                {offer.map((o, i) => (
                  <div key={i} className="row" style={{ gap: 20, alignItems: "flex-start" }}>
                    <Svg svg={TICK(GREEN)} w={28} h={28} />
                    <div style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.6, color: "#fff" }}>{o}</div>
                  </div>
                ))}
              </div>
              <div style={{ height: 1, background: "rgba(255,255,255,0.18)" }} />
            </div>
            <div className="col" style={{ gap: 10 }}>
              <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.48px", lineHeight: "44px", color: GREEN }}>{T(p, "benefitsTitle", "Benefits")}</div>
              <ul style={{ listStyle: "disc", paddingLeft: 22.5, fontSize: 15, fontWeight: 500, lineHeight: 1.6, color: "#fff", columnCount: twoCol ? 2 : 1, columnGap: 30 }}>
                {(benefits.length ? benefits : ["TBC"]).map((b, i) => <li key={i} style={{ breakInside: "avoid" }}>{b}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="abs col" style={{ left: 908, top: 0, width: 1012, height: 1080, padding: 100, justifyContent: "center", gap: 30 }}>
        <div className="trim" style={{ fontSize: 48, fontWeight: 500, lineHeight: 1.6, color: "#fff" }}>{stripDot(T(p, "heading", "Role Profile"))}<span style={{ color: GREEN }}>.</span></div>
        <Rich text={p.roleProfile} ps={30} style={{ fontSize: 20, fontWeight: 400, lineHeight: "30px", color: "#fff" }} />
      </div>
      <Footer border />
    </Page>
  );
}

// ---- 6. Our Approach ------------------------------------------------------------------
export function ApproachPage({ p }) {
  const items = APPROACH.map((a, i) => ({ title: T(p, `a${i}t`, a.title), text: p[a.key] }));
  return (
    <Page bg={OFF}>
      <Tex y={375} h={705} />
      <Photo src={p.photoApproach} pos={(p.photoPos || {}).photoApproach} x={0} y={0} w={1920} h={375} />
      <Layer w={1920} h={375} bg="rgba(0,0,0,0.5)" />
      <Layer w={1920} h={375} bg={fadeDown(0.5)} blend="multiply" />
      <div className="abs col" style={{ left: 0, top: 0, width: 1920, height: 375, padding: "83px 100px", justifyContent: "center", gap: 40 }}>
        <Heading text={T(p, "heading", "Our Approach")} size={75} color="#fff" lh={1.2} style={{ height: 60, display: "flex", alignItems: "center", whiteSpace: "nowrap" }} />
        <div className="trim" style={{ width: 1724, fontSize: 20, fontWeight: 400, lineHeight: 1.4, color: "#fff" }}>{T(p, "intro", APPROACH_INTRO)}</div>
      </div>
      <div className="abs" style={{ left: 100, top: 351, height: 47, padding: "0 20px", borderRadius: 50, background: GREEN, display: "flex", alignItems: "center" }}>
        <span className="trim" style={{ fontSize: 24, fontWeight: 500, lineHeight: 1.6, color: "#fff", whiteSpace: "nowrap" }}>{T(p, "pill", "How we get it right")}</span>
      </div>
      <div className="abs" style={{ left: 106, top: 475, width: 1708, height: 430, display: "flex", alignItems: "center" }}>
        <div style={{ display: "grid", gridTemplateColumns: "833.5px 833.5px", columnGap: 41, rowGap: 50, alignItems: "stretch", width: 1708 }}>
          {items.map((it, i) => (
            <Block key={i} gap={24} style={{ justifyContent: "center" }}>
              <div className="trim" style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.4 }}>{stripDot(it.title)}<span style={{ color: GREEN }}>.</span></div>
              <Rich text={it.text} ps={10} style={{ fontSize: 18, fontWeight: 400, lineHeight: 1.6 }} />
            </Block>
          ))}
        </div>
      </div>
      <Footer border logo="dark" text={INK} />
    </Page>
  );
}

// ---- 7. Branded Campaigns -----------------------------------------------------------
// Three phone frames: a static ad, an animation and a video. The first two can each be swapped
// for a static branded ad from the shared folder; a swapped tile loses its "View Media" link.
function AdImage({ src, fit }) {
  if (fit === "whole") {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="full" style={{ objectFit: "cover", filter: "blur(18px) brightness(0.8)", transform: "scale(1.15)" }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="full" style={{ objectFit: "contain" }} />
      </>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className="full" style={{ objectFit: "cover", objectPosition: fit === "top" ? "center top" : fit === "bottom" ? "center bottom" : "center" }} />;
}
function PhoneTile({ x, src, fit, children }) {
  return (
    <div className="abs" style={{ left: x, top: 221, width: 377.344, height: 527.478 }}>
      <Img src={`${B}/phone-frame.svg`} w={377.344} h={527.478} style={{ position: "absolute", left: 0, top: 0 }} />
      <div className="abs" style={{ left: 5.8, top: 5.8, width: 365.177, height: 455.602, borderRadius: 15, overflow: "hidden", background: "#111" }}>
        <AdImage src={src} fit={fit} />
      </div>
      {children}
    </div>
  );
}
function ViewMedia({ x, href }) {
  return (
    <a href={href || undefined} target="_blank" rel="noreferrer" className="abs row" style={{ left: x, top: 826, border: `2px solid ${INK}`, borderRadius: 40, padding: "10px 16px", gap: 8, alignItems: "center" }}>
      <span className="trim" style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.5, color: INK, whiteSpace: "nowrap" }}>View Media</span>
      <Img src={`${B}/arrow-tri.svg`} w={16.13} h={14.3} style={{ transform: "rotate(90deg)", margin: "0 3px" }} />
    </a>
  );
}
export function BrandedPage({ p, ctx }) {
  const links = (ctx && ctx.mediaLinks) || [];
  const ad2 = String(p.brandedAd2 || "").trim();
  return (
    <Page bg={OFF}>
      <Tex />
      <Mid cy={494} left={100} width={478} style={{ gap: 9 }}>
        <Heading text={T(p, "heading", "Branded Campaigns")} size={75} lh={1.25} />
        <Block>
          <div className="trim" style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.4, whiteSpace: "nowrap" }}>{stripDot(T(p, "sub", "Design and video media"))}<span style={{ color: GREEN }}>.</span></div>
          <Rich text={T(p, "text", BRANDED_TEXT)} style={{ fontSize: 22, fontWeight: 400, lineHeight: 1.6 }} />
        </Block>
      </Mid>
      <PhoneTile x={645} src={p.brandedAd || `${B}/branded-1.jpg`} fit={p.brandedAd ? p.brandedFit : "center"} />
      <PhoneTile x={1052.344} src={ad2 || `${B}/branded-2.jpg`} fit={ad2 ? p.brandedFit2 : "center"} />
      <PhoneTile x={1459.688} src={`${B}/branded-3.jpg`} fit="center">
        <Img src={`${B}/play.svg`} w={65} h={65} style={{ position: "absolute", left: 155, top: 206.97 }} />
        <div className="abs" style={{ left: 75.31, top: 346.97, width: 225, height: 45 }}>
          <Img src={`${B}/howco-a.svg`} w={157.9} h={29.4} style={{ position: "absolute", left: 67.1, top: 7.84 }} />
          <Img src={`${B}/howco-b.svg`} w={49.6} h={45} style={{ position: "absolute", left: 0, top: 0 }} />
        </div>
      </PhoneTile>
      {!ad2 ? <ViewMedia x={1156} href={links[0]} /> : null}
      <ViewMedia x={1560} href={links[1]} />
      <Footer border logo="dark" text={INK} />
    </Page>
  );
}

// ---- 8. Candidate Packs ---------------------------------------------------------------
export function CandidatePage({ p, ctx }) {
  const hub = (ctx && ctx.candidatePack) || {};
  const own = p.candidatePack || {};
  const cp = { back: own.back || hub.back, front: own.front || hub.front, ipad: own.ipad || hub.ipad };
  // The two tilted screens, with the angle and size from the Figma design (Slide1 11 and Slide1 9).
  const Tilted = ({ src, x, y, k, shadow }) => (
    <div className="abs" style={{ left: x, top: y, width: 707.95, height: 465.763, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 593.58, height: 333.889, borderRadius: 18, overflow: "hidden", background: "#111", flex: "none", boxShadow: shadow,
        transform: "rotate(-15.75deg) skewX(8.41deg) scaleY(0.99)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="full cover" style={{ objectPosition: boPos(p, k) }} />
      </div>
    </div>
  );
  return (
    <Page bg={OFF}>
      <Tex />
      <Mid cy={481} left={100} width={542} style={{ gap: 9 }}>
        <div style={{ fontSize: 75, fontWeight: 500, lineHeight: 1.25, letterSpacing: "-0.75px" }}>
          {T(p, "heading1", "Candidate")}<br />{stripDot(T(p, "heading2", "Packs"))}<span style={{ color: GREEN }}>.</span>
        </div>
        <Block>
          <div className="trim" style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.4, whiteSpace: "nowrap" }}>{stripDot(T(p, "sub", "The Business, Unpacked"))}<span style={{ color: GREEN }}>.</span></div>
          <Rich text={T(p, "text", CANDIDATE_PACK_TEXT)} style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.6 }} />
        </Block>
      </Mid>
      <Tilted src={cp.back || `${B}/cp-back.jpg`} x={642} y={148} k="cp.back" shadow="-3px 4px 4px rgba(0,0,0,0.25)" />
      <Tilted src={cp.front || `${B}/cp-front.jpg`} x={888.22} y={290.41} k="cp.front" shadow="-25px 125px 150px rgba(0,0,0,0.51)" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${B}/cp-ipad.webp`} alt="" className="abs" style={{ left: 1284, top: 137, width: 540, height: 703, boxShadow: "0 7px 18.5px rgba(0,0,0,0.55)" }} />
      <div className="abs" style={{ left: 1309, top: 159, width: 490, height: 656, borderRadius: 7, background: "#d9d9d9", overflow: "hidden" }}>
        {cp.ipad ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cp.ipad} alt="" className="full" style={{ objectFit: "cover", objectPosition: boPos(p, "cp.ipad", "center top") }} />
        ) : [1, 2, 3].map((n, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={n} src={`${B}/cp-shot${n}.jpg`} alt="" className="abs cover" style={{ left: 11, top: 25 + i * 288, width: 468, height: 275, borderRadius: 5 }} />
        ))}
      </div>
      <Footer border logo="dark" text={INK} />
    </Page>
  );
}

// ---- 9. Search Process ------------------------------------------------------------------
function Ticks({ items }) {
  return (
    <div className="col" style={{ gap: 30 }}>
      {items.map((t, i) => {
        const last = i === items.length - 1;
        return (
          <div key={i} className="row" style={{ gap: 20, alignItems: "flex-start", paddingBottom: 25, borderBottom: last ? "none" : "1px solid rgba(147,147,147,0.25)" }}>
            <Svg svg={TICK_ROUND(GREEN)} w={28} h={28} />
            <div style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.6, color: "#fff", flex: 1, paddingTop: 1 }}>{t}</div>
          </div>
        );
      })}
    </div>
  );
}

function StageCard({ w, title, items, children }) {
  return (
    <div className="col" style={{ width: w, background: INK, borderRadius: 20, padding: 50, gap: 30, justifyContent: "space-between" }}>
      <div className="col" style={{ gap: 40 }}>
        <div style={{ borderBottom: `1px solid ${GREEN}`, height: 87, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="trim" style={{ fontSize: 20, fontWeight: 500, lineHeight: 1.4, color: "#fff", textAlign: "center" }}>{stripDot(title)}<span style={{ color: GREEN }}>.</span></div>
        </div>
        <Ticks items={items} />
      </div>
      {children}
    </div>
  );
}

function StagePill({ x, label, centre }) {
  return (
    <div className="abs" style={{ left: centre ? 0 : x, width: centre ? 1921 : undefined, top: 382, display: "flex", justifyContent: centre ? "center" : "flex-start" }}>
      <div style={{ padding: "10px 15px", borderRadius: 10, background: GREEN }}>
        <div className="trim" style={{ fontSize: 24, fontWeight: 500, lineHeight: 1.6, color: "#fff", whiteSpace: "nowrap" }}>{label}</div>
      </div>
    </div>
  );
}

export function SearchPage({ p }) {
  const st = SEARCH.stages.map((s, i) => ({ title: T(p, `s${i}t`, s.title), items: p.tx && p.tx[`s${i}i`] != null && lines(p.tx[`s${i}i`]).length ? lines(p.tx[`s${i}i`]) : s.items }));
  const [s1, s2, s3] = st;
  return (
    <Page bg={INK}>
      <Tex kind="dark" />
      <Photo src={bo(p).search || `${B}/search-banner.jpg`} pos={(p.photoPos || {})["bo.search"]} x={0} y={0} w={1920} h={440} />
      <Layer w={1920} h={440} bg="rgba(0,0,0,0.2)" />
      <Layer w={1920} h={440} bg={fadeDown(0.55)} blend="multiply" />
      <div className="abs" style={{ left: 100, top: 162, height: 60, width: 1720, display: "flex", alignItems: "center" }}>
        <Heading text={T(p, "heading", "Search Process")} size={75} color="#fff" lh={1.25} style={{ whiteSpace: "nowrap" }} />
      </div>
      <div className="abs trim" style={{ left: 100, top: 262, width: 1724, fontSize: 20, fontWeight: 500, lineHeight: "30px", color: "#fff" }}>{T(p, "sub", SEARCH.intro)}</div>
      <div className="abs row" style={{ left: 100, top: 402, height: 524, gap: 69, alignItems: "stretch" }}>
        <StageCard w={390} title={s1.title} items={s1.items} />
        <StageCard w={807} title={s2.title} items={s2.items}>
          <div className="row" style={{ justifyContent: "center", gap: 5 }}>
            <span className="trim" style={{ fontSize: 20, fontWeight: 500, lineHeight: 1.4, color: "#fff" }}>{T(p, "tfLabel", "Projected Timeframe:")}</span>
            <span className="trim" style={{ fontSize: 20, fontWeight: 500, lineHeight: 1.4, color: GREEN }}>{p.timeframe}</span>
          </div>
        </StageCard>
        <StageCard w={390} title={s3.title} items={s3.items} />
      </div>
      <StagePill x={237} label={T(p, "pill1", "Stage 1")} />
      <StagePill centre label={T(p, "pill2", "Stage 2")} />
      <StagePill x={1569} label={T(p, "pill3", "Stage 3")} />
      <Footer border />
    </Page>
  );
}

// ---- 10. Credentials ----------------------------------------------------------------------
function ContactLines({ c, color, size = 35, font = 20, gap = 15 }) {
  return (
    <div className="col" style={{ gap }}>
      {c.email ? (
        <div className="row" style={{ gap: 20, alignItems: "center" }}>
          <Svg svg={EMAIL_ICON(GREEN)} w={size} h={size} />
          <span className="trim" style={{ fontSize: font, fontWeight: 500, lineHeight: 1.5, color, overflowWrap: "anywhere" }}>{c.email}</span>
        </div>
      ) : null}
      {c.phone ? (
        <div className="row" style={{ gap: 20, alignItems: "center" }}>
          <Svg svg={PHONE_ICON(GREEN)} w={size} h={size} />
          <span className="trim" style={{ fontSize: font, fontWeight: 500, lineHeight: 1.5, color, whiteSpace: "nowrap" }}>{c.phone}</span>
        </div>
      ) : null}
    </div>
  );
}

function AboutMe({ text, color = INK, pad = "10px 0 10px 50px", title = "About me", width }) {
  return (
    <Block border={2} pad={pad} gap={24} style={{ width, justifyContent: "center" }}>
      <div className="trim" style={{ fontSize: 25, fontWeight: 500, lineHeight: 1.4, color }}>{stripDot(title)}<span style={{ color: GREEN }}>.</span></div>
      <Rich text={text} style={{ fontSize: 20, fontWeight: 400, lineHeight: 1.6, color }} />
    </Block>
  );
}

function Headshot({ name, x, y, w, h, photo, pos }) {
  const src = photo || headshotUrl(name);
  return (
    <div className="abs" style={{ left: x, top: y, width: w, height: h, borderRadius: 20, overflow: "hidden", background: "#cfcfcf" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img src={src} alt="" className="full cover" style={{ objectPosition: pos || "center 20%" }} /> : null}
    </div>
  );
}

export function CredentialsPage({ p, sec }) {
  if (teamSize(p) >= 3) return <CredentialsTeam p={p} sec={sec} />;
  if (p.twoConsultants) return <CredentialsTwo p={p} sec={sec} />;
  const c = { ...p.c1, name: p.c1.name || p.consultant1 };
  return (
    <Page bg={OFF}>
      <Tex />
      <Fill w={423} h={1080} color={INK} />
      <div className="abs" style={{ left: 100, top: 120, fontSize: 24, fontWeight: 500, letterSpacing: "-0.24px", lineHeight: 1.25, color: "#fff", whiteSpace: "nowrap" }}>
        {stripDot(T(p, "heading", "Your Specialist"))}<span style={{ color: GREEN }}>.</span>
      </div>
      <Headshot name={c.name} photo={c.photo} pos={boPos(p, "c1.photo", "center 20%")} x={100} y={174} w={447} h={680} />
      <Fit className="abs col" margin={[0, 0]} style={{ left: 622, top: 174, width: 1198, height: 680, justifyContent: "center", gap: px(40) }}>
        <div className="col" style={{ gap: px(30), width: 700 }}>
          <div className="col" style={{ gap: px(30) }}>
            <div className="trim" style={{ fontSize: px(40), fontWeight: 500, lineHeight: 1.6 }}>{c.name}</div>
            {c.title ? <div className="trim" style={{ fontSize: px(25), fontWeight: 500, lineHeight: 1.5, color: GREEN }}>{c.title}</div> : null}
          </div>
          <ContactLines c={c} color={INK} />
        </div>
        {c.about ? <AboutMe text={c.about} title={T(p, "aboutMe", "About me")} /> : null}
      </Fit>
      <Footer border text={INK} />
    </Page>
  );
}

function Profile({ c, x, p, k }) {
  return (
    <>
      <Headshot name={c.name} photo={c.photo} pos={boPos(p, `${k}.photo`, "center 20%")} x={x} y={160} w={282} h={381} />
      <div className="abs col" style={{ left: x + 357, top: 194, width: 449, gap: 30 }}>
        <div className="col" style={{ gap: 21 }}>
          <div className="trim" style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.6, color: INK }}>{c.name}</div>
          {c.title ? <div className="trim" style={{ fontSize: 20, fontWeight: 500, lineHeight: 1.5, color: INK }}>{c.title}</div> : null}
        </div>
        <ContactLines c={c} color={INK} />
      </div>
      {String(c.placements || "").trim() ? (
        <div className="abs" style={{ left: x + 357, top: 415, width: 449 }}>
          <Block border={2} pad="10px 0 10px 25px" gap={20}>
            <div className="trim" style={{ fontSize: 20, fontWeight: 500, lineHeight: 1.4, color: "#fff" }}>{T(p, "placements", "Recent Placements")}</div>
            <div className="trim" style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.4, color: "#fff", width: 422 }}>{c.placements}</div>
          </Block>
        </div>
      ) : null}
      {c.about ? (
        <div className="abs" style={{ left: x, top: 640, width: 806 }}>
          <AboutMe text={c.about} color="#fff" pad="10px 0 10px 25px" title={T(p, "aboutMe", "About me")} />
        </div>
      ) : null}
    </>
  );
}

function CredentialsTwo({ p }) {
  const a = { ...p.c1, name: p.c1.name || p.consultant1 };
  const b = { ...p.c2, name: p.c2.name || p.consultant2 };
  return (
    <Page bg={INK}>
      <Tex h={386} />
      <Tex kind="dark" y={386} h={694} />
      <div className="abs" style={{ left: 100, top: 80, fontSize: 24, fontWeight: 500, letterSpacing: "-0.24px", lineHeight: 1.25, color: INK, whiteSpace: "nowrap" }}>
        {stripDot(T(p, "heading", "Your Contacts"))}<span style={{ color: GREEN }}>.</span>
      </div>
      <Profile c={a} x={100} p={p} k="c1" />
      <Profile c={b} x={1018} p={p} k="c2" />
      <Footer border />
    </Page>
  );
}

// Three to five consultants: a column each (headshot, name, title, contact details and recent
// placements). No "About me" here; there isn't room for it.
function CredentialsTeam({ p }) {
  const people = team(p);
  const n = people.length;
  const gap = n >= 4 ? 40 : 60;
  const w = (1720 - gap * (n - 1)) / n;
  const line = (icon, text) => (
    <div className="row" style={{ gap: px(12), alignItems: "center" }}>
      <Svg svg={icon} w={26} h={26} />
      <span style={{ fontSize: px(17), fontWeight: 500, lineHeight: 1.4, color: INK, minWidth: 0, overflowWrap: "anywhere" }}>{text}</span>
    </div>
  );
  return (
    <Page bg={OFF}>
      <Tex />
      <div className="abs" style={{ left: 100, top: 80, fontSize: 24, fontWeight: 500, letterSpacing: "-0.24px", lineHeight: 1.25, color: INK, whiteSpace: "nowrap" }}>
        {stripDot(T(p, "heading", "Your Contacts"))}<span style={{ color: GREEN }}>.</span>
      </div>
      {people.map((c, i) => {
        const x = 100 + i * (w + gap);
        return (
          <div key={c.k}>
            <Headshot name={c.name} photo={c.photo} pos={boPos(p, `${c.k}.photo`, "center 20%")} x={x} y={160} w={w} h={400} />
            <Fit className="abs col" margin={[0, 0]} style={{ left: x, top: 595, width: w, height: 330, gap: px(22) }}>
              <div className="col" style={{ gap: px(8) }}>
                <div style={{ fontSize: px(28), fontWeight: 500, lineHeight: 1.3, color: INK }}>{c.name}</div>
                {c.title ? <div style={{ fontSize: px(19), fontWeight: 500, lineHeight: 1.35, color: INK }}>{c.title}</div> : null}
              </div>
              {c.email || c.phone ? (
                <div className="col" style={{ gap: px(10) }}>
                  {c.email ? line(EMAIL_ICON(GREEN), c.email) : null}
                  {c.phone ? line(PHONE_ICON(GREEN), c.phone) : null}
                </div>
              ) : null}
              {String(c.placements || "").trim() ? (
                <Block border={2} pad={`${px(6)} 0 ${px(6)} ${px(18)}`} gap={12}>
                  <div style={{ fontSize: px(18), fontWeight: 500, lineHeight: 1.35, color: INK }}>{T(p, "placements", "Recent Placements")}</div>
                  <div style={{ fontSize: px(16), fontWeight: 500, lineHeight: 1.45, color: INK }}>{c.placements}</div>
                </Block>
              ) : null}
            </Fit>
          </div>
        );
      })}
      <Footer border logo="dark" text={INK} />
    </Page>
  );
}

// ---- 11. Terms & Fee Structure ----------------------------------------------------------------
export function TermsPage({ p }) {
  const covered = p.tx && lines(p.tx.covered).length ? lines(p.tx.covered) : [!p.nda ? "Branded Media Adverts" : null, "Candidate Pack", "NDA Led Search"].filter(Boolean);
  const fee = String(p.fee || "").trim() || "25%";
  const widths = [276, 289, 272, 230];
  const pay = lines(p.paymentTerms ?? PAYMENT_TERMS).slice(0, 6);
  const note = String(p.paymentNote ?? PAYMENT_NOTE).trim();
  return (
    <Page bg={INK}>
      <Tex kind="dark" />
      <Fill w={670} h={1080} color="#ffffff" opacity={0.03} />
      <Photo src={p.photoTerms || `${B}/terms-photo.jpg`} pos={(p.photoPos || {}).photoTerms} x={670} y={0} w={1250} h={640} />
      <Layer x={670} w={1250} h={640} bg={fadeDown(0.55)} blend="multiply" />
      <Tex x={670} y={640} w={1250} h={440} />
      <EMark x={735} y={352} w={1204} h={924} color="#000000" />
      <div className="abs row" style={{ left: 745, top: 715, gap: 20, alignItems: "flex-start" }}>
        {TERMS_POINTS.map((t, i) => (
          <div key={i} className="col" style={{ width: widths[i], borderLeft: `1px solid ${GREEN}`, paddingLeft: 25, gap: 20 }}>
            <div className="trim" style={{ fontSize: 20, fontWeight: 500, lineHeight: 1.6, color: GREEN }}>{T(p, `tp${i}t`, t.title)}</div>
            <div className="trim" style={{ fontSize: 18, fontWeight: 400, lineHeight: 1.6, color: INK }}>
              {T(p, `tp${i}x`, null) ?? <>{t.text.replace("{weeks}", String(p.guaranteeWeeks || "16").trim() || "16").replace("{days}", String(p.paymentDays || "30").trim() || "30")}{t.bold ? <span style={{ fontWeight: 600 }}>{t.bold}</span> : null}</>}
            </div>
          </div>
        ))}
      </div>
      <Fit className="abs col" margin={[0, 0]} style={{ left: 100, top: 100, width: 470, height: 805, justifyContent: "center", gap: px(30), color: "#fff" }}>
        <div className="col" style={{ gap: px(25) }}>
          <div className="col" style={{ gap: px(30) }}>
            <div className="trim" style={{ fontSize: px(35), fontWeight: 500, lineHeight: 1.4, whiteSpace: "nowrap" }}>{stripDot(T(p, "heading", "Terms & Fee Structure"))}<span style={{ color: GREEN }}>.</span></div>
            <div className="row" style={{ alignItems: "center", gap: 15 }}>
              <Svg svg={INFO_ICON(GREEN)} w={30} h={30} />
              <span className="trim" style={{ fontSize: px(20), fontWeight: 500, lineHeight: 1.4, whiteSpace: "pre-wrap", minWidth: 0, flex: "1 1 0" }}>{stripDot(T(p, "feeLine", String(p.feeLine ?? "").trim() || `Fee | ${fee} + VAT of package`))}.</span>
            </div>
          </div>
          <div className="col" style={{ gap: px(24) }}>
            <div className="trim" style={{ fontSize: px(24), fontWeight: 500, lineHeight: 1.4, color: GREEN }}>{T(p, "ptTitle", "Payment Terms.")}</div>
            <div className="col" style={{ gap: px(10) }}>
              {pay.length > 1 ? (
                <ul style={{ listStyle: "disc", paddingLeft: 27, fontSize: px(22), fontWeight: 400, lineHeight: 1.45, display: "flex", flexDirection: "column", gap: px(8) }}>
                  {pay.map((l, i) => <li key={i}>{l}</li>)}
                </ul>
              ) : <div style={{ fontSize: px(22), fontWeight: 400, lineHeight: "normal" }}>{pay[0]}</div>}
              {note ? <div style={{ fontSize: px(15), fontWeight: 500, lineHeight: 1.6 }}>{note}</div> : null}
            </div>
          </div>
        </div>
        <div className="col" style={{ gap: px(15) }}>
          <div className="trim" style={{ fontSize: px(24), fontWeight: 500, lineHeight: 1.4, color: GREEN }}>{T(p, "covTitle", "Everything Covered.")}</div>
          <div className="col" style={{ gap: px(19) }}>
            {covered.map((t) => (
              <div key={t} className="row" style={{ gap: 20, alignItems: "center", paddingBottom: 5 }}>
                <Svg svg={TICK_ROUND(GREEN)} w={28} h={28} />
                <span className="trim" style={{ fontSize: px(16), fontWeight: 500, lineHeight: 1.6 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </Fit>
      <Footer border text={INK} />
    </Page>
  );
}

// ---- 12. Next Steps --------------------------------------------------------------------------
export function NextPage({ p }) {
  const client = String(p.clientName || "").trim();
  const field = (label, h = 45) => (
    <div className="row" style={{ alignItems: "center", height: h }}>
      <span className="trim" style={{ width: 120, fontSize: 18, fontWeight: 500, lineHeight: 1.6, flex: "none" }}>{label}</span>
      <div style={{ flex: 1, height: h, background: "#fff", borderRadius: 10 }} />
    </div>
  );
  return (
    <Page bg={INK}>
      <Tex kind="dark2" w={1920} h={560} />
      <div className="abs col" style={{ left: 100, top: 0, width: 1720, height: 560, justifyContent: "center", gap: 40, color: "#fff" }}>
        <div className="col" style={{ gap: 25 }}>
          <Heading text={T(p, "heading", "Next Steps")} size={100} color="#fff" lh={1.25} style={{ whiteSpace: "nowrap" }} />
          <div className="row" style={{ gap: 50 }}>
            {(p.tx && lines(p.tx.points).length ? lines(p.tx.points) : NEXT_STEPS.points).map((t, i) => (
              <div key={i} className="row" style={{ gap: 10, alignItems: "center" }}>
                <div style={{ width: 35, height: 35, borderRadius: 21.5, border: `2px solid ${GREEN}`, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                  <span className="trim" style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.4 }}>{String(i + 1).padStart(2, "0")}</span>
                </div>
                <span className="trim" style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.4, whiteSpace: "nowrap" }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
        <Block border={2} pad="0 0 0 25px" gap={32}>
          <div className="trim" style={{ fontSize: 24, fontWeight: 500, lineHeight: 1.6, color: GREEN }}>{T(p, "agTitle", "Agreement of terms")}</div>
          <div className="trim" style={{ fontSize: 20, fontWeight: 500, lineHeight: 1.6 }}>{T(p, "agText", NEXT_STEPS.text)}</div>
        </Block>
      </div>
      <Photo src={bo(p).next || `${B}/next-photo.jpg`} pos={(p.photoPos || {})["bo.next"]} x={0} y={560} w={993} h={520} />
      <Layer y={560} w={993} h={520} bg={fadeDown(0.75)} blend="multiply" />
      <Fill x={993} y={560} w={927} h={520} color={OFF} />
      <div className="abs col" style={{ left: 1093, top: 660, width: 727, height: 220, justifyContent: "center", gap: 18 }}>
        <div className="col" style={{ gap: 20 }}>
          <span className="trim" style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.6 }}>{T(p, "signed", `Signed on behalf of ${client}`)}</span>
          <div style={{ height: 79, background: "#fff", borderRadius: 10 }} />
        </div>
        {field("Name")}
        {field("Position", 44)}
        {field("Date")}
      </div>
      <Footer border text={INK} />
    </Page>
  );
}

// Stored documents are served from the hub; links in the PDF need the full address.
const absLink = (u) => {
  if (!u) return undefined;
  if (u.startsWith("/") && typeof window !== "undefined") return window.location.origin + u;
  return u;
};

// The big round photo used on the Appendices and End pages: the design's own (already cut to
// the circle) or a replacement from the back office, cut to the same circle.
function RoundPhoto({ x, own, def, pos }) {
  return (
    <div className="abs" style={{ left: x, top: -130, width: 1539, height: 1432, borderRadius: "50%", overflow: "hidden" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={own || def} alt="" className="full" style={own ? { objectFit: "cover", objectPosition: pos } : { objectFit: "fill" }} />
    </div>
  );
}

// ---- Appendices --------------------------------------------------------------------------------
export function AppendicesPage({ p }) {
  // Added pages list free lines; a web address on a line becomes its View button.
  const list = p.tx && lines(p.tx.items).length
    ? lines(p.tx.items).map((l) => { const m = l.match(/https?:\/\/\S+/); return { label: l.replace(/https?:\/\/\S+/, "").replace(/[\s|–-]+$/, "").trim(), link: m && m[0] }; })
    : appendices(p).map((a, i) => ({ label: `Appendix ${i + 1} | ${stripDot(a.title)}`, link: a.link }));
  return (
    <Page bg={OFF}>
      <Tex />
      <RoundPhoto x={833} own={bo(p).appendix} def={`${B}/appendix-photo.webp`} pos={boPos(p, "bo.appendix")} />
      <Mid cy={540.5} left={106} width={760} style={{ gap: 45 }}>
        <Heading text={T(p, "heading", "Appendices")} size={75} style={{ height: 75 }} />
        <div className="col" style={{ gap: 30 }}>
          {list.map((a, i) => (
            <Block key={i} pad="8px 0 8px 25px" gap={25}>
              <div className="trim" style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.4 }}>{stripDot(a.label)}<span style={{ color: GREEN }}>.</span></div>
              {a.link || !(p.tx && (p.tx.__extra || lines(p.tx.items).length)) ? (
                <a href={absLink(a.link)} style={{ width: 82, height: 46, border: `2px solid ${INK}`, borderRadius: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="trim" style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.5 }}>View</span>
                </a>
              ) : null}
            </Block>
          ))}
        </div>
      </Mid>
      <Footer border logo="dark" />
    </Page>
  );
}

// ---- End slide -----------------------------------------------------------------------------------
export function EndPage({ p }) {
  return (
    <Page bg={OFF}>
      <Tex />
      <RoundPhoto x={-515} own={bo(p).end} def={`${B}/end-photo.webp`} pos={boPos(p, "bo.end")} />
      <Img src={`${B}/logo-big-white.svg`} w={737} h={152} style={{ position: "absolute", left: 110, top: 464 }} />
      <Mid cy={532} left={1127} width={697}>
        <div style={{ fontSize: 75, fontWeight: 500, lineHeight: "normal", letterSpacing: "-0.75px", color: INK }}>
          {T(p, "line1", "Begin your search")}<br />{stripDot(T(p, "line2", "journey today"))}<span style={{ color: GREEN }}>.</span>
        </div>
      </Mid>
      <Footer border text={INK} />
    </Page>
  );
}

// ---- The full proposal ---------------------------------------------------------------------------
// Returns [{key, label, el}] in page order.
// ---- Added page built from scratch (or from an uploaded document) ------------------------
export function CustomPage({ p, ep }) {
  const dark = !!(ep && ep.bg === "dark");
  return (
    <Page bg={dark ? INK : OFF}>
      <Tex kind={dark ? "dark" : "light"} />
      <div className="abs" style={{ left: 100, top: 100, width: 1720 }}>
        <Heading text={T(p, "heading", "New page")} size={60} color={dark ? "#fff" : INK} lh={1.1} />
      </div>
      <Blocks blocks={(ep && ep.blocks) || []} dark={dark} acc={GREEN} />
      <Footer bg={INK} />
    </Page>
  );
}

export function proposalPages(p, ctx = {}) {
  const core = {
    title: (sec, q = p) => ({ label: "Title", el: <TitlePage p={q} ctx={ctx} /> }),
    contents: (sec, q = p) => ({ label: "Contents", el: <ContentsPage p={q} /> }),
    understanding: (sec, q = p) => ({ label: "Our Understanding", el: <UnderstandingPage p={q} sec={sec} /> }),
    about: (sec, q = p) => ({ label: "About", el: <AboutPage p={q} sec={sec} /> }),
    role: (sec, q = p) => ({ label: "Role Profile", el: <RolePage p={q} sec={sec} /> }),
    approach: (sec, q = p) => ({ label: "Our Approach", el: <ApproachPage p={q} sec={sec} /> }),
    branded: (sec, q = p) => ({ label: "Branded Campaigns", el: <BrandedPage p={q} sec={sec} ctx={ctx} /> }),
    candidate: (sec, q = p) => ({ label: "Candidate Packs", el: <CandidatePage p={q} sec={sec} ctx={ctx} /> }),
    search: (sec, q = p) => ({ label: "Search Process", el: <SearchPage p={q} sec={sec} /> }),
    credentials: (sec, q = p) => ({ label: "Credentials", el: <CredentialsPage p={q} sec={sec} /> }),
    terms: (sec, q = p) => ({ label: "Terms & Fees", el: <TermsPage p={q} sec={sec} /> }),
    next: (sec, q = p) => ({ label: "Next Steps", el: <NextPage p={q} sec={sec} /> }),
    appendices: (sec, q = p) => ({ label: "Appendices", el: <AppendicesPage p={q} sec={sec} /> }),
    end: (sec, q = p) => ({ label: "End", el: <EndPage p={q} /> }),
  };
  // Added pages reuse the same page designs with their own wording and pictures.
  const STYLE = {
    title: (q) => <TitlePage p={q} ctx={ctx} />, understanding: (q, sec) => <UnderstandingPage p={q} sec={sec} />,
    about: (q, sec) => <AboutPage p={q} sec={sec} />, role: (q, sec) => <RolePage p={q} sec={sec} />,
    approach: (q, sec) => <ApproachPage p={q} sec={sec} />, search: (q, sec) => <SearchPage p={q} sec={sec} />,
    credentials: (q, sec) => <CredentialsPage p={q} sec={sec} />, credentials2: (q, sec) => <CredentialsPage p={q} sec={sec} />,
    terms: (q, sec) => <TermsPage p={q} sec={sec} />, next: (q, sec) => <NextPage p={q} sec={sec} />,
    appendices: (q, sec) => <AppendicesPage p={q} sec={sec} />, end: (q) => <EndPage p={q} />,
    custom: (q, sec, ep) => <CustomPage p={q} ep={ep} />,
  };
  // Wording changed in the back office for this proposal's standard pages.
  const own = (key) => (p.pageText && p.pageText[key] && Object.values(p.pageText[key]).some((v) => String(v || "").trim()) ? { ...p, tx: p.pageText[key] } : p);
  const corePage = (key, sec) => core[key](sec, own(key));
  return pagePlan(p).map((x) => {
    if (x.extra) {
      const st = styleById(x.extra.style);
      const q = extraProps(p, x.extra);
      const render = STYLE[x.extra.style] || (() => null);
      const el = render(q, x.sec || null, x.extra);
      return { key: x.key, extra: true, label: (x.sec && x.sec.name) || st.label.replace(/ style.*$/, ""),
        el: x.extra.style === "custom" ? el : <WithBlocks el={el} blocks={x.extra.blocks} dark={x.extra.bg === "dark"} acc={GREEN} /> };
    }
    return { key: x.key, ...corePage(x.key, x.sec) };
  });
}

// Shared with the candidate pack pages.
export { Grad, Fill, Photo, Svg, Img, Paras, Rich, Header, Page, Base, EMark, Tex, Layer, Footer, Heading, Mid, Block, T, lines, stripDot, logoK, fadeDown, SHADE, SHADE_REV, INK, GREEN, OFF };

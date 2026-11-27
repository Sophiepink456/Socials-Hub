// The candidate pack pages, each 1920 x 1080, laid out to match the 2026 Brand System Figma file
// ("Candidate Pack Design", file dQpO0rDkzxM9bmGr0aDWqR). The client's colours (accent and dark)
// replace the example client's greens.
import { Photo, Svg, Img, Tex, Layer, Footer as BrandFooter, Mid, stripDot, lines, logoK, fadeDown, INK, OFF } from "../proposal/pages";
import { PACK_TEXT, DEFAULT_ACCENT, DEFAULT_DARK, headshotUrl, packTeam, isSub, subText } from "./data";
import { packPlan, packExtraProps } from "./extra";
import { Blocks, WithBlocks } from "../blocks";
import { PHONE30, EMAIL30, TICK28, STEP_ICONS, LAPTOP, LAPTOP_SCREEN } from "./icons";

const okHex = (v, d) => (/^#[0-9a-f]{6}$/i.test(String(v || "").trim()) ? String(v).trim() : d);
const acc = (p) => okHex(p.accent, DEFAULT_ACCENT);
const dark = (p) => okHex(p.dark, DEFAULT_DARK);
// Standard wording, unless changed for this pack in the back office.
const W = (p, k) => {
  const v = p && p.pageText && p.pageText[k];
  return v != null && String(v).trim() !== "" ? String(v) : PACK_TEXT[k];
};
const pos = (p, k) => (p.photoPos || {})[k];
const site = (u) => {
  const s = String(u || "").trim();
  return !s ? "" : /^https?:\/\//i.test(s) ? s : `https://${s}`;
};

// A column of text centred in a space. The form measures it (data-fit) and won't let more go in
// once it's full.
function FitBox({ name, x, y = 100, w, h = 764, children }) {
  return (
    <div className="abs" data-fit={name} style={{ left: x, top: y, width: w, height: h, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div data-fit-inner="">{children}</div>
    </div>
  );
}

function PPage({ p, bg, children }) {
  return <div className="pp pp26" style={{ background: bg, "--acc": acc(p) }}>{children}</div>;
}

// Footer: the Elevation logo and socials on the left, our website on the right.
const Footer = ({ border, prepared }) => <BrandFooter bg={INK} border={border} prepared={prepared} />;

// Title page: "Prepared by" the consultant and their email, or just the names when there's more than one.
function preparedBy(p) {
  const team = packTeam(p).filter((c) => c.name && !/^Consultant( \d)?$/.test(c.name));
  if (!team.length) return undefined;
  if (team.length === 1) return `Prepared by ${team[0].name}${team[0].email ? ` | ${team[0].email}` : ""}`;
  return `Prepared by ${team.slice(0, -1).map((c) => c.name).join(", ")} & ${team[team.length - 1].name}`;
}

// "Visit Client" button (title and end pages).
function VisitClient({ p }) {
  const href = site(p.clientWebsite);
  if (!href) return null;
  return (
    <a href={href} style={{ border: "1px solid #fff", borderRadius: 40, padding: 16, alignSelf: "flex-start" }}>
      <div className="trim" style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.5, color: "#fff", whiteSpace: "nowrap" }}>Visit Client</div>
    </a>
  );
}

function Logo({ p, maxW, maxH, white, align = "left center" }) {
  if (!p.clientLogo) return null;
  const k = logoK(p);
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={p.clientLogo} alt="" style={{ maxWidth: Math.round(maxW * k), maxHeight: Math.round(maxH * k), objectFit: "contain", objectPosition: align, display: "block",
    filter: white || !p.logoColour ? "brightness(0) invert(1)" : "none" }} />;
}

// Headings: the words between *stars* (or, without stars, the last word) and the full stop are
// in the client's colour, as in the Figma file ("Key *Responsibilities*").
function Head({ text, color = INK, hi, style }) {
  const raw = stripDot(text);
  let parts;
  if (raw.includes("*")) parts = raw.split("*").map((t, i) => [t, i % 2 === 1]);
  else {
    const i = raw.lastIndexOf(" ");
    parts = i > 0 ? [[raw.slice(0, i + 1), false], [raw.slice(i + 1), true]] : [[raw, true]];
  }
  return (
    <div style={{ color, fontWeight: 500, ...style }}>
      {parts.map(([t, on], i) => (t ? <span key={i} style={on ? { color: hi } : undefined}>{t}</span> : null))}
      <span style={{ color: hi }}>.</span>
    </div>
  );
}
function Paras({ text, gap, style, fallback }) {
  const ps = lines(text);
  return (
    <div className="trim" style={style}>
      {(ps.length ? ps : [fallback || ""]).map((t, i) => <p key={i} style={{ marginTop: i ? gap : 0 }}>{t}</p>)}
    </div>
  );
}
const cleanList = (xs) => (xs || []).map((x) => String(x || "").trim()).filter(Boolean);

// A bullet list where "## " lines are semibold subheadings above their points.
function Points({ items, gap, subGap, empty }) {
  const list = items.length ? items : [empty];
  const out = [];
  let ul = null;
  list.forEach((t) => {
    if (isSub(t)) { ul = null; out.push({ sub: subText(t) }); return; }
    if (!ul) { ul = []; out.push({ ul }); }
    ul.push(t);
  });
  return (
    <div>
      {out.map((o, i) => o.sub ? (
        <p key={i} style={{ fontWeight: 600, marginTop: i ? subGap : 0, marginBottom: gap }}>{o.sub}</p>
      ) : (
        <ul key={i} style={{ listStyle: "disc", paddingLeft: 24 }}>
          {o.ul.map((t, j) => <li key={j} style={{ marginBottom: i === out.length - 1 && j === o.ul.length - 1 ? 0 : gap }}>{t}</li>)}
        </ul>
      ))}
    </div>
  );
}

// Photo panel with the template's darkening (40% black, then shade to 75% black at the bottom).
function DarkPhoto({ src, pos: ps, x = 0, y = 0, w, h }) {
  return (
    <>
      <Photo src={src} pos={ps} x={x} y={y} w={w} h={h} />
      <Layer x={x} y={y} w={w} h={h} bg="linear-gradient(180deg, rgba(102,102,102,0) 0%, rgba(0,0,0,0.75) 100%), rgba(0,0,0,0.4)" />
    </>
  );
}

// ---- 1. Title ---------------------------------------------------------------------------
export function PackTitle({ p }) {
  return (
    <PPage p={p} bg={INK}>
      <Photo src={p.photoTitle} pos={pos(p, "photoTitle")} w={1920} h={964} />
      <Layer w={1920} h={964} bg="rgba(0,0,0,0.5)" />
      <Layer w={1920} h={964} bg={fadeDown(0.75)} blend="multiply" />
      <Mid cy={540.5} left={234} width={1100} style={{ gap: 20 }}>
        {p.clientLogo ? <div style={{ minHeight: Math.round(93 * logoK(p)), display: "flex", alignItems: "center" }}><Logo p={p} maxW={372} maxH={93} /></div> : null}
        <div className="col" style={{ gap: 25, color: "#fff" }}>
          <div style={{ fontSize: 100, fontWeight: 500, lineHeight: "normal" }}>{stripDot(p.roleTitle) || "Job Title"}<span style={{ color: acc(p) }}>.</span></div>
          <div style={{ fontSize: 25, fontWeight: 500, letterSpacing: "-1.25px", lineHeight: "normal" }}>{W(p, "sub")}</div>
        </div>
        <VisitClient p={p} />
      </Mid>
      <Footer prepared={preparedBy(p)} />
    </PPage>
  );
}

// ---- 2. About -----------------------------------------------------------------------------
export function PackAbout({ p }) {
  const S = LAPTOP_SCREEN;
  return (
    <PPage p={p} bg={OFF}>
      <Layer w={1920} h={1080} bg={fadeDown(0.2)} blend="multiply" />
      <Layer x={1235} w={685} h={1080} bg={dark(p)} />
      <Layer x={1235} w={685} h={1080} bg={fadeDown(0.5)} blend="multiply" />
      <Tex w={1235} h={1080} />
      <FitBox name="About" x={100} y={100} w={885} h={764}>
        <div className="col" style={{ gap: 40 }}>
          <div style={{ fontSize: 48, fontWeight: 500, lineHeight: 1, letterSpacing: "-0.48px" }}>
            About <span style={{ color: dark(p) }}>{stripDot(p.clientName) || "Client"}.</span>
          </div>
          <Paras text={p.about} gap={26} fallback="About the client." style={{ fontSize: 22, fontWeight: 400, lineHeight: "normal" }} />
        </div>
      </FitBox>
      <div className="abs" style={{ left: 999, top: 177, width: 1080, height: 627 }}>
        <div className="abs" style={{ left: S.x, top: S.y, width: S.w, height: S.h, background: "#e3e8e8", overflow: "hidden" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {p.siteShot ? <img src={p.siteShot} alt="" className="full cover" style={{ objectPosition: "center top" }} /> : null}
        </div>
        <div className="abs" style={{ left: 0, top: 0 }}><Svg svg={LAPTOP} w={1080} h={627} /></div>
      </div>
      <Footer />
    </PPage>
  );
}

// ---- 2b. The Opportunity --------------------------------------------------------------------
export function PackOpportunity({ p }) {
  return (
    <PPage p={p} bg={INK}>
      <Photo src={p.photoOpportunity} pos={pos(p, "photoOpportunity")} x={977} y={0} w={946} h={964} />
      <Layer x={977} w={946} h={964} bg="linear-gradient(0deg, rgba(0,0,0,0.5) 0%, rgba(102,102,102,0) 63.827%), rgba(0,0,0,0.5)" />
      <Tex w={977} h={964} />
      <FitBox name="The Opportunity" x={100} w={777}>
        <div className="col" style={{ gap: 40 }}>
          <Head text={W(p, "oppTitle")} hi={acc(p)} style={{ fontSize: 48, lineHeight: 1, letterSpacing: "-0.48px" }} />
          <Paras text={p.opportunity} gap={26} fallback="Add the opportunity in the form." style={{ fontSize: 22, fontWeight: 400, lineHeight: "normal" }} />
        </div>
      </FitBox>
      <Footer />
    </PPage>
  );
}

// ---- 3. The Role --------------------------------------------------------------------------
export function PackRole({ p }) {
  const rows = [
    [W(p, "l1"), p.jobTitle], [W(p, "l2"), p.location], [W(p, "l3"), p.reportingTo],
    ...(p.noDirectReports ? [] : [[W(p, "l4"), p.directReports]]),
  ];
  return (
    <PPage p={p} bg={INK}>
      <DarkPhoto src={p.photoRole} pos={pos(p, "photoRole")} w={940} h={964} />
      <div className="abs col" style={{ left: 100, top: 100, width: 740, height: 764, justifyContent: "center" }}>
        <div className="col" style={{ width: "100%", padding: 50, borderRadius: 20, background: "rgba(0,0,0,0.55)", gap: 40 }}>
          <Head text={W(p, "roleBox")} color="#fff" hi={acc(p)} style={{ fontSize: 60, lineHeight: 1, letterSpacing: "-0.6px" }} />
          {rows.map(([k, v], i) => (
            <div key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.2)", paddingBottom: 25 }}>
              <div className="trim" style={{ fontSize: 20, fontWeight: 500, lineHeight: 1.6, color: "#fff" }}>{k} | {v || "—"}</div>
            </div>
          ))}
        </div>
      </div>
      <Tex x={940} w={980} h={964} />
      <FitBox name="The Role" x={1040} w={780}>
        <div className="col" style={{ gap: 25 }}>
          <Head text={W(p, "roleProfile")} hi={acc(p)} style={{ fontSize: 48, lineHeight: 1, letterSpacing: "-0.48px" }} />
          <Paras text={p.roleProfile} gap={30} fallback="Role profile." style={{ fontSize: 22, fontWeight: 400, lineHeight: "30px" }} />
        </div>
      </FitBox>
      <Footer />
    </PPage>
  );
}

// ---- 4 & 5. Key Responsibilities / What We're Looking For ---------------------------------
function LeftTitle({ p, title, intro, bottom }) {
  return (
    <div className="abs col" style={{ left: 100, top: bottom - 300, width: 629, height: 300, justifyContent: "flex-end", gap: 25, color: "#fff" }}>
      <Head text={title} color="#fff" hi={acc(p)} style={{ fontSize: 48, lineHeight: 1, letterSpacing: "-0.48px" }} />
      <div className="trim" style={{ fontSize: 22, fontWeight: intro.medium ? 500 : 400, lineHeight: 1.6 }}>{intro.text}</div>
    </div>
  );
}

// `more`: an extra page in the same format, with just its own points.
export function PackKey({ p, more }) {
  const list = cleanList(more ? more.points : p.keyPoints);
  const paras = more ? [] : lines(p.keyText);
  const photo = (more && more.photo) || p.photoKey;
  return (
    <PPage p={p} bg={INK}>
      <DarkPhoto src={photo} pos={pos(p, more ? `keyMore.${more.j}.photo` : "photoKey")} w={833} h={964} />
      <LeftTitle p={p} title={W(p, "keyTitle")} intro={{ text: W(p, "keyIntro"), medium: true }} bottom={830} />
      <Tex x={833} w={1089} h={964} />
      <FitBox name={more ? `Key Responsibilities (${more.j + 2})` : "Key Responsibilities"} x={933} w={887}>
        <div style={{ borderLeft: `2px solid ${acc(p)}`, padding: "10px 0 10px 25px" }}>
          <div className="trim" style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.6, overflowWrap: "anywhere" }}>
            {paras.map((t, i) => <p key={i} style={{ marginBottom: 5 }}>{t}</p>)}
            {paras.length ? <p style={{ marginBottom: 5 }}>&nbsp;</p> : null}
            {!more ? <p style={{ marginBottom: 5 }}>{W(p, "keyListTitle")}</p> : null}
            <Points items={list} gap={5} subGap={14} empty="Add the responsibilities in the form." />
          </div>
        </div>
      </FitBox>
      <Footer />
    </PPage>
  );
}

export function PackLooking({ p, more }) {
  const list = cleanList(more ? more.points : p.lookingPoints);
  const paras = more ? [] : lines(p.lookingText);
  const outro = more ? [] : lines(p.lookingOutro);
  const photo = (more && more.photo) || p.photoLooking;
  return (
    <PPage p={p} bg={INK}>
      <DarkPhoto src={photo} pos={pos(p, more ? `lookingMore.${more.j}.photo` : "photoLooking")} w={833} h={964} />
      <LeftTitle p={p} title={W(p, "lookingTitle")} intro={{ text: W(p, "lookingIntro") }} bottom={830} />
      <Tex x={833} w={1087} h={964} />
      <FitBox name={more ? `What We’re Looking For (${more.j + 2})` : "What We’re Looking For"} x={933} w={887}>
        <div className="col" style={{ gap: 25 }}>
          {!more ? (
            <div className="trim" style={{ fontSize: 16, fontWeight: 400, lineHeight: "30px" }}>
              {paras.map((t, i) => <p key={i} style={{ marginBottom: 30 }}>{t}</p>)}
              <p>{W(p, "lookingListTitle")}</p>
            </div>
          ) : null}
          <div style={{ borderLeft: `2px solid ${acc(p)}`, padding: "10px 0 10px 25px" }}>
            <div className="trim" style={{ fontSize: 16, fontWeight: 400, lineHeight: 1.25, overflowWrap: "anywhere" }}>
              <Points items={list} gap={15} subGap={22} empty="Add the points in the form." />
              {outro.length ? <div style={{ marginTop: 18 }}>{outro.map((t, i) => <p key={i}>{t}</p>)}</div> : null}
            </div>
          </div>
        </div>
      </FitBox>
      <Footer />
    </PPage>
  );
}

// ---- 6. What's on offer ------------------------------------------------------------------
export function PackOffer({ p }) {
  const ben = cleanList(p.benefits);
  const subs = [p.salary, p.contract].map((x) => String(x || "").trim()).filter(Boolean);
  return (
    <PPage p={p} bg={INK}>
      <Photo src={p.photoOffer} pos={pos(p, "photoOffer")} w={940} h={964} />
      <Layer w={940} h={964} bg="rgba(0,0,0,0.6)" />
      <div className="abs col" style={{ left: 100, top: 100, width: 740, height: 764, padding: 50, borderRadius: 12, background: "rgba(0,0,0,0.5)", justifyContent: "center", overflow: "hidden" }}>
        {/* Measured by the form so the salary, contract and benefits can't run out of the box. */}
        <div data-fit="What’s on offer box" style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", overflow: "hidden" }}>
          <div data-fit-inner className="col" style={{ gap: 25, flex: "none" }}>
            <div className="col" style={{ gap: 30 }}>
              <Head text={W(p, "offer")} color="#fff" hi={acc(p)} style={{ fontSize: 48, lineHeight: "70px", letterSpacing: "-0.96px" }} />
              {(subs.length ? subs : ["Salary", "Contract"]).map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                  <Svg svg={TICK28(acc(p))} w={28} h={28} />
                  <div style={{ flex: 1, fontSize: 18, fontWeight: 400, lineHeight: 1.6, color: "#fff" }}>{t}</div>
                </div>
              ))}
              <div style={{ height: 1, background: "rgba(255,255,255,0.18)" }} />
            </div>
            {ben.length ? (
              <div className="col" style={{ gap: 10 }}>
                <div style={{ fontSize: 24, fontWeight: 500, lineHeight: "44px", letterSpacing: "-0.48px", color: acc(p) }}>{stripDot(W(p, "benefitsTitle")).replace(/\*/g, "")}</div>
                <ul style={{ listStyle: "disc", paddingLeft: 27, color: "#fff", fontSize: 18, fontWeight: 400, lineHeight: 1.6, columnCount: ben.length > 7 ? 2 : 1, columnGap: 30 }}>
                  {ben.map((b, i) => <li key={i} style={{ breakInside: "avoid" }}>{b}</li>)}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <Tex x={940} w={980} h={964} />
      <FitBox name="What’s on Offer" x={1040} w={780}>
        <div className="col" style={{ gap: 40 }}>
          <Head text={W(p, "whyTitle")} hi={acc(p)} style={{ fontSize: 48, lineHeight: 1, letterSpacing: "-0.48px" }} />
          <Paras text={p.why} gap={15} fallback="Why this role stands out." style={{ fontSize: 22, fontWeight: 400, lineHeight: "30px" }} />
        </div>
      </FitBox>
      <Footer />
    </PPage>
  );
}

// ---- 7. Next Steps ------------------------------------------------------------------------
export function PackNext({ p }) {
  const steps = [1, 2, 3].map((n) => [W(p, `step${n}t`), W(p, `step${n}x`)]);
  return (
    <PPage p={p} bg={OFF}>
      <Photo src={p.photoNext} pos={pos(p, "photoNext")} x={0} y={568} w={1920} h={512} />
      <Layer y={568} w={1920} h={512} bg="rgba(0,0,0,0.5)" />
      <Layer y={568} w={1920} h={512} bg="linear-gradient(0deg, rgba(0,0,0,0.55) 0%, rgba(102,102,102,0.55) 100%)" blend="multiply" />
      <Tex w={1920} h={568} />
      <div className="abs" style={{ left: 0, top: 0, width: 1920, height: 568, padding: 100, display: "flex", alignItems: "center", gap: 150 }}>
        <Head text={W(p, "nextTitle")} hi={acc(p)} style={{ fontSize: 100, lineHeight: 1.25, letterSpacing: "-1px", whiteSpace: "nowrap" }} />
        <div className="trim" style={{ flex: 1, fontSize: 22, fontWeight: 500, lineHeight: "30px" }}>
          <p>{W(p, "next1")}</p>
          <p style={{ marginTop: 30 }}>{W(p, "next2")}</p>
        </div>
      </div>
      <div className="abs" style={{ left: 96, top: 545, width: 1725, display: "flex", gap: 106, alignItems: "flex-start" }}>
        {steps.map(([t, x], i) => (
          <div key={i} className="col" style={{ flex: 1, gap: 32, color: "#fff" }}>
            <div style={{ width: 49, height: 49, borderRadius: 24.5, background: INK, border: `3px solid ${acc(p)}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="trim" style={{ fontSize: 20, fontWeight: 500, lineHeight: 1.6, letterSpacing: "2px" }}>{String(i + 1).padStart(2, "0")}</span>
            </div>
            <div className="trim" style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.4 }}>{stripDot(t)}</div>
            <div className="trim" style={{ fontSize: 20, fontWeight: 500, lineHeight: 1.6 }}>{x}</div>
          </div>
        ))}
      </div>
      <Footer />
    </PPage>
  );
}

// ---- 8. Contact ---------------------------------------------------------------------------
function Circle({ name, photo, size }) {
  const src = photo || headshotUrl(name);
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", background: "#cfcfcf", flex: "none" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img src={src} alt="" style={{ display: "block", width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%" }} /> : null}
    </div>
  );
}

function ContactLine({ icon, text, size = 30, font = 20 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
      <Svg svg={icon} w={size} h={size} />
      <span className="trim" style={{ fontSize: font, fontWeight: 500, lineHeight: 1.5, whiteSpace: "nowrap" }}>{text}</span>
    </div>
  );
}

// Two to five consultants: "Your Contacts." on the left, one row per person on the right
// (two columns once there are four or more).
function ContactTeam({ p, people, a }) {
  const n = people.length;
  const cols = n >= 4 ? 2 : 1;
  const size = n === 2 ? 197 : n === 3 ? 150 : 120;
  const nameSize = n === 2 ? 36 : n === 3 ? 32 : 26;
  const small = n >= 3;
  return (
    <div className="abs" style={{ left: 0, top: 0, width: 1920, height: 708, padding: "0 150px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 60 }}>
      <div className="col" style={{ width: n >= 4 ? 460 : 627, gap: 50, flex: "none" }}>
        <div className="trim" style={{ fontSize: 64, fontWeight: 500, lineHeight: 1.6 }}>{W(p, "contactTwo1")} <span style={{ color: a }}>{stripDot(W(p, "contactTwo2"))}.</span></div>
        <div className="trim" style={{ fontSize: 24, fontWeight: 500, lineHeight: 1.6 }}>{W(p, "contactText")}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: cols === 2 ? "1fr 1fr" : "1fr", columnGap: 40, rowGap: n === 2 ? 50 : n === 3 ? 34 : 30, alignItems: "center" }}>
        {people.map((c, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: small ? 28 : 48 }}>
            <Circle name={c.name} photo={c.photo} size={size} />
            <div className="col" style={{ width: cols === 2 ? 380 : 534, gap: small ? 14 : 23 }}>
              <div className="trim" style={{ fontSize: nameSize, fontWeight: 500, lineHeight: 1.6 }}>{c.name}</div>
              {c.title ? <div className="trim" style={{ fontSize: small ? 18 : 20, fontWeight: 500, lineHeight: 1.6 }}>{c.title}</div> : null}
              <div className="col" style={{ gap: small ? 8 : 10 }}>
                {c.phone ? <ContactLine icon={PHONE30(a)} text={c.phone} size={small ? 24 : 30} font={small ? 17 : 20} /> : null}
                {c.email ? <ContactLine icon={EMAIL30(a)} text={c.email} size={small ? 24 : 30} font={small ? 17 : 20} /> : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PackContact({ p }) {
  const people = packTeam(p);
  const a = acc(p);
  const one = people[0];
  return (
    <PPage p={p} bg={INK}>
      <Tex w={1920} h={708} />
      {people.length > 1 ? <ContactTeam p={p} people={people} a={a} /> : (
        <div className="abs" style={{ left: 0, top: 0, width: 1920, height: 708, padding: "0 150px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="col" style={{ width: 1077, gap: 50 }}>
            <div className="col" style={{ width: 1041, gap: 32 }}>
              <div className="trim" style={{ fontSize: 24, fontWeight: 500, lineHeight: 1.6 }}>{W(p, "contactOne")}</div>
              <div style={{ fontSize: 90, fontWeight: 500, lineHeight: 1, letterSpacing: "-0.9px" }}>{one.name}</div>
            </div>
            <div className="col" style={{ gap: 35 }}>
              {one.title ? <div className="trim" style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.6 }}>{one.title}</div> : null}
              <div style={{ display: "flex", gap: 56 }}>
                {one.phone ? <ContactLine icon={PHONE30(a)} text={one.phone} /> : null}
                {one.email ? <ContactLine icon={EMAIL30(a)} text={one.email} /> : null}
              </div>
            </div>
            <div className="trim" style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.6 }}>{W(p, "contactText")}</div>
          </div>
          <Circle name={one.name} photo={one.photo} size={376} />
        </div>
      )}
      <div className="abs" style={{ left: 0, top: 708, width: 1920, height: 256, background: INK, padding: "50px 100px", display: "flex", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 45, width: "100%", color: "#fff" }}>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="col" style={{ flex: 1, gap: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <Svg svg={STEP_ICONS[n - 1]} w={48} h={48} />
                <div className="trim" style={{ flex: 1, fontSize: 25, fontWeight: 500, lineHeight: 1.6 }}>{W(p, `proc${n}t`)}</div>
              </div>
              <div className="trim" style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.6 }}>{W(p, `proc${n}x`)}</div>
            </div>
          ))}
        </div>
      </div>
      <Footer border />
    </PPage>
  );
}

// ---- 9. End -------------------------------------------------------------------------------
export function PackEnd({ p }) {
  return (
    <PPage p={p} bg={dark(p)}>
      <Layer w={1920} h={1080} bg={`linear-gradient(180deg, ${INK} 25.185%, ${dark(p)} 100%)`} />
      <div className="abs" style={{ left: -475, top: -130, width: 1539, height: 1432, borderRadius: "50%", overflow: "hidden" }}>
        <Layer w={1539} h={1432} bg="rgba(0,0,0,0.3)" />
        <div className="abs" style={{ left: 0, top: 0, width: 1539, height: 1432, opacity: 0.1 }}>
          <Photo src={p.photoEnd} pos={pos(p, "photoEnd")} w={1539} h={1432} />
        </div>
      </div>
      <div className="abs" style={{ left: 155, top: 438, width: 658, height: 216, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {p.clientLogo ? <Logo p={p} maxW={658} maxH={216} white={!p.logoColour} align="center" />
          : <span style={{ fontSize: 64, fontWeight: 500, color: "#fff", textAlign: "center" }}>{p.clientName}</span>}
      </div>
      <Mid cy={540.5} left={1161} width={663} style={{ gap: 25, color: "#fff" }}>
        <div style={{ fontSize: 75, fontWeight: 500, lineHeight: "normal", letterSpacing: "-0.75px" }}>{W(p, "end1")}<br />{stripDot(W(p, "end2"))}.</div>
        <div style={{ fontSize: 25, fontWeight: 400, lineHeight: "normal", letterSpacing: "-1.25px" }}>{W(p, "endText")}</div>
        <VisitClient p={p} />
      </Mid>
      <Footer />
    </PPage>
  );
}

// ---- Added page built from scratch (or from an uploaded document) ------------------------
export function PackCustom({ p, ep }) {
  const isDark = !!(ep && ep.bg === "dark");
  return (
    <PPage p={p} bg={isDark ? INK : OFF}>
      <Tex kind={isDark ? "dark" : "light"} />
      <div className="abs" style={{ left: 100, top: 100, width: 1720 }}>
        <Head text={(p.pageText && p.pageText.customHeading) || "New page"} color={isDark ? "#fff" : INK} hi={acc(p)} style={{ fontSize: 60, lineHeight: 1.1, letterSpacing: "-0.6px" }} />
      </div>
      <Blocks blocks={(ep && ep.blocks) || []} dark={isDark} acc={acc(p)} />
      <Footer />
    </PPage>
  );
}

// ---- The full pack: [{key, label, el}] in page order -----------------------------------------
const PACK_COMPONENTS = { title: PackTitle, about: PackAbout, opportunity: PackOpportunity, role: PackRole, key: PackKey, looking: PackLooking, offer: PackOffer, next: PackNext, contact: PackContact, end: PackEnd };

export function packPages(p) {
  return packPlan(p).map((x) => {
    if (x.more) {
      const C = PACK_COMPONENTS[x.more.kind];
      const m = ((x.more.kind === "key" ? p.keyMore : p.lookingMore) || [])[x.more.j] || {};
      return { key: x.key, label: x.label, more: true, el: <C p={p} more={{ ...m, j: x.more.j }} /> };
    }
    if (x.extra) {
      const q = packExtraProps(p, x.extra);
      if (x.extra.style === "custom") return { key: x.key, label: x.label, extra: true, el: <PackCustom p={q} ep={x.extra} /> };
      const C = PACK_COMPONENTS[x.extra.style];
      return { key: x.key, label: x.label, extra: true, el: <WithBlocks el={<C p={q} />} blocks={x.extra.blocks} dark={x.extra.bg === "dark"} acc={acc(q)} /> };
    }
    const C = PACK_COMPONENTS[x.key];
    return { key: x.key, label: x.label, el: <C p={p} /> };
  });
}

// Kept for anything that still imports the old helpers.
export { Img };

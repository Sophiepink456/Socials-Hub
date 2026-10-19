// The "Promotional Targets" slides, each 1920 x 1080, laid out from the Figma
// (kDhpXG7nl3DIZzouYO572Q). Uses the proposal page styles (.pp, Area font) and header.
// Text that runs long shrinks to fit its panel rather than spilling off the slide.
import { Fit, px } from "./Fit";
import { Header } from "../proposal/pages";
import { normaliseTargets } from "./targets";

const GREEN = "#93bf20";
const INK = "#161616";
const OFF = "#ebebeb";
const A = "/slt/targets/";
const Img = ({ src, style }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={src} alt="" className="abs" style={{ display: "block", ...style }} />
);
const Dot = ({ children }) => <>{children}<span className="g">.</span></>;
const stripDot = (s) => String(s || "").trim().replace(/\.+$/, "");

function Footer({ period, color = INK, top = 975 }) {
  return (
    <div className="abs" style={{ left: 0, top, width: 1920, height: 1080 - top, borderTop: "1px solid #939393", display: "flex", alignItems: "center", padding: "0 100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
        <Img src={A + "calendar.svg"} style={{ position: "static", width: 35, height: 35 }} />
        <span className="trim" style={{ fontWeight: 700, fontSize: 20, lineHeight: 1.6, color, whiteSpace: "nowrap" }}>{period}</span>
      </div>
    </div>
  );
}

// A photo panel with the template's dark wash.
function Shaded({ x, w, src, imgStyle, children }) {
  return (
    <div className="abs" style={{ left: x, top: 100, width: w, height: 980, overflow: "hidden" }}>
      <Img src={src} style={imgStyle || { left: 0, top: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      <div className="abs full" style={{ background: "rgba(0,0,0,0.55)" }} />
      <div className="abs full" style={{ background: "linear-gradient(to bottom, rgba(102,102,102,0), rgba(0,0,0,0.55))", mixBlendMode: "multiply" }} />
      {children}
    </div>
  );
}

// ---- 1. Title ----------------------------------------------------------------------
export function TitleSlide({ d }) {
  const line = [d.person, d.duration].map((x) => String(x || "").trim()).filter(Boolean).join(" | ");
  return (
    <div className="pp" style={{ background: INK }}>
      <Img src={A + "title-bg.jpg"} style={{ left: 0, top: 0, width: 1920, height: 1080, objectFit: "cover" }} />
      <div className="abs full" style={{ background: "rgba(0,0,0,0.75)" }} />
      <div className="abs full" style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.75), rgba(22,22,22,0.75))", mixBlendMode: "multiply" }} />
      <Img src={A + "dots-white.svg"} style={{ left: -230, top: 358, width: 360, height: 364 }} />
      <Img src={A + "dots-white.svg"} style={{ left: 1789, top: 358, width: 360, height: 364 }} />
      {/* The full colour logo, built from its four parts as in the Figma. */}
      <div className="abs" style={{ left: 660, top: 469, width: 599.682, height: 142.618, overflow: "hidden" }}>
        <Img src={A + "logo-union.svg"} style={{ left: 329.89, top: 110.19, width: 269.79, height: 26.86 }} />
        <Img src={A + "logo-vector.svg"} style={{ left: 408.56, top: 107.52, width: 4.14, height: 4.21 }} />
        <Img src={A + "logo-group.svg"} style={{ left: 162.93, top: 13.83, width: 435.62, height: 84.89 }} />
        <Img src={A + "logo-group1.svg"} style={{ left: 0, top: 0, width: 142.0, height: 142.6 }} />
      </div>
      <div className="abs col" style={{ left: 391, top: 683, width: 1138, gap: 39, alignItems: "center", textAlign: "center" }}>
        <div className="col" style={{ gap: 15, alignItems: "center", width: "100%" }}>
          <p style={{ fontWeight: 900, fontSize: 85, lineHeight: 1, letterSpacing: -0.85, color: "#fff", whiteSpace: "nowrap" }}><Dot>{stripDot(d.title)}</Dot></p>
          <p className="poppins" style={{ fontWeight: 500, fontSize: 32, letterSpacing: -1.6, color: GREEN, height: 47, lineHeight: "normal" }}>{d.role}</p>
        </div>
        <p className="poppins" style={{ fontWeight: 400, fontSize: 24, letterSpacing: -1.2, color: "#fff", height: 47, lineHeight: "normal", width: "100%" }}>{line}</p>
      </div>
      <Footer period={d.period} color="#fff" />
      <Header pill="Slide Deck" />
    </div>
  );
}

// A green-ruled point (The Process slides).
const Ruled = ({ text, size, color }) => (
  <div style={{ borderLeft: `1px solid ${GREEN}`, padding: `${px(10)} 0`, width: "100%" }}>
    <p className="trim pre" style={{ paddingLeft: 25, fontWeight: 500, fontSize: px(size), lineHeight: 1.6, color }}>{text}</p>
  </div>
);

// ---- 2. The Process: objective and review ------------------------------------------
export function ProcessSlide({ d }) {
  return (
    <div className="pp" style={{ background: "#fff" }}>
      <Fit className="abs col" margin={[30, 125]}
        style={{ left: 0, top: 100, width: 1235, height: 980, background: OFF, justifyContent: "center", gap: px(56), padding: "100px 250px 200px 100px" }}>
        <p style={{ fontWeight: 900, fontSize: px(75), lineHeight: 1, letterSpacing: -0.75, color: INK }}><Dot>The Process</Dot></p>
        <div className="col" style={{ gap: px(30), width: "100%" }}>
          <p className="trim" style={{ fontWeight: 900, fontSize: px(20), lineHeight: "30px", color: INK }}>Objective:</p>
          <p className="trim pre" style={{ fontWeight: 500, fontSize: px(22), lineHeight: px(30), color: INK }}>{d.objective}</p>
        </div>
        {String(d.review || "").trim() ? (
          <div className="col" style={{ gap: px(30), width: "100%" }}>
            <p className="trim" style={{ fontWeight: 900, fontSize: px(20), lineHeight: "30px", color: INK }}>Review Process:</p>
            <Ruled text={d.review} size={22} color={INK} />
          </div>
        ) : null}
      </Fit>
      <div className="abs" style={{ left: 1235, top: 0, width: 685, height: 1080, background: INK }} />
      <Img src={A + "process-photo.jpg"} style={{ left: 1042, top: 148, width: 675, height: 732, objectFit: "cover", borderRadius: 10 }} />
      <Img src={A + "dots-white.svg"} style={{ left: 1781, top: 358, width: 360, height: 364 }} />
      <Footer period={d.period} />
      <Header pill="Slide Deck" />
    </div>
  );
}

// ---- 3. The Process: what's expected -----------------------------------------------
export function ExpectSlide({ d }) {
  return (
    <div className="pp" style={{ background: "#fff" }}>
      <div className="abs" style={{ left: 0, top: 100, width: 820, height: 980, background: OFF }} />
      <Fit className="abs col" margin={[30, 136]}
        style={{ left: 820, top: 100, width: 1100, height: 980, background: INK, gap: px(39), padding: "100px 100px 150px 175px" }}>
        <p style={{ fontWeight: 900, fontSize: px(75), lineHeight: 1, letterSpacing: -0.75, color: "#fff" }}><Dot>The Process</Dot></p>
        <p className="trim" style={{ fontWeight: 900, fontSize: px(20), lineHeight: "30px", color: "#fff" }}>{d.expectHeading}</p>
        <div className="col" style={{ gap: px(20), width: "100%" }}>
          {d.expectations.filter((x) => String(x).trim()).map((t, i) => <Ruled key={i} text={t} size={16} color="#fff" />)}
        </div>
      </Fit>
      <Img src={A + "expect-photo.jpg"} style={{ left: 203, top: 148, width: 705, height: 742, objectFit: "cover", borderRadius: 10 }} />
      <Img src={A + "dots-b.svg"} style={{ left: -223, top: 358, width: 360, height: 364 }} />
      <Footer period={d.period} top={964} />
      <Header pill="Slide Deck" />
    </div>
  );
}

// ---- 4+. Key skills: two slides per section ----------------------------------------
// Photos in the Figma's order; extra sections reuse them.
const SECTION_ART = [
  { p1: { src: "oper1-photo.jpg", img: { left: "-44.34%", top: "-12.86%", width: "212.94%", height: "112.86%" } }, groupTop: 441, p2: "oper2-photo.jpg" },
  { p1: { src: "behav1-photo.jpg", img: { left: 0, top: "-19.2%", width: "100%", height: "119.22%" } }, groupTop: 416, p2: "behav2-photo.jpg" },
];
const STYLE = {
  compact: { h: 30, lh: 1.45, gap: 35, pill: "#fff" },
  roomy: { h: 35, lh: 1.6, gap: 50, pill: GREEN },
};

function Point({ it, st, color }) {
  return (
    <div className="col" style={{ borderLeft: `2px solid ${GREEN}`, paddingLeft: 25, width: "100%", gap: px(24), color }}>
      <p className="trim" style={{ fontWeight: 900, fontSize: px(st.h), lineHeight: 1.4 }}>{String(it.h || "").trim() ? <Dot>{stripDot(it.h)}</Dot> : null}</p>
      {String(it.t || "").trim() ? <p className="trim pre" style={{ fontWeight: 400, fontSize: px(18), lineHeight: st.lh }}>{String(it.t).trim()}</p> : null}
    </div>
  );
}

const Pill = ({ label, border, color }) => (
  <div style={{ border: `2px solid ${border}`, borderRadius: 100, padding: `${px(15)} 25px`, flex: "none", alignSelf: "flex-start" }}>
    <p className="trim" style={{ fontWeight: 400, fontSize: px(18), lineHeight: 1.6, color, whiteSpace: "nowrap" }}>{label}</p>
  </div>
);

export function SkillsSlide({ d, si, idx, page, of }) {
  const sec = d.sections[si];
  const st = STYLE[sec.style] || STYLE.roomy;
  const art = SECTION_ART[si % SECTION_ART.length];
  const items = sec.pages[idx].filter((it) => String(it.h).trim() || String(it.t).trim());
  const label = of > 1 ? `Page ${page + 1}/${of}` : null;
  if (page === 0) {
    const roomy = sec.style !== "compact";
    return (
      <div className="pp" style={{ background: INK }}>
        <Shaded x={0} w={779} src={A + art.p1.src} imgStyle={{ ...art.p1.img, maxWidth: "none" }}>
          <div className="abs" style={{ left: roomy ? -191 : -194, top: art.groupTop, width: 952, display: "flex", alignItems: "center", gap: 44 }}>
            <Img src={A + "dots-white.svg"} style={{ position: "static", width: 360, height: 364, flex: "none" }} />
            <div className="col" style={{ gap: 30, width: 548 }}>
              <p style={{ fontWeight: 900, fontSize: 75, lineHeight: 1.25, letterSpacing: -0.75, color: "#fff", width: 483 }}><Dot>{stripDot(d.skillsTitle)}</Dot></p>
              <p className="trim" style={{ fontWeight: 700, fontSize: 32, lineHeight: 1.6, color: GREEN }}>{sec.name}</p>
            </div>
          </div>
        </Shaded>
        <Fit className="abs col" margin={[30, 125]} style={{ left: 779, top: 100, width: 1141, height: 980, background: INK, justifyContent: "center", gap: px(st.gap), padding: "100px 100px 200px" }}>
          {label ? <Pill label={label} border="#fff" color={st.pill} /> : null}
          {items.map((it, i) => <Point key={i} it={it} st={st} color="#fff" />)}
        </Fit>
        <Footer period={d.period} color="#fff" />
        <Header pill="Slide Deck" />
      </div>
    );
  }
  const w = sec.style === "compact" ? 1199 : 1141;
  return (
    <div className="pp" style={{ background: "#fff" }}>
      <Fit className="abs col" margin={[30, 125]} style={{ left: 0, top: 100, width: w, height: 980, background: OFF, justifyContent: "center", gap: px(st.gap), padding: sec.style === "compact" ? "100px 100px 175px" : "100px 100px 200px" }}>
        {label ? <Pill label={label} border={INK} color={INK} /> : null}
        {items.map((it, i) => <Point key={i} it={it} st={st} color={INK} />)}
      </Fit>
      <Shaded x={w} w={1920 - w} src={A + art.p2} />
      <Footer period={d.period} />
      <Header pill="Slide Deck" />
    </div>
  );
}

// Every slide in order, as {key, el}.
export function targetsSlides(input) {
  const d = normaliseTargets(input);
  const out = [
    { key: "title", label: "Title", el: <TitleSlide d={d} /> },
    { key: "process", label: "The Process", el: <ProcessSlide d={d} /> },
    { key: "expect", label: "Expectations", el: <ExpectSlide d={d} /> },
  ];
  d.sections.forEach((sec, si) => {
    const pages = sec.pages.map((pg, i) => ({ pg, i })).filter(({ pg }) => pg.some((it) => String(it.h).trim() || String(it.t).trim()));
    pages.forEach(({ i }, n) => {
      // Page 1 always uses the photo-and-title layout; any second page the light one.
      out.push({ key: `s${si}p${i}`, label: `${sec.name || "Key skills"} ${n + 1}`, el: <SkillsSlide d={d} si={si} idx={i} page={n === 0 ? 0 : 1} of={pages.length} /> });
    });
  });
  return out;
}

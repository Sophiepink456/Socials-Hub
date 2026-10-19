// The "Promotional Targets" slides, each 1920 x 1080, laid out from the Figma
// (kDhpXG7nl3DIZzouYO572Q). Uses the proposal page styles (.pp, Area font) and header.
// Text that runs long shrinks to fit its panel rather than spilling off the slide.
import { Fit, px } from "./Fit";
import { Header } from "../proposal/pages";
import { normaliseTargets, designById, photoUrl } from "./targets";

const GREEN = "#93bf20";
const INK = "#161616";
const OFF = "#ebebeb";
const A = "/slt/targets/";
const Img = ({ src, style }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={src} alt="" className="abs" style={{ display: "block", ...style }} />
);
const Dot = ({ children }) => <>{children}<span className="g">.</span></>;
const has = (s) => String(s || "").trim() !== "";
const photo = (p) => photoUrl(p.photo);
// Which part of the photo shows (dragged in the editor); centred unless moved.
const at = (p) => (p.pos ? `${p.pos.x}% ${p.pos.y}%` : "50% 50%");
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
function Shaded({ x, w, src, imgStyle, at = "50% 50%", children }) {
  return (
    <div className="abs" style={{ left: x, top: 100, width: w, height: 980, overflow: "hidden" }}>
      <Img src={src} style={imgStyle || { left: 0, top: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: at }} />
      <div className="abs full" style={{ background: "rgba(0,0,0,0.55)" }} />
      <div className="abs full" style={{ background: "linear-gradient(to bottom, rgba(102,102,102,0), rgba(0,0,0,0.55))", mixBlendMode: "multiply" }} />
      {children}
    </div>
  );
}

// ---- Title slide -------------------------------------------------------------------
function CoverSlide({ p, d }) {
  return (
    <div className="pp" style={{ background: INK }}>
      <Img src={photo(p)} style={{ left: 0, top: 0, width: 1920, height: 1080, objectFit: "cover", objectPosition: at(p) }} />
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
      <Fit className="abs col" margin={[0, 0]} style={{ left: 291, top: 683, width: 1338, height: 280, gap: px(39), alignItems: "center", textAlign: "center" }}>
        <div className="col" style={{ gap: px(15), alignItems: "center", width: "100%" }}>
          {has(p.title) ? <p className="pre" style={{ fontWeight: 900, fontSize: px(85), lineHeight: 1, letterSpacing: -0.85, color: "#fff" }}><Dot>{stripDot(p.title)}</Dot></p> : null}
          {has(p.subtitle) ? <p className="poppins pre" style={{ fontWeight: 500, fontSize: px(32), letterSpacing: -1.6, color: GREEN, minHeight: px(47), lineHeight: "normal" }}>{p.subtitle}</p> : null}
        </div>
        {has(p.body) ? <p className="poppins pre" style={{ fontWeight: 400, fontSize: px(24), letterSpacing: -1.2, color: "#fff", minHeight: px(47), lineHeight: "normal", width: "100%" }}>{p.body}</p> : null}
      </Fit>
      <Footer period={d.period} color="#fff" />
      <Header pill="Slide Deck" />
    </div>
  );
}

// A green-ruled point (the two "Process" designs), with an optional bold label or heading.
const Ruled = ({ text, size, color }) => (
  <div style={{ borderLeft: `1px solid ${GREEN}`, padding: `${px(10)} 0`, width: "100%" }}>
    <p className="trim pre" style={{ paddingLeft: 25, fontWeight: 500, fontSize: px(size), lineHeight: 1.6, color }}>{text}</p>
  </div>
);
const Label = ({ children, color }) => <p className="trim pre" style={{ fontWeight: 900, fontSize: px(20), lineHeight: "30px", color }}>{children}</p>;
const Title = ({ text, color }) => <p className="pre" style={{ fontWeight: 900, fontSize: px(75), lineHeight: 1, letterSpacing: -0.75, color }}><Dot>{stripDot(text)}</Dot></p>;

// ---- Light panel, photo on the right (The Process: objective and review) ------------
function ProcessSlide({ p, d }) {
  return (
    <div className="pp" style={{ background: "#fff" }}>
      <Fit className="abs col" margin={[30, 125]}
        style={{ left: 0, top: 100, width: 1235, height: 980, background: OFF, justifyContent: "center", gap: px(56), padding: "100px 250px 200px 100px" }}>
        {has(p.title) ? <Title text={p.title} color={INK} /> : null}
        {has(p.subtitle) || has(p.body) ? (
          <div className="col" style={{ gap: px(30), width: "100%" }}>
            {has(p.subtitle) ? <Label color={INK}>{p.subtitle}</Label> : null}
            {has(p.body) ? <p className="trim pre" style={{ fontWeight: 500, fontSize: px(22), lineHeight: px(30), color: INK }}>{p.body}</p> : null}
          </div>
        ) : null}
        {p.points.filter((it) => has(it.h) || has(it.t)).map((it, i) => (
          <div key={i} className="col" style={{ gap: px(30), width: "100%" }}>
            {has(it.h) ? <Label color={INK}>{it.h}</Label> : null}
            {has(it.t) ? <Ruled text={it.t} size={22} color={INK} /> : null}
          </div>
        ))}
      </Fit>
      <div className="abs" style={{ left: 1235, top: 0, width: 685, height: 1080, background: INK }} />
      <Img src={photo(p)} style={{ left: 1042, top: 148, width: 675, height: 732, objectFit: "cover", objectPosition: at(p), borderRadius: 10 }} />
      <Img src={A + "dots-white.svg"} style={{ left: 1781, top: 358, width: 360, height: 364 }} />
      <Footer period={d.period} />
      <Header pill="Slide Deck" />
    </div>
  );
}

// ---- Photo on the left, dark panel (The Process: what's expected) -------------------
function ExpectSlide({ p, d }) {
  return (
    <div className="pp" style={{ background: "#fff" }}>
      <div className="abs" style={{ left: 0, top: 100, width: 820, height: 980, background: OFF }} />
      <Fit className="abs col" margin={[30, 136]}
        style={{ left: 820, top: 100, width: 1100, height: 980, background: INK, gap: px(39), padding: "100px 100px 150px 175px" }}>
        {has(p.title) ? <Title text={p.title} color="#fff" /> : null}
        {has(p.subtitle) ? <Label color="#fff">{p.subtitle}</Label> : null}
        {has(p.body) ? <p className="trim pre" style={{ fontWeight: 500, fontSize: px(18), lineHeight: 1.6, color: "#fff" }}>{p.body}</p> : null}
        <div className="col" style={{ gap: px(20), width: "100%" }}>
          {p.points.filter((it) => has(it.h) || has(it.t)).map((it, i) => (
            <div key={i} style={{ borderLeft: `1px solid ${GREEN}`, padding: `${px(10)} 0 ${px(10)} 25px`, width: "100%", display: "flex", flexDirection: "column", gap: px(14) }}>
              {has(it.h) ? <p className="trim pre" style={{ fontWeight: 900, fontSize: px(18), lineHeight: 1.4, color: "#fff" }}>{it.h}</p> : null}
              {has(it.t) ? <p className="trim pre" style={{ fontWeight: 500, fontSize: px(16), lineHeight: 1.6, color: "#fff" }}>{it.t}</p> : null}
            </div>
          ))}
        </div>
      </Fit>
      <Img src={photo(p)} style={{ left: 203, top: 148, width: 705, height: 742, objectFit: "cover", objectPosition: at(p), borderRadius: 10 }} />
      <Img src={A + "dots-b.svg"} style={{ left: -223, top: 358, width: 360, height: 364 }} />
      <Footer period={d.period} top={964} />
      <Header pill="Slide Deck" />
    </div>
  );
}

// ---- Key skills designs ------------------------------------------------------------
// How the two Figma photos are framed on the "heading on a photo" design; others fill the panel.
const CROPS = {
  "oper1-photo": { left: "-44.34%", top: "-12.86%", width: "212.94%", height: "112.86%", maxWidth: "none" },
  "behav1-photo": { left: 0, top: "-19.2%", width: "100%", height: "119.22%", maxWidth: "none" },
};
const STYLE = {
  compact: { h: 30, lh: 1.45, gap: 35, pill: "#fff" },
  roomy: { h: 35, lh: 1.6, gap: 50, pill: GREEN },
};

function Point({ it, st, color }) {
  return (
    <div className="col" style={{ borderLeft: `2px solid ${GREEN}`, paddingLeft: 25, width: "100%", gap: px(24), color }}>
      {has(it.h) ? <p className="trim pre" style={{ fontWeight: 900, fontSize: px(st.h), lineHeight: 1.4 }}><Dot>{stripDot(it.h)}</Dot></p> : null}
      {has(it.t) ? <p className="trim pre" style={{ fontWeight: 400, fontSize: px(18), lineHeight: st.lh }}>{String(it.t).trim()}</p> : null}
    </div>
  );
}

const Pill = ({ label, border, color }) => (
  <div style={{ border: `2px solid ${border}`, borderRadius: 100, padding: `${px(15)} 25px`, flex: "none", alignSelf: "flex-start" }}>
    <p className="trim" style={{ fontWeight: 400, fontSize: px(18), lineHeight: 1.6, color, whiteSpace: "nowrap" }}>{label}</p>
  </div>
);

// Heading on a photo (left), points on dark (right).
function Skills1Slide({ p, d }) {
  const st = STYLE[p.size] || STYLE.roomy;
  const roomy = p.size !== "compact";
  return (
    <div className="pp" style={{ background: INK }}>
      <Shaded x={0} w={779} src={photo(p)} imgStyle={p.pos ? null : CROPS[p.photo]} at={at(p)}>
        <div className="abs" style={{ left: roomy ? -191 : -194, top: roomy ? 416 : 441, width: 952, display: "flex", alignItems: "center", gap: 44 }}>
          <Img src={A + "dots-white.svg"} style={{ position: "static", width: 360, height: 364, flex: "none" }} />
          <Fit className="col" margin={[0, 0]} style={{ position: "relative", gap: px(30), width: 548, maxHeight: 560, justifyContent: "center" }}>
            {has(p.title) ? <p className="pre" style={{ fontWeight: 900, fontSize: px(75), lineHeight: 1.25, letterSpacing: -0.75, color: "#fff", width: 483 }}><Dot>{stripDot(p.title)}</Dot></p> : null}
            {has(p.subtitle) ? <p className="trim pre" style={{ fontWeight: 700, fontSize: px(32), lineHeight: 1.6, color: GREEN }}>{p.subtitle}</p> : null}
          </Fit>
        </div>
      </Shaded>
      <Fit className="abs col" margin={[30, 125]} style={{ left: 779, top: 100, width: 1141, height: 980, background: INK, justifyContent: "center", gap: px(st.gap), padding: "100px 100px 200px" }}>
        {has(p.pill) ? <Pill label={p.pill} border="#fff" color={st.pill} /> : null}
        {has(p.body) ? <p className="trim pre" style={{ fontWeight: 400, fontSize: px(18), lineHeight: st.lh, color: "#fff" }}>{p.body}</p> : null}
        {p.points.filter((it) => has(it.h) || has(it.t)).map((it, i) => <Point key={i} it={it} st={st} color="#fff" />)}
      </Fit>
      <Footer period={d.period} color="#fff" />
      <Header pill="Slide Deck" />
    </div>
  );
}

// Points on light (left), photo (right).
function Skills2Slide({ p, d }) {
  const st = STYLE[p.size] || STYLE.roomy;
  const w = p.size === "compact" ? 1199 : 1141;
  return (
    <div className="pp" style={{ background: "#fff" }}>
      <Fit className="abs col" margin={[30, 125]} style={{ left: 0, top: 100, width: w, height: 980, background: OFF, justifyContent: "center", gap: px(st.gap), padding: p.size === "compact" ? "100px 100px 175px" : "100px 100px 200px" }}>
        {has(p.pill) ? <Pill label={p.pill} border={INK} color={INK} /> : null}
        {has(p.title) ? <Title text={p.title} color={INK} /> : null}
        {has(p.body) ? <p className="trim pre" style={{ fontWeight: 400, fontSize: px(18), lineHeight: st.lh, color: INK }}>{p.body}</p> : null}
        {p.points.filter((it) => has(it.h) || has(it.t)).map((it, i) => <Point key={i} it={it} st={st} color={INK} />)}
      </Fit>
      <Shaded x={w} w={1920 - w} src={photo(p)} at={at(p)} />
      <Footer period={d.period} />
      <Header pill="Slide Deck" />
    </div>
  );
}

const RENDER = { cover: CoverSlide, process: ProcessSlide, expect: ExpectSlide, skills1: Skills1Slide, skills2: Skills2Slide };

// Every page in order, as {key, label, el}.
export function targetsSlides(input) {
  const d = normaliseTargets(input);
  return d.pages.map((p, i) => {
    const S = RENDER[p.design] || ProcessSlide;
    const name = [p.title, p.subtitle].filter(has).map((s) => String(s).replace(/\n/g, " ")).join(" – ") || (has(p.pill) ? p.pill : designById(p.design).name);
    return { key: `p${i}`, label: name, el: <S p={p} d={d} /> };
  });
}

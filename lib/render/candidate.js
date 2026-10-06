// Candidate Ad – 1 Page (Figma 1:1790) and Candidate Ad + About (1:1880 cover,
// 1:1847 green "About the Candidate" page).
import { GREEN } from "../brand";
import { FULL, INFO_ICON, Dotted, Dots, ContactRow, arrow, lines } from "./job-slides";

const INK = "#161616";

// ---- Cover: washed-out photo, dark title -----------------------------------
export function CandidateCover({ v, photo, overlay, slides }) {
  const title = String(v.title || "Candidate Job Title");
  const size = title.length > 40 ? 76 : title.length > 28 ? 88 : 100;
  const details = String(v.details || "").trim();
  return (
    <div style={{ ...FULL, display: "flex", fontFamily: "Area", background: "#ffffff" }}>
      {photo ? <img src={photo} width={1080} height={1350} style={{ ...FULL, objectFit: "cover" }} /> : null}
      <img src={overlay} width={1080} height={1350} style={FULL} />

      {/* "Brand New Candidate" pill */}
      <div style={{ position: "absolute", left: 98, top: 100, height: 75, display: "flex", alignItems: "center",
        padding: "0 24px", borderRadius: 40, background: GREEN, border: `2px solid ${GREEN}` }}>
        <span style={{ color: "#ffffff", fontSize: 36, fontWeight: 700, letterSpacing: "-1.8px" }}>Brand New Candidate</span>
      </div>

      <div style={{ position: "absolute", left: 100, bottom: 350, width: 880, display: "flex", flexDirection: "column" }}>
        <Dotted text={title} size={size} weight={900} lh={1.2} color={INK} />
        {details ? (
          <div style={{ display: "flex", alignItems: "flex-start", marginTop: 50 }}>
            <img src={INFO_ICON} width={40} height={40} style={{ marginRight: 20, marginTop: 5.5 }} />
            <div style={{ display: "flex", flex: 1, color: INK, fontSize: 35, fontWeight: 700, lineHeight: 1.25 }}>{details}</div>
          </div>
        ) : null}
      </div>

      {slides > 1 ? (
        <Dots count={slides} active={0} cy={1212} off={INK}
          extra={
            <div style={{ display: "flex", alignItems: "center", marginLeft: 20 }}>
              <span style={{ color: INK, fontSize: 30, fontWeight: 500, letterSpacing: "-1.5px" }}>Explore</span>
              <img src={arrow(INK)} width={22} height={23} style={{ marginLeft: 9 }} />
            </div>
          } />
      ) : null}
    </div>
  );
}

// ---- Green page: About the Candidate + consultant ---------------------------
export function AboutCandidate({ v, bg, headshot, index, slides }) {
  const items = lines(v.about).slice(0, 6);
  const chars = items.join("").length;
  const tight = items.length >= 6 || chars > 220;
  const gap = tight ? 24 : 35;
  return (
    <div style={{ ...FULL, display: "flex", fontFamily: "Area", background: GREEN }}>
      <img src={bg} width={1080} height={1350} style={FULL} />
      <div style={{ position: "absolute", left: 100, top: 157, width: 880, display: "flex", flexDirection: "column" }}>
        <Dotted text="About the Candidate" size={75} />
        {items.map((t, i) => (
          <div key={i} style={{ display: "flex", marginTop: gap, borderLeft: "1px solid #ffffff", paddingLeft: 45, paddingTop: 10, paddingBottom: 10 }}>
            <div style={{ display: "flex", flex: 1, color: "#ffffff", fontSize: tight ? 30 : i === 0 ? 35 : 32, fontWeight: 700, lineHeight: 1.2 }}>{t}</div>
          </div>
        ))}
      </div>
      <ContactRow name={v.consultant} phone={v.phone} headshot={headshot} top={921} lineOpacity={0.55} />
      <Dots count={slides} active={index} />
    </div>
  );
}

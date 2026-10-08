// Live Roles Post (Figma 1:1948), Statement Graphic (2:523 / 2:510 / 2:536)
// and Testimonial (5:1510 / 5:1551 / 5:1592).
import { GREEN } from "../brand";
import { highlights } from "../text";
import { FULL, lines } from "./job-slides";

const svgUri = (s) => "data:image/svg+xml;utf8," + encodeURIComponent(s);

export const MOUSE = svgUri(`<svg width="30" height="31" viewBox="0 0 30 31" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 2.5C8.272 2.5 2 8.772 2 16.5C2 24.228 8.272 30.5 16 30.5C23.728 30.5 30 24.228 30 16.5C30 8.772 23.728 2.5 16 2.5ZM21.81 17.662L19.388 18.474C18.716 18.698 18.198 19.216 17.974 19.888L17.162 22.31C16.476 24.396 13.536 24.354 12.892 22.268L10.162 13.476C9.63 11.726 11.24 10.116 12.962 10.648L21.768 13.378C23.854 14.036 23.882 16.976 21.81 17.662Z" fill="${GREEN}"/></svg>`);

const STARS = svgUri(`<svg width="235" height="32" viewBox="0 0 235 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.5 0L20.0982 10.4818L31 11.8409L22.94 19.6782L25.0795 31L15.5 25.3618L5.92047 31L8.06 19.6782L0 11.8409L10.9018 10.4818L15.5 0Z" fill="#FBBC05"/><path d="M66 0L70.4498 10.4818L81 11.8409L73.2 19.6782L75.2705 31L66 25.3618L56.7295 31L58.8 19.6782L51 11.8409L61.5502 10.4818L66 0Z" fill="#FBBC05"/><path d="M117 0L121.747 10.82L133 12.2229L124.68 20.313L126.889 32L117 26.18L107.111 32L109.32 20.313L101 12.2229L112.253 10.82L117 0Z" fill="#FBBC05"/><path d="M168.5 0L173.098 10.4818L184 11.8409L175.94 19.6782L178.08 31L168.5 25.3618L158.92 31L161.06 19.6782L153 11.8409L163.902 10.4818L168.5 0Z" fill="#FBBC05"/><path d="M219.5 0L224.098 10.4818L235 11.8409L226.94 19.6782L229.08 31L219.5 25.3618L209.92 31L212.06 19.6782L204 11.8409L214.902 10.4818L219.5 0Z" fill="#FBBC05"/></svg>`);

const quoteMark = (c) => svgUri(`<svg width="74" height="55" viewBox="0 0 74 55" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M74 7.41134L62.186 24.4444C65.2152 25.1379 67.855 26.8282 70.1053 29.5154C72.3556 32.2025 73.4807 35.4098 73.4807 39.1371C73.4807 43.6446 71.9661 47.4153 68.9368 50.4492C65.9942 53.4831 62.1427 55 57.3825 55C52.7088 55 48.8573 53.4831 45.8281 50.4492C42.7988 47.4153 41.2842 43.6446 41.2842 39.1371C41.2842 36.71 41.717 34.2829 42.5825 31.8558C43.448 29.342 45.2655 26.0047 48.0351 21.844L62.8351 0C62.8351 0 66.5567 2.47045 74 7.41134ZM32.7158 7.41134L20.9018 24.4444C23.931 25.1379 26.5708 26.8282 28.8211 29.5154C31.0713 32.2025 32.1965 35.4098 32.1965 39.1371C32.1965 43.6446 30.6819 47.4153 27.6526 50.4492C24.7099 53.4831 20.8585 55 16.0982 55C11.4246 55 7.5731 53.4831 4.54386 50.4492C1.51462 47.4153 0 43.6446 0 39.1371C0 36.71 0.432749 34.2829 1.29825 31.8558C2.16374 29.342 3.98129 26.0047 6.75088 21.844L21.6807 0C21.6807 0 25.3591 2.47045 32.7158 7.41134Z" fill="${c}"/></svg>`);
const closeQuoteMark = (c) => svgUri(`<svg width="74" height="55" viewBox="0 0 74 55" fill="none" xmlns="http://www.w3.org/2000/svg"><g transform="rotate(180 37 27.5)"><path d="M74 7.41134L62.186 24.4444C65.2152 25.1379 67.855 26.8282 70.1053 29.5154C72.3556 32.2025 73.4807 35.4098 73.4807 39.1371C73.4807 43.6446 71.9661 47.4153 68.9368 50.4492C65.9942 53.4831 62.1427 55 57.3825 55C52.7088 55 48.8573 53.4831 45.8281 50.4492C42.7988 47.4153 41.2842 43.6446 41.2842 39.1371C41.2842 36.71 41.717 34.2829 42.5825 31.8558C43.448 29.342 45.2655 26.0047 48.0351 21.844L62.8351 0C62.8351 0 66.5567 2.47045 74 7.41134ZM32.7158 7.41134L20.9018 24.4444C23.931 25.1379 26.5708 26.8282 28.8211 29.5154C31.0713 32.2025 32.1965 35.4098 32.1965 39.1371C32.1965 43.6446 30.6819 47.4153 27.6526 50.4492C24.7099 53.4831 20.8585 55 16.0982 55C11.4246 55 7.5731 53.4831 4.54386 50.4492C1.51462 47.4153 0 43.6446 0 39.1371C0 36.71 0.432749 34.2829 1.29825 31.8558C2.16374 29.342 3.98129 26.0047 6.75088 21.844L21.6807 0C21.6807 0 25.3591 2.47045 32.7158 7.41134Z" fill="${c}"/></g></svg>`);
const globe = (c) => svgUri(`<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 9H5.44444M1 9C1 13.4183 4.58172 17 9 17M1 9C1 4.58172 4.58172 1 9 1M5.44444 9H12.5556M5.44444 9C5.44444 13.4183 7.03632 17 9 17M5.44444 9C5.44444 4.58172 7.03632 1 9 1M12.5556 9H17M12.5556 9C12.5556 4.58172 10.9637 1 9 1M12.5556 9C12.5556 13.4183 10.9637 17 9 17M17 9C17 4.58172 13.4183 1 9 1M17 9C17 13.4183 13.4183 17 9 17" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`);

// Text where *starred* words are green, ending in a green full stop unless the
// text already ends with ? or !. Words are laid out individually so they wrap.
export function Rich({ text, size, weight, lh, color, dot = true, center = false }) {
  let t = String(text || "").trim();
  const ends = /[?!]$/.test(t.replace(/\*+$/, ""));
  t = t.replace(/\.+(\**)$/, "$1");
  const words = [];
  highlights(t).forEach((seg) => {
    seg.text.split(/(\s+)/).forEach((w) => {
      if (!w) return;
      if (/^\s+$/.test(w)) { if (words.length) words[words.length - 1].space = true; return; }
      words.push({ w, green: seg.green, space: false });
    });
  });
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: center ? "center" : "flex-start", color, fontSize: size, fontWeight: weight, lineHeight: lh }}>
      {words.map((x, i) => (
        <span key={i} style={{ display: "flex", color: x.green ? GREEN : color, marginRight: x.space || i < words.length - 1 ? "0.26em" : 0 }}>
          {x.w}{i === words.length - 1 && dot && !ends ? <span style={{ color: GREEN }}>.</span> : null}
        </span>
      ))}
    </div>
  );
}

// ---- Live Roles Post ---------------------------------------------------------
export function LiveRoles({ v, photo, overlay }) {
  const roles = lines(v.roles).slice(0, 10);
  const size = roles.length > 6 ? 32 : 35;
  return (
    <div style={{ ...FULL, display: "flex", fontFamily: "Area", background: "#161616" }}>
      {photo ? <img src={photo} width={1080} height={1350} style={{ ...FULL, objectFit: "cover" }} /> : null}
      <img src={overlay} width={1080} height={1350} style={FULL} />

      <div style={{ position: "absolute", left: 100, top: 100, height: 75, display: "flex", alignItems: "center", padding: "0 24px",
        borderRadius: 40, background: "rgba(22,22,22,0.5)", border: `2px solid ${GREEN}` }}>
        <span style={{ color: "#ffffff", fontSize: 36, fontWeight: 500, letterSpacing: "-1.8px" }}>Live Roles</span>
      </div>

      <div style={{ position: "absolute", left: 100, top: 220, width: 880, display: "flex", flexDirection: "column" }}>
        <Rich text={v.heading || "Division"} size={75} weight={700} lh={1.25} color="#ffffff" />
        {roles.map((r, i) => (
          <div key={i} style={{ display: "flex", marginTop: 20, borderLeft: `1px solid ${GREEN}`, paddingLeft: 45, paddingTop: 10, paddingBottom: 10 }}>
            <div style={{ display: "flex", flex: 1, color: "#ffffff", fontSize: size, fontWeight: 500, lineHeight: 1.2 }}>{r}</div>
          </div>
        ))}
      </div>

      <div style={{ position: "absolute", right: 100, top: 1217, height: 31, display: "flex", alignItems: "center" }}>
        <img src={MOUSE} width={30} height={31} style={{ marginRight: 10 }} />
        <span style={{ color: "#ffffff", fontSize: 25, fontWeight: 700, letterSpacing: "-1.25px" }}>www.elevationrg.com</span>
      </div>
    </div>
  );
}

// ---- Statement Graphic -------------------------------------------------------
const STATEMENT_SUB = { green: "#161616", black: GREEN, grey: "#1E1E1E" };

export function Statement({ v, bg, variant }) {
  const s = String(v.statement || "Your statement here").trim();
  const len = s.replace(/\*/g, "").length;
  const size = len > 100 ? 68 : len > 75 ? 78 : 90;
  return (
    <div style={{ ...FULL, display: "flex", fontFamily: "Area", background: "#161616" }}>
      <img src={bg} width={1080} height={1350} style={FULL} />
      <div style={{ position: "absolute", left: 100, top: 160, width: 880, height: 1030, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <Rich text={s} size={size} weight={300} lh={1.2} color="#ffffff" />
        {v.subline ? (
          <div style={{ display: "flex", marginTop: 50, color: STATEMENT_SUB[variant] || "#161616", fontSize: variant === "grey" ? 36 : 34, fontWeight: 700, lineHeight: 1.25 }}>
            {String(v.subline).trim()}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ---- Testimonial -------------------------------------------------------------
export function Testimonial({ v, bg, variant }) {
  const light = variant === "light";
  const ink = light ? "#4C4C4C" : "#ffffff";
  const accent = light ? "#8EC640" : "#ffffff";
  const headline = String(v.headline || "").trim();
  const quote = String(v.quote || "Your client's review goes here.").trim();
  const n = quote.length;
  // 32px matches the green template's ~540-character review; longer reviews step down so the card always fits.
  // A headline takes room too, so it counts towards the size choice.
  const load = n + headline.length * 2;
  const bodySize = load <= 640 ? 32 : load <= 780 ? 28 : load <= 920 ? 24 : 20;
  // With no headline, a short quote is shown big and bold, as in the light template.
  const bigQuote = !headline && n <= 240;
  const name = String(v.name || "").trim();
  return (
    <div style={{ ...FULL, display: "flex", fontFamily: "Area", background: light ? "#ffffff" : "#4C4C4C" }}>
      <img src={bg} width={1080} height={1350} style={FULL} />
      <div style={{ position: "absolute", left: 0, top: 156, width: 1080, height: 1119, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ display: "flex", paddingLeft: 120, height: 55 }}>
          <img src={quoteMark(accent)} width={74} height={55} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 41, marginLeft: 100, width: 880, padding: 75, borderRadius: 20,
          background: "rgba(255,255,255,0.10)", boxShadow: "-15px 15px 30px rgba(0,0,0,0.10)" }}>
          <img src={STARS} width={235} height={32} />
          <div style={{ display: "flex", flexDirection: "column", marginTop: 50 }}>
            {headline ? (
              <div style={{ display: "flex", color: ink, fontSize: 40, fontWeight: 800, lineHeight: 1.25, marginBottom: 25 }}>{headline}</div>
            ) : null}
            <div style={{ display: "flex", color: ink, fontSize: bigQuote ? (n <= 140 ? 40 : 34) : bodySize,
              fontWeight: bigQuote ? 800 : 400, lineHeight: 1.25 }}>{quote}</div>
          </div>
          {name ? (
            <div style={{ display: "flex", alignItems: "center", marginTop: 50 }}>
              <div style={{ display: "flex", width: 20, height: 2, background: ink, marginRight: 10 }} />
              <span style={{ color: ink, fontSize: 20, fontWeight: 700, letterSpacing: "-1px" }}>{name}</span>
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", position: "relative", marginTop: 41, height: 55, width: 1080 }}>
          <div style={{ position: "absolute", left: 153, top: 13, height: 29, display: "flex", alignItems: "center" }}>
            <img src={globe(accent)} width={18} height={18} style={{ marginRight: 8 }} />
            <span style={{ color: ink, fontSize: 24, fontWeight: 700, letterSpacing: "-1.2px" }}>elevationrg.com</span>
          </div>
          <img src={closeQuoteMark(accent)} width={74} height={55} style={{ position: "absolute", left: 886, top: 0 }} />
        </div>
      </div>
    </div>
  );
}

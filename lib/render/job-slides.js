// Shared building blocks for the multi-slide job designs (Figma frames
// 1:1478, 1:1509, 1:1571, 1:1604, 1:1644, 1:1676). Measurements are taken
// straight from the Figma file.
import { GREEN } from "../brand";

const svgUri = (s) => "data:image/svg+xml;utf8," + encodeURIComponent(s);

const INFO_ICON = svgUri(`<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 0C31.0457 0 40 8.9543 40 20C40 31.0457 31.0457 40 20 40C8.9543 40 0 31.0457 0 20C0 8.9543 8.9543 0 20 0ZM21.4375 13.5879C19.5152 13.415 16.6511 14.8026 15.1924 16.0908C14.2797 16.897 13.7414 18.0813 13.9053 19.2656C13.9425 19.5364 14.4096 19.3873 14.54 19.2666C15.2792 18.5829 15.9664 17.9211 16.7861 17.3564C17.1149 17.1301 17.5036 16.9871 17.9014 17.0146C17.9457 17.5019 17.8294 17.9025 17.6992 18.3516C16.9495 20.9398 16.2477 23.4787 15.6406 26.1104C15.2259 27.9082 14.6146 30.6048 14.7793 32.2119C14.8821 33.2135 15.6333 33.8745 16.6445 33.9766C18.7279 34.1858 21.1568 32.3608 22.7617 30.9688H22.7637C23.3733 30.1972 23.8297 29.2597 23.6348 28.2822C23.569 27.9567 23.1083 28.1642 22.9541 28.3018C22.0201 29.1345 21.119 29.8994 20.0742 30.5635C19.929 30.6558 19.7455 30.6794 19.6152 30.6104C19.0312 30.3005 20.0401 26.2613 20.4053 24.874L22.4326 17.1738C22.6418 16.3801 22.8795 15.6089 22.8564 14.7832C22.8367 14.0864 22.0852 13.6456 21.4375 13.5879ZM21.7529 6.00684C20.2416 6.0069 19.0168 7.23401 19.0166 8.74805C19.0166 10.2623 20.2415 11.4902 21.7529 11.4902C23.2644 11.4902 24.4902 10.2623 24.4902 8.74805C24.49 7.234 23.2642 6.00688 21.7529 6.00684Z" fill="${GREEN}"/></svg>`);

const PHONE_ICON = svgUri(`<svg width="39" height="39" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.5 0C30.2696 0 39 8.73045 39 19.5C39 30.2696 30.2696 39 19.5 39C8.73045 39 0 30.2696 0 19.5C0 8.73045 8.73045 0 19.5 0ZM14.3809 9.47461C13.966 8.96009 13.2265 8.8477 12.6777 9.21582L10.9785 10.3564C9.16475 11.5733 8.49678 13.9249 9.40039 15.9141L10.0615 17.3682L10.0625 17.3711C12.5064 22.6968 16.8553 26.9311 22.2617 29.2266L23.1279 29.6133C25.1107 30.4972 27.442 29.8251 28.6514 28.0215L29.7832 26.333C30.1514 25.7839 30.0396 25.0442 29.5254 24.6289L25.6846 21.5283C25.1204 21.0729 24.291 21.179 23.8594 21.7617L22.6709 23.3662C19.622 21.8614 17.1465 19.3837 15.6426 16.333L17.2461 15.1445C17.8284 14.7127 17.9344 13.8828 17.4795 13.3184L14.3809 9.47461Z" fill="${GREEN}"/></svg>`);

const ARROW = svgUri(`<svg width="22" height="23" viewBox="0 0 22 23" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 9.5459C0.671573 9.5459 7.24234e-08 10.2175 0 11.0459C-7.24234e-08 11.8743 0.671573 12.5459 1.5 12.5459L1.5 11.0459L1.5 9.5459ZM21.5607 12.1066C22.1464 11.5208 22.1464 10.571 21.5607 9.98524L12.0147 0.439298C11.4289 -0.146489 10.4792 -0.146489 9.8934 0.439297C9.30761 1.02508 9.30761 1.97483 9.8934 2.56062L18.3787 11.0459L9.8934 19.5312C9.30761 20.117 9.30761 21.0667 9.8934 21.6525C10.4792 22.2383 11.4289 22.2383 12.0147 21.6525L21.5607 12.1066ZM1.5 11.0459L1.5 12.5459L20.5 12.5459L20.5 11.0459L20.5 9.5459L1.5 9.5459L1.5 11.0459Z" fill="white"/></svg>`);

const FULL = { position: "absolute", top: 0, left: 0, width: 1080, height: 1350 };
const lines = (s) => String(s || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

// Heading with the brand's green full stop, e.g. "About the Role."
function Dotted({ text, size, weight = 700, lh = 1.25, color = "#ffffff" }) {
  const t = String(text || "").trim().replace(/\.+$/, "");
  const words = t.split(/\s+/);
  const last = words.pop();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", color, fontSize: size, fontWeight: weight, lineHeight: lh }}>
      {words.map((w, i) => (<span key={i} style={{ marginRight: "0.27em" }}>{w}</span>))}
      <span style={{ display: "flex" }}>{last}<span style={{ color: GREEN }}>.</span></span>
    </div>
  );
}

// Row of slide dots, right edge at x=956, centred on y=cy. `active` is 0-based.
function Dots({ count, active, cy = 1216, extra = null }) {
  return (
    <div style={{ position: "absolute", right: 124, top: cy - 20, height: 40, display: "flex", alignItems: "center" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ width: 20, height: 20, borderRadius: 10, marginLeft: i ? 15 : 0, background: i === active ? GREEN : "#ffffff" }} />
      ))}
      {extra}
    </div>
  );
}

// ---- Cover: photo + overlay + division / title / info --------------------
export function Cover({ v, photo, overlay, slides }) {
  const division = String(v.division || "").toUpperCase();
  const title = String(v.title || "Job Title");
  const size = title.length > 34 ? 76 : title.length > 24 ? 88 : 100;
  const info = [v.location, v.salaryText, v.contract].map((x) => String(x || "").trim()).filter(Boolean).join(" | ");
  return (
    <div style={{ ...FULL, display: "flex", fontFamily: "Area", background: "#161616" }}>
      {photo ? <img src={photo} width={1080} height={1350} style={{ ...FULL, objectFit: "cover" }} /> : null}
      <img src={overlay} width={1080} height={1350} style={FULL} />

      <div style={{ position: "absolute", left: 100, bottom: 300, width: 880, display: "flex", flexDirection: "column" }}>
        {division ? <div style={{ display: "flex", color: GREEN, fontSize: 32, fontWeight: 700, lineHeight: 1, marginBottom: 25 }}>{division}</div> : null}
        <Dotted text={title} size={size} lh={1.2} />
        {info ? (
          <div style={{ display: "flex", alignItems: "flex-start", marginTop: 50 }}>
            {/* marginTop centres the icon on the capital letters of the first line */}
            <img src={INFO_ICON} width={40} height={40} style={{ marginRight: 20, marginTop: 5.5 }} />
            <div style={{ display: "flex", flex: 1, color: "#ffffff", fontSize: 35, fontWeight: 700, lineHeight: 1.25 }}>{info}</div>
          </div>
        ) : null}
      </div>

      <Dots count={slides} active={0} cy={1212}
        extra={
          <div style={{ display: "flex", alignItems: "center", marginLeft: 20 }}>
            <span style={{ color: "#ffffff", fontSize: 30, fontWeight: 600, letterSpacing: "-1.5px" }}>Explore</span>
            <img src={ARROW} width={22} height={23} style={{ marginLeft: 9 }} />
          </div>
        } />
    </div>
  );
}

// ---- Inner slide: heading + paragraph or bullet points ---------------------
export function TextSlide({ heading, body, bullets, bg, index, slides }) {
  const items = bullets ? lines(body).slice(0, 6) : [String(body || "").trim()].filter(Boolean);
  const chars = items.join("").length;
  const tight = bullets && (items.length >= 6 || chars > 260);
  const size = bullets ? (tight ? 30 : 35) : (chars > 260 ? 32 : 35);
  const gap = tight ? 24 : 35;
  return (
    <div style={{ ...FULL, display: "flex", fontFamily: "Area", background: "#161616" }}>
      <img src={bg} width={1080} height={1350} style={FULL} />
      <div style={{ position: "absolute", left: 100, top: 160, width: 880, height: 960, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <Dotted text={heading} size={75} />
        {items.map((t, i) => (
          <div key={i} style={{ display: "flex", marginTop: gap, borderLeft: `1px solid ${GREEN}`, paddingLeft: 45, paddingTop: 10, paddingBottom: 10 }}>
            <div style={{ display: "flex", flex: 1, color: "#ffffff", fontSize: size, fontWeight: 600, lineHeight: 1.25 }}>{t}</div>
          </div>
        ))}
      </div>
      <Dots count={slides} active={index} />
    </div>
  );
}

// ---- Closing slide: question + "Let's talk." + consultant -----------------
export function ContactSlide({ question, name, phone, headshot, bg, index, slides }) {
  const q = String(question || "").trim() || "Interested in this role?";
  const size = q.length > 90 ? 68 : q.length > 60 ? 80 : 96;
  const words = q.split(/\s+/);
  return (
    <div style={{ ...FULL, display: "flex", fontFamily: "Area", background: "#161616" }}>
      <img src={bg} width={1080} height={1350} style={FULL} />
      <div style={{ position: "absolute", left: 100, top: 123, width: 880, height: 772, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ display: "flex", flexWrap: "wrap", color: "#ffffff", fontSize: size, fontWeight: 600, lineHeight: 1.25 }}>
          {words.map((w, i) => (<span key={i} style={{ marginRight: "0.25em" }}>{w}</span>))}
        </div>
        <div style={{ display: "flex", color: GREEN, fontSize: size, fontWeight: 600, lineHeight: 1.25 }}>Let's talk.</div>
      </div>

      {name || phone ? (
        <div style={{ position: "absolute", left: 100, top: 936, width: 880, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            {headshot ? (
              <img src={headshot} width={137} height={137}
                style={{ width: 137, height: 137, borderRadius: 69, border: `3px solid ${GREEN}`, objectFit: "cover", marginRight: 45 }} />
            ) : null}
            <img src={PHONE_ICON} width={39} height={39} style={{ marginRight: 20 }} />
            <div style={{ display: "flex", color: "#ffffff", fontSize: 36, lineHeight: 1.25 }}>
              {name ? <span style={{ fontWeight: 700 }}>{name}</span> : null}
              {name && phone ? <span style={{ fontWeight: 600, margin: "0 0.3em" }}>|</span> : null}
              {phone ? <span style={{ fontWeight: 700 }}>{phone}</span> : null}
            </div>
          </div>
          <div style={{ display: "flex", width: 880, height: 2, background: "#ffffff", marginTop: 33 }} />
        </div>
      ) : null}
      <Dots count={slides} active={index} />
    </div>
  );
}

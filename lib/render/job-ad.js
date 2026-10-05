// LinkedIn Job Ad — matches Figma frame 1:466 and the live LinkedIn ads.
// The photo files already carry the shading, swirl, logo, "New Vacancy" pill,
// pin icon and web address, so only the text is drawn here.
import { GREEN } from "../brand";
import { salaryText } from "../text";

const LEFT = 100;
const RIGHT = 90;
const TITLE_BLOCK_BOTTOM = 396;
const DIVISION_SIZE = 34;
const DIVISION_GAP = 23;
const INFO_LEFT = 164;
const INFO_CENTER_Y = 1026;
const INFO_H = 60;
const INFO_SIZE = 38;

// Long titles step down so they never climb into the "New Vacancy" pill.
function titleSize(t) {
  if (t.length > 38) return 72;
  if (t.length > 28) return 82;
  return 92;
}

export default function renderJobAd(v, { photo }) {
  const division = String(v.division || "").toUpperCase();
  const title = String(v.title || "Job Title").trim().replace(/\.+$/, "");
  const info = [String(v.location || "").trim(), salaryText(v.salary, v.hideSalary === "1"), String(v.contract || "").trim()]
    .filter(Boolean)
    .join(" | ");
  const words = title.split(/\s+/);
  const last = words.pop();
  const size = titleSize(title);

  return (
    <div style={{ position: "relative", width: 1080, height: 1350, display: "flex", fontFamily: "Area", background: "#0b0b0b" }}>
      {photo ? (
        <img src={photo} width={1080} height={1350}
          style={{ position: "absolute", top: 0, left: 0, width: 1080, height: 1350, objectFit: "cover" }} />
      ) : null}

      <div style={{ position: "absolute", left: LEFT, bottom: TITLE_BLOCK_BOTTOM, width: 1080 - LEFT - RIGHT,
        display: "flex", flexDirection: "column" }}>
        {division ? (
          <div style={{ display: "flex", color: GREEN, fontSize: DIVISION_SIZE, fontWeight: 600,
            letterSpacing: "2px", marginBottom: DIVISION_GAP }}>{division}</div>
        ) : null}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", color: "#ffffff",
          fontSize: size, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-1px" }}>
          {words.map((w, i) => (<span key={i} style={{ marginRight: "0.28em" }}>{w}</span>))}
          <span style={{ display: "flex" }}>{last}<span style={{ color: GREEN }}>.</span></span>
        </div>
      </div>

      <div style={{ position: "absolute", left: INFO_LEFT, top: INFO_CENTER_Y - INFO_H / 2, height: INFO_H,
        display: "flex", alignItems: "center" }}>
        <div style={{ display: "flex", color: "#ffffff", fontSize: INFO_SIZE, fontWeight: 600 }}>{info}</div>
      </div>
    </div>
  );
}

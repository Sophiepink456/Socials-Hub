// 5 Reasons Carousel (Figma 2:401, 2:372, 2:347, 2:318, 2:293, 2:265, 2:242)
// and Multi Vacancy Carousel (3:1310 cover, 3:1184.. job slides, 3:1011 end).
// Measurements are taken straight from the Figma file.
import { GREEN } from "../brand";
import { FULL, INFO_ICON, Dotted, arrow } from "./job-slides";
import { Rich, MOUSE } from "./social";

const svgUri = (s) => "data:image/svg+xml;utf8," + encodeURIComponent(s);
const ARROW = arrow();

// Plain white handset used on the job slides' contact line.
const HANDSET = svgUri(`<svg width="24" height="24" viewBox="8.9 8.9 21.2 21.2" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.3809 9.47461C13.966 8.96009 13.2265 8.8477 12.6777 9.21582L10.9785 10.3564C9.16475 11.5733 8.49678 13.9249 9.40039 15.9141L10.0615 17.3682L10.0625 17.3711C12.5064 22.6968 16.8553 26.9311 22.2617 29.2266L23.1279 29.6133C25.1107 30.4972 27.442 29.8251 28.6514 28.0215L29.7832 26.333C30.1514 25.7839 30.0396 25.0442 29.5254 24.6289L25.6846 21.5283C25.1204 21.0729 24.291 21.179 23.8594 21.7617L22.6709 23.3662C19.622 21.8614 17.1465 19.3837 15.6426 16.333L17.2461 15.1445C17.8284 14.7127 17.9344 13.8828 17.4795 13.3184L14.3809 9.47461Z" fill="white"/></svg>`);

const Photo = ({ src }) => (src ? <img src={src} width={1080} height={1350} style={{ ...FULL, objectFit: "cover" }} /> : null);
const Layer = ({ src }) => <img src={src} width={1080} height={1350} style={FULL} />;

// A row of 20px slide dots (15px apart) whose right edge sits at x = 1080 - right.
function DotRow({ count, active, right, cy, before = null, after = null }) {
  return (
    <div style={{ position: "absolute", right, top: cy - 20, height: 40, display: "flex", alignItems: "center" }}>
      {before}
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ width: 20, height: 20, borderRadius: 10, marginLeft: i || before ? 15 : 0, background: i === active ? GREEN : "#ffffff" }} />
      ))}
      {after}
    </div>
  );
}
const NextArrow = () => <img src={ARROW} width={20} height={21} style={{ marginLeft: 20 }} />;
const BackArrow = () => <img src={ARROW} width={20} height={21} style={{ marginRight: 5, transform: "rotate(180deg)" }} />;

// =============================== 5 Reasons ===================================
const ORDINAL = ["one", "two", "three", "four", "five"];
// Reason slides alternate: green, photo, dark, photo, light.
export const REASON_LOOKS = ["green", "photo", "dark", "photo", "light"];
const INK = { green: "#EBEBEB", photo: "#FFFFFF", dark: "#EBEBEB", light: "#161616" };

export function ReasonsCover({ v, photo, overlay }) {
  const q = String(v.question || "Why use recruitment agencies for *skilled* hiring?").trim();
  const len = q.replace(/\*/g, "").length;
  return (
    <div style={{ ...FULL, display: "flex", fontFamily: "Area", background: "#161616" }}>
      <Photo src={photo} />
      <Layer src={overlay} />

      <div style={{ position: "absolute", left: 854, top: 635, width: 226, height: 80, display: "flex", alignItems: "center",
        paddingLeft: 24, background: GREEN, borderRadius: "40px 0 0 40px" }}>
        <span style={{ color: "#ffffff", fontSize: 40, fontWeight: 600, letterSpacing: "-2px" }}>Explore</span>
        <img src={ARROW} width={22} height={23} style={{ marginLeft: 14 }} />
      </div>

      <div style={{ position: "absolute", left: 100, bottom: 242, width: 880, display: "flex" }}>
        <Rich text={q} size={len > 62 ? 64 : 75} weight={900} lh={1.25} color="#ffffff" />
      </div>

      <DotRow count={7} active={0} right={124} cy={1232} />
    </div>
  );
}

export function ReasonSlide({ v, n, photo, bg }) {
  const look = REASON_LOOKS[n - 1];
  const ink = INK[look];
  const title = String(v[`r${n}`] || `Reason ${ORDINAL[n - 1]}`).trim();
  const body = String(v[`r${n}text`] || "").trim();
  const tSize = title.length > 34 ? 76 : title.length > 26 ? 88 : 100;
  const bSize = body.length > 150 ? 36 : 40;
  const block = look === "photo"
    ? { bottom: 325 }                                              // photo slides sit low, under the face
    : { top: 160, height: 1031, justifyContent: "center" };       // the others are centred on y = 675
  return (
    <div style={{ ...FULL, display: "flex", fontFamily: "Area", background: "#161616" }}>
      {look === "photo" ? <Photo src={photo} /> : null}
      <Layer src={bg} />

      <div style={{ position: "absolute", left: 100, top: 100, height: 80, display: "flex", alignItems: "center", padding: "0 24px",
        borderRadius: 40, background: look === "green" ? "transparent" : GREEN, border: look === "green" ? "3px solid #ffffff" : "none" }}>
        <span style={{ color: look === "light" ? "#EBEBEB" : "#ffffff", fontSize: 40, fontWeight: 600, letterSpacing: "-2px" }}>
          Reason {ORDINAL[n - 1]}
        </span>
      </div>

      <div style={{ position: "absolute", left: 100, width: 880, display: "flex", flexDirection: "column", ...block }}>
        <Dotted text={title} size={tSize} weight={900} lh={1.2} color={ink} />
        {body ? (
          <div style={{ display: "flex", marginTop: 35, color: ink, fontSize: bSize, fontWeight: look === "dark" ? 700 : 600, lineHeight: 1.25 }}>{body}</div>
        ) : null}
      </div>

      <DotRow count={7} active={n} right={124} cy={1232} after={<NextArrow />} />
    </div>
  );
}

export function ReasonsEnd({ v, photo, overlay }) {
  const q = String(v.closing || "Need to fill a role?").trim();
  return (
    <div style={{ ...FULL, display: "flex", fontFamily: "Area", background: "#161616" }}>
      <Photo src={photo} />
      <Layer src={overlay} />

      <div style={{ position: "absolute", left: 100, top: 300, width: 782, height: 696, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <Rich text={`${q} *Let's talk*`} size={q.length > 36 ? 84 : 96} weight={900} lh={1.2} color="#ffffff" />
        <div style={{ display: "flex", alignItems: "center", marginTop: 34 }}>
          <img src={MOUSE} width={30} height={31} style={{ marginRight: 10 }} />
          <span style={{ color: "#ffffff", fontSize: 35, fontWeight: 700, letterSpacing: "-1.75px" }}>www.elevationrg.com</span>
        </div>
      </div>

      <DotRow count={7} active={6} right={124} cy={1232} before={<BackArrow />} />
    </div>
  );
}

// ============================ Multi Vacancy ==================================
function Pill({ children }) {
  return (
    <div style={{ position: "absolute", left: 100, top: 100, height: 75, display: "flex", alignItems: "center", padding: "0 24px",
      borderRadius: 40, background: "rgba(22,22,22,0.5)", border: `2px solid ${GREEN}` }}>
      <span style={{ color: "#ffffff", fontSize: 36, fontWeight: 500, letterSpacing: "-1.8px" }}>{children}</span>
    </div>
  );
}

export function VacanciesCover({ photo, overlay, jobs }) {
  return (
    <div style={{ ...FULL, display: "flex", fontFamily: "Area", background: "#161616" }}>
      <Photo src={photo} />
      <Layer src={overlay} />
      <Pill>New Vacancies</Pill>
      <DotRow count={jobs + 1} active={0} right={100} cy={134}
        after={
          <div style={{ display: "flex", alignItems: "center", marginLeft: 20 }}>
            <span style={{ color: "#ffffff", fontSize: 30, fontWeight: 500, letterSpacing: "-1.5px" }}>Explore</span>
            <img src={ARROW} width={20} height={21} style={{ marginLeft: 9 }} />
          </div>
        } />
      <div style={{ position: "absolute", left: 100, top: 495, width: 840, display: "flex" }}>
        <Rich text="Your *Next* Career" size={150} weight={900} lh={1.2} color="#ffffff" />
      </div>
      <div style={{ position: "absolute", left: 100, top: 887, display: "flex", color: "#ffffff", fontSize: 40, fontWeight: 700, lineHeight: 1.25 }}>
        Could be one swipe away.
      </div>
    </div>
  );
}

// `job` = { division, title, location, salaryText, consultant, phone }
export function VacancyJob({ job, n, jobs, photo, overlay }) {
  const title = String(job.title || "Job Title").trim();
  const size = title.length > 34 ? 76 : title.length > 24 ? 88 : 100;
  const info = [job.location, job.salaryText].map((x) => String(x || "").trim()).filter(Boolean).join(" | ");
  const contact = [job.consultant, job.phone].map((x) => String(x || "").trim()).filter(Boolean).join(" | ");
  return (
    <div style={{ ...FULL, display: "flex", fontFamily: "Area", background: "#161616" }}>
      <Photo src={photo} />
      <Layer src={overlay} />
      <Pill>New Vacancy</Pill>
      <DotRow count={jobs + 1} active={n} right={100} cy={137} />

      <div style={{ position: "absolute", left: 100, bottom: 300, width: 856, display: "flex", flexDirection: "column" }}>
        {job.division ? (
          <div style={{ display: "flex", color: GREEN, fontSize: 32, fontWeight: 700, lineHeight: 1, marginBottom: 35 }}>
            {String(job.division).toUpperCase()}
          </div>
        ) : null}
        <Dotted text={title} size={size} weight={900} lh={1.2} />
        {info ? (
          <div style={{ display: "flex", alignItems: "flex-start", marginTop: 35 }}>
            <img src={INFO_ICON} width={40} height={40} style={{ marginRight: 20, marginTop: 6 }} />
            <div style={{ display: "flex", flex: 1, color: "#ffffff", fontSize: 36, fontWeight: 700, lineHeight: 1.25 }}>{info}</div>
          </div>
        ) : null}
      </div>

      {contact ? (
        <div style={{ position: "absolute", left: 185, top: 1185, height: 35, display: "flex", alignItems: "center" }}>
          <img src={HANDSET} width={24} height={24} style={{ marginRight: 15 }} />
          <span style={{ color: "#ffffff", fontSize: 28, fontWeight: 700 }}>{contact}</span>
        </div>
      ) : null}
    </div>
  );
}

export function VacanciesEnd({ bg }) {
  return (
    <div style={{ ...FULL, display: "flex", fontFamily: "Area", background: "#161616" }}>
      <Layer src={bg} />
      <div style={{ position: "absolute", left: 149, top: 485, width: 782, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Rich text="*You* Swiped for a Reason" size={96} weight={900} lh={1.2} color="#ffffff" center />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 50, fontSize: 40, fontWeight: 700, lineHeight: 1.5 }}>
          <span style={{ color: "#ffffff" }}>Get in touch today.</span>
          <span style={{ color: GREEN }}>elevationrg.com</span>
        </div>
      </div>
    </div>
  );
}

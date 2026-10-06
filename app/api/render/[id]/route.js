import { ImageResponse } from "next/og";
import { getDesign } from "../../../../lib/designs";
import { randomPhoto, photoPool, headshotFor } from "../../../../lib/photos";
import { fileName, salaryText } from "../../../../lib/text";
import renderJobAd from "../../../../lib/render/job-ad";
import { Cover, TextSlide, ContactSlide } from "../../../../lib/render/job-slides";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// Each renderer gets the form values, the slide number and the resolved
// asset addresses, and returns the JSX for that one slide.
const RENDERERS = {
  "job-ad": (v, { photo }) => renderJobAd(v, { photo }),

  "job-ideal": (v, a) =>
    a.slide === 0
      ? <Cover v={v} photo={a.photo} overlay={a.asset("job-cover/overlay.png")} slides={2} />
      : <TextSlide heading="Ideal Candidate" body={v.ideal} bg={a.asset("job-cover/slide-bg.png")} index={1} slides={2} />,

  "job-carousel": (v, a) => {
    const bg = a.asset("job-cover/slide-bg.png");
    if (a.slide === 0) return <Cover v={v} photo={a.photo} overlay={a.asset("job-cover/overlay.png")} slides={4} />;
    if (a.slide === 1) return <TextSlide heading="About the Role" body={v.about} bullets bg={bg} index={1} slides={4} />;
    if (a.slide === 2) return <TextSlide heading="Package" body={v.package} bullets bg={bg} index={2} slides={4} />;
    const hs = headshotFor(v.consultant);
    return <ContactSlide question={v.question} name={v.consultant} phone={v.phone}
      headshot={hs ? a.origin + hs : ""} bg={bg} index={3} slides={4} />;
  },
};

export async function GET(req, { params }) {
  const design = getDesign(params.id);
  const render = RENDERERS[params.id];
  if (!design || !render) return new Response("Unknown design", { status: 404 });

  const { searchParams, origin } = new URL(req.url);
  const isSample = searchParams.get("sample") === "1";
  const values = isSample ? { ...design.sample } : Object.fromEntries(searchParams.entries());
  values.salaryText = salaryText(values.salary, values.hideSalary === "1");
  const slide = Math.max(0, Math.min(design.slides - 1, parseInt(searchParams.get("slide") || "0", 10) || 0));

  // Only our own photo files can be used — never an outside address.
  let photo = "";
  if (design.photo && slide === 0) {
    const set = design.photoSet || design.id;
    const asked = searchParams.get("photo") || "";
    let path;
    if (asked.startsWith("/designs/") && !asked.includes("..")) path = asked;
    // The home-screen preview always uses the first photo, so the card is steady.
    else if (isSample) path = photoPool(set, values.division)[0];
    else path = randomPhoto(set, values.division);
    photo = path ? origin + path : "";
  }

  // Area Normal, as used in the Figma templates: Medium 500 (body copy),
  // SemiBold 600, Bold 700 (headings, details), Black 900 (cover titles).
  const [medium, semiBold, bold, black] = await Promise.all([
    fetch(new URL("../../../fonts/Area-Medium.otf", import.meta.url)).then((r) => r.arrayBuffer()),
    fetch(new URL("../../../fonts/Area-SemiBold.otf", import.meta.url)).then((r) => r.arrayBuffer()),
    fetch(new URL("../../../fonts/Area-Bold.otf", import.meta.url)).then((r) => r.arrayBuffer()),
    fetch(new URL("../../../fonts/Area-Black.otf", import.meta.url)).then((r) => r.arrayBuffer()),
  ]);

  const jsx = render(values, { photo, slide, origin, asset: (p) => `${origin}/designs/${p}` });
  const base = fileName(values.title || design.title, "png").replace(/\.png$/, "");

  return new ImageResponse(jsx, {
    width: design.width,
    height: design.height,
    fonts: [
      { name: "Area", data: medium, weight: 500, style: "normal" },
      { name: "Area", data: semiBold, weight: 600, style: "normal" },
      { name: "Area", data: bold, weight: 700, style: "normal" },
      { name: "Area", data: black, weight: 900, style: "normal" },
    ],
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `inline; filename="${base}${design.slides > 1 ? "-" + (slide + 1) : ""}.png"`,
      "Cache-Control": isSample ? "public, max-age=300" : "no-store",
    },
  });
}

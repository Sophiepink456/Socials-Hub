import { ImageResponse } from "next/og";
import { getDesign } from "../../../../lib/designs";
import { randomPhoto, photoPool } from "../../../../lib/photos";
import { fileName } from "../../../../lib/text";
import renderJobAd from "../../../../lib/render/job-ad";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const RENDERERS = {
  "job-ad": renderJobAd,
};

export async function GET(req, { params }) {
  const design = getDesign(params.id);
  const render = RENDERERS[params.id];
  if (!design || !render) return new Response("Unknown design", { status: 404 });

  const { searchParams, origin } = new URL(req.url);
  const values = design.sample && searchParams.get("sample") === "1"
    ? { ...design.sample }
    : Object.fromEntries(searchParams.entries());

  // Only our own photo files can be used — never an outside address.
  let photo = "";
  if (design.photo) {
    const asked = searchParams.get("photo") || "";
    let path;
    if (asked.startsWith("/designs/") && !asked.includes("..")) path = asked;
    // The home-screen preview always uses the first photo, so the card is steady.
    else if (searchParams.get("sample") === "1") path = photoPool(design.id, values.division)[0];
    else path = randomPhoto(design.id, values.division);
    photo = path ? origin + path : "";
  }

  const [bold, semiBold] = await Promise.all([
    fetch(new URL("../../../fonts/Area-Bold.otf", import.meta.url)).then((r) => r.arrayBuffer()),
    fetch(new URL("../../../fonts/Area-SemiBold.otf", import.meta.url)).then((r) => r.arrayBuffer()),
  ]);

  return new ImageResponse(render(values, { photo }), {
    width: design.width,
    height: design.height,
    fonts: [
      { name: "Area", data: bold, weight: 700, style: "normal" },
      { name: "Area", data: semiBold, weight: 600, style: "normal" },
    ],
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": 'inline; filename="' + fileName(values.title || design.title, "png") + '"',
      "Cache-Control": searchParams.get("sample") === "1" ? "public, max-age=300" : "no-store",
    },
  });
}

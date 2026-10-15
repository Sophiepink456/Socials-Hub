// Browser-side: turn a social design's render links into the file people download.
// Used by the design editor and by the Saved designs folder.

export function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function toJpeg(blob) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      c.getContext("2d").drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      c.toBlob((b) => (b ? b.arrayBuffer().then(resolve, reject) : reject(new Error("jpeg"))), "image/jpeg", 0.92);
    };
    img.onerror = reject;
    img.src = url;
  });
}

// One PNG, or (for carousels) one PDF with a slide per page, ready for a LinkedIn document post.
// Slides become high-quality JPEGs first so the file stays small enough to upload.
export async function buildSocialFile(urls, { format, width, height }, onStep = () => {}) {
  if (format !== "pdf") {
    onStep("Preparing…");
    const res = await fetch(urls[0]);
    if (!res.ok) throw new Error("render failed");
    return res.blob();
  }
  const { PDFDocument } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  for (let n = 0; n < urls.length; n++) {
    onStep(`Slide ${n + 1} of ${urls.length}…`);
    const res = await fetch(urls[n]);
    if (!res.ok) throw new Error("render failed");
    const img = await pdf.embedJpg(await toJpeg(await res.blob()));
    const page = pdf.addPage([width, height]);
    page.drawImage(img, { x: 0, y: 0, width, height });
  }
  onStep("Saving…");
  return new Blob([await pdf.save()], { type: "application/pdf" });
}

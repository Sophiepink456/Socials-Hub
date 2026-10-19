// Shrinks what's inside (sizes written with px()) until it fits its box, so long text
// never spills out of a panel. As in the Figma, centred content may run into the box's
// padding; it only shrinks once it would come closer than `margin` to the box's edges.
// Measured with offsets (the box must be positioned), so the scaled preview measures the same.
import { useLayoutEffect, useRef } from "react";

export const px = (n) => `calc(${n}px * var(--k, 1))`;

function overflows(el, [mt, mb]) {
  const kids = Array.from(el.children);
  for (const c of kids) {
    if (c.offsetTop < mt - 0.5 || c.offsetTop + c.offsetHeight > el.clientHeight - mb + 0.5) return true;
  }
  return el.scrollWidth > el.clientWidth + 1;
}

// `margin` is [top, bottom]: how close the content may come to the box's edges.
export function Fit({ as: Tag = "div", style, className = "", children, margin = [0, 0], min = 0.55 }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let k = 1;
    el.style.setProperty("--k", "1");
    while (k > min && overflows(el, margin)) {
      k -= 0.02;
      el.style.setProperty("--k", String(k));
    }
  });
  return <Tag ref={ref} className={className} style={{ overflow: "hidden", ...style }}>{children}</Tag>;
}

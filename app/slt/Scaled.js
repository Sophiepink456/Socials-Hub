"use client";

// Shows a fixed-size page (a 1920 x 1080 slide or the 1123 x 794 induction sheet) shrunk to fit its column.
import { useEffect, useRef, useState } from "react";

export default function Scaled({ w, h, children }) {
  const box = useRef(null);
  const [cw, setCw] = useState(640);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setCw(el.clientWidth));
    ro.observe(el);
    setCw(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  const s = cw / w;
  return (
    <div ref={box} className="slt-scaled" style={{ height: h * s }}>
      <div style={{ width: w, height: h, transform: `scale(${s})`, transformOrigin: "0 0" }}>{children}</div>
    </div>
  );
}

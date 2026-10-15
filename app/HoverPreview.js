"use client";

import { useEffect, useRef, useState } from "react";

const PAGE_MS = 1300;

// Each page image also exists pre-shrunk (name-480.jpg, -720, -960, -1440) so the browser
// picks one close to the tile's real size instead of squashing the 1920px original.
const WIDTHS = [480, 720, 960, 1440];
const sizesFor = (src) =>
  WIDTHS.map((w) => `${src.replace(/\.jpg$/, `-${w}.jpg`)} ${w}w`).concat(`${src} 1920w`).join(", ");

// Sits inside a .tool-img box. At rest it shows the first image.
// mode "deck": on hover it flicks through every page, then returns to the cover.
// mode "swap": on hover it slides once to the second image (used on the homepage).
// Touch screens can't hover, so there it plays by itself while on screen.
export default function HoverPreview({ images, mode = "deck", sizes = "(max-width: 700px) 100vw, 640px" }) {
  const box = useRef(null);
  const [i, setI] = useState(0);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = box.current && box.current.closest(".card");
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const touch = window.matchMedia("(hover: none)").matches;
    const start = () => setOn(true);
    const stop = () => setOn(false);
    if (touch && "IntersectionObserver" in window) {
      const io = new IntersectionObserver((es) => es.forEach((e) => setOn(e.isIntersecting)), { threshold: 0.6 });
      io.observe(el);
      return () => io.disconnect();
    }
    el.addEventListener("mouseenter", start);
    el.addEventListener("mouseleave", stop);
    el.addEventListener("focus", start);
    el.addEventListener("blur", stop);
    return () => {
      el.removeEventListener("mouseenter", start);
      el.removeEventListener("mouseleave", stop);
      el.removeEventListener("focus", start);
      el.removeEventListener("blur", stop);
    };
  }, []);

  useEffect(() => {
    if (!on) { setI(0); return; }
    if (mode === "swap") {
      const touch = window.matchMedia("(hover: none)").matches;
      if (!touch) { setI(1); return; }
      setI(1);
      const t = setInterval(() => setI((n) => (n ? 0 : 1)), 4000);
      return () => clearInterval(t);
    }
    setI(1 % images.length);
    const t = setInterval(() => setI((n) => (n + 1) % images.length), PAGE_MS);
    return () => clearInterval(t);
  }, [on, mode, images.length]);

  return (
    <div ref={box} className={"hp" + (mode === "swap" ? " hp-swap" : "")}>
      <div className="hp-track" style={{ transform: `translateX(${-100 * i}%)` }}>
        {images.map((src, n) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            srcSet={sizesFor(src)}
            sizes={sizes}
            alt=""
            loading={n === 0 ? "eager" : "lazy"}
            decoding="async"
          />
        ))}
      </div>
      {mode === "deck" && (
        <div className={"hp-dots" + (on ? " on" : "")} aria-hidden="true">
          {images.map((src, n) => <i key={src} className={n === i ? "cur" : ""} />)}
        </div>
      )}
    </div>
  );
}

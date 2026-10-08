import { DESIGNS } from "../lib/designs";

export default function Home() {
  return (
    <main className="wrap">
      <h1 className="h1">Choose a design<span className="g">.</span></h1>
      <p className="lede">Pick the post you want to make, fill in the details and download it ready for LinkedIn.</p>

      <div className="grid">
        {DESIGNS.map((d) => (
          <a key={d.id} href={`/d/${d.id}`} className="card">
            <h2 className="card-title">{d.title}</h2>
            <div className="card-img">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/render/${d.id}?sample=1`} alt={`${d.title} example`} loading="lazy" />
            </div>
            <div className="card-meta">{d.slidesLabel || (d.slides === 1 ? "1 image" : `${d.slides} slides`)} · {d.blurb}</div>
          </a>
        ))}
      </div>
    </main>
  );
}

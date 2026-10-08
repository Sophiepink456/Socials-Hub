# Elevation Marketing Hub

Consultants pick a design on the home screen, fill in the fields and download the finished post.

## Swapping photos or backgrounds (rebrand)

Everything visual lives in `public/designs/<design>/`. Replace the files in GitHub and commit. Vercel redeploys on its own and the link stays the same.

- **Job ad photos:** `public/designs/job-ad/photos/general/` (used for every division) and `public/designs/job-ad/photos/leadership-executive/` (used only for Leadership & Executive). File names don't matter, and you can add or remove as many as you like. To give another division its own photos, add a folder named after it, e.g. `photos/people-hr/`.
- **Job carousel photos** (Job Ad + Ideal Candidate, Job Ad Carousel): `public/designs/job-cover/photos/general/`. These are the plain photos with nothing on them. They're cropped to 1080 × 1350 automatically, so upload them at that size or bigger.
- **Job carousel cover overlay:** `public/designs/job-cover/overlay.png`. This is the shading, swirl, logo and "New Vacancy" pill that sit on top of the photo.
- **Job carousel inner background:** `public/designs/job-cover/slide-bg.png`. This is the dark background with the swirl and footer logo, used on every slide after the cover.
- **Candidate ad overlay:** `public/designs/candidate/overlay.png` (white wash, swirl, logo) and **green page background:** `public/designs/candidate/slide-bg.png`. Candidate covers use the same plain photos as the job carousels.
- **Live Roles background:** `public/designs/live-roles/overlay.png` (shading, swirl, logo) sits over a faint office photo from the job carousel set.
- **Statement backgrounds:** `public/designs/statement/green.png`, `black.png`, `grey.png`.
- **Testimonial backgrounds:** `public/designs/testimonial/green.png`, `dark.png`, `light.png` (gradient, blurred "e", logo at the top).
- **5 Reasons Carousel:** `public/designs/reasons/`. `cover-overlay.png` (shading, swirl, logo over the cover photo), `green.png` / `dark.png` / `light.png` (reasons one, three and five), `photo-overlay.png` (laid over the photo on reasons two and four), `end-overlay.png` (closing slide, over a faint photo). Photos come from the job carousel set.
- **Multi Vacancy Carousel:** `public/designs/vacancies/`. `cover-overlay.png` ("Your Next Career" cover shading, dots, logo), `job-overlay.png` (shading, swirl and small logo on each job slide), `end.png` ("You Swiped for a Reason" background). Each slide gets its own photo from the job carousel set.
- **Consultant headshots:** `public/headshots/<Full Name>.jpg`. The file name is the name shown in the Consultant dropdown and printed on the slide.
- **Colours and division list:** `lib/brand.js`.
- **Fonts:** `app/fonts/`.

## Adding a design

1. Add an entry to `lib/designs.js` (title, fields and sample text for the home-screen preview).
2. Add a render file in `lib/render/` and register it in `app/api/render/[id]/route.js`.
3. Put its backgrounds in `public/designs/<id>/`.

## Notes

- The image renderer (`app/api/render/[id]/route.js`) runs on Vercel's Node.js runtime, not edge. The four Area fonts are too big for the 1 MB edge limit, which made two deploys fail on 6 Oct 2026. Don't switch it back to `runtime = "edge"`.


# Elevation Socials Hub

Consultants pick a design on the home screen, fill in the fields and download the finished post.

## Swapping photos or backgrounds (rebrand)

Everything visual lives in `public/designs/<design>/`. Replace the files in GitHub and commit. Vercel redeploys on its own and the link stays the same.

- **Job ad photos:** `public/designs/job-ad/photos/general/` (used for every division) and `public/designs/job-ad/photos/leadership-executive/` (used only for Leadership & Executive). File names don't matter, and you can add or remove as many as you like. To give another division its own photos, add a folder named after it, e.g. `photos/people-hr/`.
- **Colours and division list:** `lib/brand.js`.
- **Fonts:** `app/fonts/`.

## Adding a design

1. Add an entry to `lib/designs.js` (title, fields and sample text for the home-screen preview).
2. Add a render file in `lib/render/` and register it in `app/api/render/[id]/route.js`.
3. Put its backgrounds in `public/designs/<id>/`.

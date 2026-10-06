/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Ship the font files with the image renderer (it reads them from disk).
    outputFileTracingIncludes: {
      "/api/render/[id]": ["./app/fonts/**/*"],
    },
  },
};
module.exports = nextConfig;

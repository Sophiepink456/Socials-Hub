/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Ship the font files with the image renderer (it reads them from disk).
    outputFileTracingIncludes: {
      "/api/render/[id]": ["./app/fonts/**/*"],
      // The headless Chrome binary used to print proposals to PDF.
      "/api/proposals/pdf": ["./node_modules/@sparticuz/chromium/bin/**/*"],
      "/api/proposals/submit": ["./node_modules/@sparticuz/chromium/bin/**/*"],
      "/api/proposals/[id]": ["./node_modules/@sparticuz/chromium/bin/**/*"],
      // Also used to open websites that only show their pictures once JavaScript runs.
      "/api/proposals/scrape": ["./node_modules/@sparticuz/chromium/bin/**/*"],
      "/api/proposals/about": ["./node_modules/@sparticuz/chromium/bin/**/*"],
    },
    // Load these from node_modules at run time instead of bundling them.
    serverComponentsExternalPackages: ["@sparticuz/chromium", "puppeteer-core", "sharp"],
  },
};
module.exports = nextConfig;

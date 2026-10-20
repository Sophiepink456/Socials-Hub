import "./letterhead.css";

export const metadata = { title: "Powered by Elevation · Marketing Hub" };

// Google Sans Flex (hosted in public/letterhead) as used in the Figma letterhead; Inter as a fallback.
export default function LetterheadLayout({ children }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,600;0,700;0,800;1,400&display=swap" />
      <link rel="preload" href="/letterhead/GoogleSansFlex.woff2" as="font" type="font/woff2" crossOrigin="" />
      {children}
    </>
  );
}

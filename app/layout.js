import localFont from "next/font/local";
import "./globals.css";

const area = localFont({
  src: [
    { path: "./fonts/Area-SemiBold.otf", weight: "600" },
    { path: "./fonts/Area-Bold.otf", weight: "700" },
  ],
  variable: "--font-area",
});

export const metadata = {
  title: "Marketing Hub · Elevation",
  description: "Pick a design, fill in the details, download the post.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={area.variable}>
      <body>
        <header className="bar">
          <a href="/" className="brand">
            <span className="dot" aria-hidden="true" />
            Marketing Hub
          </a>
          <span className="bar-note">Elevation Recruitment Group</span>
        </header>
        {children}
      </body>
    </html>
  );
}

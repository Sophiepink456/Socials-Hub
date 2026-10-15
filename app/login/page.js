import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const metadata = { title: "Sign in · Marketing Hub", robots: { index: false, follow: false } };

export default function LoginPage() {
  return (
    <main className="wrap">
      <h1 className="h1">Marketing Hub<span className="g">.</span></h1>
      <p className="lede">For Elevation staff only. Enter the hub password to carry on.</p>
      <Suspense fallback={null}><LoginForm /></Suspense>
    </main>
  );
}

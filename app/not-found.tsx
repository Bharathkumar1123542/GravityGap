// app/not-found.tsx — 404 page (spec §3)
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
      <h1 className="text-page-title font-semibold text-text">404 — Page not found</h1>
      <p className="text-text-muted">The page you are looking for does not exist.</p>
      <Link href="/" className="text-accent underline">
        Return to Explorer
      </Link>
    </div>
  );
}

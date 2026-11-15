// components/Banner.tsx — permanent partial-gravity gap notice (FR-EXP-04; spec §6.1)
// Never dismissible. role="note". Links to /about#gap.
import Link from "next/link";
import { COPY } from "@/lib/copy";

export default function Banner() {
  return (
    <div
      role="note"
      aria-label="Data gap notice"
      className="w-full border border-warning bg-warning-surface text-warning-text px-4 py-2 text-sm flex items-start gap-2"
    >
      <span aria-hidden="true" className="mt-0.5 flex-shrink-0">⚠</span>
      <span>
        {COPY["banner.gap"]}{" "}
        <Link
          href="/about#gap"
          className="underline text-warning-text hover:text-text focus-visible:outline-2"
        >
          About
        </Link>
      </span>
    </div>
  );
}

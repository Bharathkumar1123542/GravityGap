// app/page.tsx — Explorer route (/)
// spec §6.1 — FR-EXP-01
import { Suspense } from "react";
import { ExplorerClient } from "@/components/ExplorerClient";
import { ExplorerSkeleton } from "@/components/ExplorerSkeleton";

export default function ExplorerPage() {
  return (
    <main id="main">
      <Suspense fallback={<ExplorerSkeleton />}>
        <ExplorerClient />
      </Suspense>
    </main>
  );
}

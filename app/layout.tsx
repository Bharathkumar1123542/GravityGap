// app/layout.tsx — root layout: Header, Banner, main, Footer + CompareProvider
// spec §6.1; FR-EXP-04; FR-UI-01; NFR-A11Y landmarks
import type { Metadata } from "next";
import "@/app/globals.css";
import Header from "@/components/Header";
import Banner from "@/components/Banner";
import Footer from "@/components/Footer";
import { CompareProvider } from "@/components/CompareProvider";

export const metadata: Metadata = {
  title: "Flame in Freefall",
  description:
    "Rank 13 NASA PSI microgravity combustion investigations by relevance to crew environments.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-surface text-text font-sans min-h-screen flex flex-col">
        {/* Skip link — first focusable element (NFR-A11Y-02) */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-1 focus:bg-accent focus:text-on-accent focus:rounded-control"
        >
          Skip to main content
        </a>
        <CompareProvider>
          <Header />
          <Banner />
          <main id="main" className="flex-1 w-full max-w-content mx-auto px-4 md:px-8 py-6">
            {children}
          </main>
          <Footer />
        </CompareProvider>
      </body>
    </html>
  );
}

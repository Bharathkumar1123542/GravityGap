// components/Header.tsx — primary navigation (FR-UI-01; spec §6.1)
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Explorer" },
  { href: "/compare", label: "Compare" },
  { href: "/ask", label: "Ask AI" },
  { href: "/earth", label: "Earth" },
  { href: "/about", label: "About" },
];

export default function Header() {
  const pathname = usePathname();
  return (
    <header className="w-full border-b border-border bg-surface-raised">
      <div className="max-w-content mx-auto px-4 md:px-8 h-14 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="text-accent font-semibold text-lg tracking-tight whitespace-nowrap"
        >
          Flame in Freefall
        </Link>
        <nav aria-label="Primary">
          <ul className="flex items-center gap-1 flex-wrap">
            {NAV.map(({ href, label }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`px-3 py-1.5 rounded-control text-sm transition-colors
                      ${active
                        ? "bg-accent text-on-accent font-medium"
                        : "text-text-muted hover:text-text hover:bg-surface"
                      }`}
                    aria-current={active ? "page" : undefined}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}

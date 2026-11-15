// components/StatusBadge.tsx — verification status display (FR-EXP-05; spec §5.4)
// Icon + text; never color alone. aria-label for screen readers.
import type { Verification } from "@/lib/schema";

const CONFIG: Record<Verification, { icon: string; label: string; className: string }> = {
  verified: {
    icon: "✓",
    label: "verified",
    className: "text-status-verified",
  },
  unverified: {
    icon: "?",
    label: "unverified",
    className: "text-status-unverified",
  },
  not_available: {
    icon: "–",
    label: "not available",
    className: "text-status-na",
  },
};

export default function StatusBadge({ status }: { status: Verification }) {
  const { icon, label, className } = CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1 text-badge uppercase tracking-wider font-medium ${className}`}
      aria-label={`Status: ${label}`}
    >
      <span aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </span>
  );
}

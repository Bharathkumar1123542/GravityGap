// components/PillarChip.tsx — pillar label chip (spec §5.4; FR-EXP-05)
export type PillarValue = "prevention" | "detection" | "suppression" | "unassigned";

const LABELS: Record<PillarValue, string> = {
  prevention: "Prevention",
  detection: "Detection",
  suppression: "Suppression",
  unassigned: "Unassigned",
};

export default function PillarChip({ pillar }: { pillar: PillarValue }) {
  return (
    <span className="inline-block px-2 py-0.5 text-badge uppercase tracking-wider rounded-chip border border-border-strong bg-surface-raised text-text-muted">
      {LABELS[pillar]}
    </span>
  );
}

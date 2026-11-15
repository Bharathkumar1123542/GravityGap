import type { InvestigationRecord } from "@/lib/schema";
import { investigations } from "@/lib/data";

export function parseCompareIds(search: URLSearchParams): {
  valid: InvestigationRecord[];
  unknown: string[];
} {
  const raw = search.get("ids") ?? "";
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const valid: InvestigationRecord[] = [];
  const unknown: string[] = [];

  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    const record = investigations.find((r) => r.id === id);
    if (record) valid.push(record);
    else unknown.push(id);
  }

  if (valid.length > 4) {
    // keep first 4
    valid.splice(4);
  }

  return { valid, unknown };
}

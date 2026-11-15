// lib/data.ts — runtime data loading; spec §4.7
// Parsing at module load fails fast on invalid data files.
import raw from "@/data/investigations.json";
import rawEnv from "@/data/environments.json";
import rawEarth from "@/data/earth-applications.json";
import {
  InvestigationsFileSchema,
  EnvironmentsFileSchema,
  EarthApplicationsFileSchema,
} from "@/lib/schema";

export const investigations = InvestigationsFileSchema.parse(raw);
export const environments = EnvironmentsFileSchema.parse(rawEnv);
export const earthApplications = EarthApplicationsFileSchema.parse(rawEarth);

export const enabledEnvironments = environments.filter((e) => e.enabled);

export function getRecord(id: string) {
  return investigations.find((r) => r.id === id) ?? null;
}

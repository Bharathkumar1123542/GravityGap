// lib/server/ip.ts — IP extraction and salted hash (spec-addendum §8.9; NFR-PRV-02)
import crypto from "crypto";

export function extractIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

export function hashIp(ip: string): string {
  const salt = process.env.IP_SALT ?? "default-salt-change-me";
  return crypto.createHmac("sha256", salt).update(ip).digest("hex");
}

// lib/server/log.ts — structured request logging (spec-addendum §8.9; NFR-PRV-02)
// NEVER log question text, answer text, or model content.
import crypto from "crypto";
import { hashIp } from "@/lib/server/ip";

export function logRequest(opts: {
  ip: string;
  httpStatus: number;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
}): void {
  console.log(
    JSON.stringify({
      request_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ip_hash: hashIp(opts.ip),
      http_status: opts.httpStatus,
      latency_ms: opts.latencyMs,
      input_tokens: opts.inputTokens ?? null,
      output_tokens: opts.outputTokens ?? null,
    })
  );
}

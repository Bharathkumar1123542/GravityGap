// app/api/ask/route.ts — POST /api/ask (spec-addendum §8.10)
// FR-AI-02; NFR-SEC-03; NFR-SEC-04; NFR-SEC-07
export const runtime = "nodejs";
export const maxDuration = 30;

import { NextResponse } from "next/server";
import { z } from "zod";
import { investigations, environments } from "@/lib/data";
import { runPipeline } from "@/lib/ai/pipeline";
import { extractIp } from "@/lib/server/ip";
import { checkRateLimit } from "@/lib/server/ratelimit";
import { logRequest } from "@/lib/server/log";

const BodySchema = z.object({
  question: z
    .string()
    // Strip control characters
    .transform((s) => s.replace(/[\x00-\x1F\x7F]/g, " ").trim())
    .pipe(z.string().min(5, "too_short").max(500, "too_long")),
});

export async function POST(request: Request): Promise<Response> {
  const start = Date.now();
  const ip = extractIp(request);

  // 1. Parse and validate body
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "question must be 5 to 500 characters" },
      { status: 400 }
    );
  }
  const { question } = parsed.data;

  // 2. Rate limit check
  const rl = await checkRateLimit(ip);
  if (!rl.allowed) {
    logRequest({ ip, httpStatus: 429, latencyMs: Date.now() - start });
    return NextResponse.json(
      { error: "rate_limited", retryAfter: rl.retryAfter },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfter) },
      }
    );
  }

  // 3. Run pipeline
  const result = await runPipeline(question, investigations, environments);

  let httpStatus = 200;
  if (result.status === "error") {
    httpStatus = result.httpStatus;
  }

  logRequest({ ip, httpStatus, latencyMs: Date.now() - start });

  if (result.status === "error") {
    return NextResponse.json({ error: result.message }, { status: httpStatus });
  }

  return NextResponse.json(result, { status: 200 });
}

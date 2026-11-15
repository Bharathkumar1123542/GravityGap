// lib/ai/client.ts — Gemini API client with 25 s timeout and schema constraint
// spec-addendum §8.1; FR-AI-02; NFR-REL-03
import { GoogleGenAI } from "@google/genai";
import { AiResponseSchema, type AiResponse } from "@/lib/ai/response-schema";
import { SYSTEM_PROMPT } from "@/lib/ai/system-prompt";
import zodToJsonSchema from "zod-to-json-schema";

const TIMEOUT_MS = 25_000;

export type ClientResult =
  | { ok: true; data: AiResponse }
  | {
      ok: false;
      error: "timeout" | "quota" | "server_error" | "schema_error";
      message: string;
    };

export async function callGemini(
  question: string,
  contextPayload: string,
  retryErrors?: string[]
): Promise<ClientResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

  if (!apiKey) {
    return { ok: false, error: "server_error", message: "GEMINI_API_KEY not configured" };
  }

  const ai = new GoogleGenAI({ apiKey });
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const userContent =
      retryErrors && retryErrors.length > 0
        ? `${question}\n\nPrevious response had these validation errors — please correct them:\n${retryErrors.join("\n")}`
        : question;

    const responseSchema = zodToJsonSchema(AiResponseSchema, {
      name: "AiResponse",
      $refStrategy: "none",
    });

    const prompt = `${SYSTEM_PROMPT}\n\nINVESTIGATION DATA:\n${contextPayload}\n\nQUESTION: ${userContent}`;

    const response = await ai.models.generateContent({
      model,
      config: {
        temperature: 0,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
        responseSchema,
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    clearTimeout(timeoutId);

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return { ok: false, error: "schema_error", message: "Empty response from model" };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { ok: false, error: "schema_error", message: "Model response is not valid JSON" };
    }

    const result = AiResponseSchema.safeParse(parsed);
    if (!result.success) {
      return {
        ok: false,
        error: "schema_error",
        message: result.error.issues.map((i) => i.message).join("; "),
      };
    }

    return { ok: true, data: result.data };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        return { ok: false, error: "timeout", message: "Gemini request timed out after 25 s" };
      }
      if (err.message.includes("429") || err.message.toLowerCase().includes("quota")) {
        return { ok: false, error: "quota", message: err.message };
      }
    }
    return { ok: false, error: "server_error", message: String(err) };
  }
}

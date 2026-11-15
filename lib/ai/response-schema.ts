// lib/ai/response-schema.ts — Zod schema for the Gemini response (spec-addendum §8.3)
// FR-AI-03; NFR-SEC-04
import { z } from "zod";
import { RECORD_IDS, VERIFIABLE_FIELDS } from "@/lib/schema";

export const ClaimSchema = z.object({
  record_id: z.enum(RECORD_IDS),
  field: z.enum(VERIFIABLE_FIELDS),
  value: z.string(),
});

export const ParagraphSchema = z.object({
  text: z.string().min(1).max(2000),
  claims: z.array(ClaimSchema).min(1),
});

export const AiResponseSchema = z.object({
  status: z.enum(["answered", "no_data", "out_of_scope"]),
  no_data_reason: z.enum(["partial_gravity", "not_in_dataset"]).nullable(),
  answer: z.array(ParagraphSchema),
  extrapolation: z.boolean(),
});

export type AiResponse = z.infer<typeof AiResponseSchema>;
export type Paragraph = z.infer<typeof ParagraphSchema>;
export type Claim = z.infer<typeof ClaimSchema>;

export const COPY = {
  "banner.gap": "No partial-gravity combustion data exists in PSI. Moon-related results are extrapolations from microgravity and normal-gravity tests.",
  "footer.disclaimer": "Independent project for the NASA Space Apps Challenge. Not affiliated with or endorsed by NASA.",
  "badge.extrapolation_rank": "Extrapolation: no partial-gravity data",
  "badge.extrapolation_answer": "Extrapolation, not measured in partial gravity",
  "rank.zero_weights": "Set at least one weight above 0 to rank",
  "explorer.empty": "No investigations match",
  "compare.max": "Compare up to 4 investigations",
  "compare.min": "Select at least 2 investigations",
  "compare.unknown_id": "Unknown id skipped:",
  "ask.length": "Enter a question of 5 to 500 characters.",
  "ask.loading": "Checking the curated records\u2026",
  "ask.gemini_notice": "Questions are sent to Google's Gemini API.",
  "ai.no_data_partial_gravity": "No partial-gravity combustion data is available in PSI. The records here cover microgravity and normal gravity only.",
  "ai.no_data_not_in_dataset": "No curated investigation matches this question.",
  "ai.out_of_scope": "This tool answers questions about the curated microgravity combustion investigations only.",
  "ai.unavailable": "The AI layer is unavailable. The Explorer, Compare and Export features still work.",
  "ai.rate_limited": "Too many questions. Try again in",
  "ai.no_verified_answer": "No verified answer could be produced for this question. Try rephrasing or browse the Explorer.",
  "export.empty": "No records to export",
  "export.data_notice": "Hand-curated from NASA PSI and cited sources. Check each field's status. PSI holds no partial-gravity combustion data.",
  "earth.no_link": "No verified investigation link yet.",
  "coverage.partial_gravity": "No partial-gravity data",
} as const;

export type CopyKey = keyof typeof COPY;

export function copy(key: CopyKey): string {
  return COPY[key];
}

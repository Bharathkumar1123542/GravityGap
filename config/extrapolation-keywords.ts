// Keywords that force extrapolation: true on any answer, regardless of model output.
// The server lowercases the question and checks for any substring match.
// FR-AI-08; spec addendum §8.7
export const EXTRAPOLATION_KEYWORDS: readonly string[] = [
  "moon",
  "lunar",
  "partial gravity",
  "partial-gravity",
  "mars",
  "martian",
  "rover",
  "1/6 gravity",
  "low gravity",
  "reduced gravity",
  "moon base",
  "moon habitat",
  "lunar habitat",
  "lunar base",
  "moon surface",
];

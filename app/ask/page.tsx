"use client";
// app/ask/page.tsx — AI Q&A interface
// spec §8 — FR-AI-01 to FR-AI-12
import { useState } from "react";
import { COPY } from "@/lib/copy";

const SUGGESTED_QUESTIONS = [
  "Which tests used 30% O2 or more with solid fuels?",
  "Which investigation used CO2 and helium dilution?",
  "Which investigations are most relevant to a Moon habitat?",
  "Compare BASS and BASS-II.",
];

export default function AskPage() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 5 || trimmed.length > 500) {
      setError(COPY["ask.length"]);
      return;
    }

    setLoading(true);
    setError(null);
    setAnswer(null);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After") || "60";
        setError(`${COPY["ai.rate_limited"]} ${retryAfter} seconds.`);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        setError(COPY["ai.unavailable"]);
        setLoading(false);
        return;
      }

      const data = await response.json();
      
      if (data.status === "no_data") {
        setAnswer(COPY["ai.no_data_partial_gravity"]);
      } else if (data.status === "out_of_scope") {
        setAnswer(COPY["ai.out_of_scope"]);
      } else if (data.status === "no_verified_answer") {
        setAnswer(COPY["ai.no_verified_answer"]);
      } else if (data.status === "answered" && data.answer) {
        // Simple text display for now
        const text = data.answer.map((p: { text: string }) => p.text).join("\n\n");
        setAnswer(text);
      } else {
        setAnswer("Received an unexpected response format.");
      }
    } catch {
      setError(COPY["ai.unavailable"]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main id="main" className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
      <h1 className="text-3xl font-bold text-text mb-6">Ask the Curated Records</h1>

      <div className="bg-warning-surface border border-warning rounded-lg p-4 mb-6">
        <p className="text-warning-text text-sm">{COPY["ask.gemini_notice"]}</p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="question" className="sr-only">
            Your question
          </label>
          <textarea
            id="question"
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(question);
              }
            }}
            placeholder="Ask a question about the investigations..."
            disabled={loading}
            className="w-full px-4 py-3 bg-surface-raised border border-border-strong rounded text-text placeholder:text-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-focus disabled:opacity-50"
          />
          {error && (
            <p className="mt-2 text-sm text-danger" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSubmit(question)}
            disabled={loading}
            className="px-6 py-2 bg-accent text-on-accent rounded font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-focus disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? COPY["ask.loading"] : "Ask"}
          </button>
        </div>

        <div>
          <p className="text-sm text-text-muted mb-2">Try:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((sq, i) => (
              <button
                key={i}
                onClick={() => {
                  setQuestion(sq);
                  handleSubmit(sq);
                }}
                disabled={loading}
                className="px-3 py-1.5 bg-surface-raised border border-border-strong rounded text-sm text-text hover:bg-surface focus:outline-none focus:ring-2 focus:ring-focus disabled:opacity-50"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>
      </div>

      {answer && (
        <div className="mt-8 bg-surface-raised rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-text mb-4">Answer</h2>
          <div className="text-text whitespace-pre-wrap leading-relaxed">
            {answer}
          </div>
        </div>
      )}
    </main>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import type { BudgetData } from "@/lib/budget-schema";
import { deriveSectionTitle } from "@/lib/section-title";
import type { PinnedSection } from "./PinnedSections";

type Message = {
  role: "user" | "assistant";
  content: string;
  /** For assistant messages, the question that produced this answer. */
  question?: string;
};

const SUGGESTIONS = [
  "What is the total budget?",
  "How much is allocated to public safety?",
  "What are the largest sources of revenue?",
  "What changed the most compared to last year?",
];

/** Rate limits to keep API usage in check (no backend/persistence needed). */
const COOLDOWN_MS = 2000;
const MAX_QUESTIONS = 20;

export default function ChatPanel({
  budget,
  text,
  onPin,
  pinnedIds,
}: {
  budget: BudgetData;
  text: string;
  onPin: (section: PinnedSection) => void;
  pinnedIds: Set<string>;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(false);
  const [askedCount, setAskedCount] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);

  const atLimit = askedCount >= MAX_QUESTIONS;

  useEffect(() => {
    // Guard scrollIntoView: not available in all environments (e.g. jsdom).
    endRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [messages, loading]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || loading || cooldown || atLimit) return;
    setError(null);
    setMessages((m) => [...m, { role: "user", content: q }]);
    setInput("");
    setLoading(true);
    setAskedCount((n) => n + 1);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, budget, text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.answer, question: q },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
      // Start the cooldown window after each attempt.
      setCooldown(true);
      setTimeout(() => setCooldown(false), COOLDOWN_MS);
    }
  }

  function pin(message: Message) {
    if (!message.question) return;
    const id = `pin-${message.question.toLowerCase().replace(/\s+/g, "-").slice(0, 60)}`;
    onPin({
      id,
      title: deriveSectionTitle(message.question),
      question: message.question,
      answer: message.content,
    });
  }

  const inputDisabled = loading || atLimit;

  return (
    <div className="flex h-[70vh] max-h-[640px] min-h-[420px] flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-4">
        <h3 className="text-base font-semibold text-slate-700">
          Ask about this budget
        </h3>
        <p className="text-xs text-slate-400">
          Answers come only from the uploaded document. Pin an answer to add it
          as a section.
        </p>
      </div>

      <div
        className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4"
        aria-live="polite"
      >
        {messages.length === 0 && !loading && (
          <div className="space-y-2">
            <p className="text-sm text-slate-500">Try asking:</p>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => ask(s)}
                className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-sm text-slate-600 hover:border-brand hover:bg-blue-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => {
          const pinId = m.question
            ? `pin-${m.question.toLowerCase().replace(/\s+/g, "-").slice(0, 60)}`
            : "";
          const alreadyPinned = !!pinId && pinnedIds.has(pinId);
          return (
            <div
              key={i}
              className={m.role === "user" ? "text-right" : "text-left"}
            >
              <span
                className={`inline-block max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-brand text-white"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                {m.content}
              </span>
              {m.role === "assistant" && m.question && (
                <div className="mt-1">
                  <button
                    onClick={() => pin(m)}
                    disabled={alreadyPinned}
                    className="text-xs font-medium text-brand hover:text-brand-dark disabled:text-slate-400"
                  >
                    {alreadyPinned ? "✓ Pinned as section" : "📌 Pin as section"}
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="text-left">
            <span className="inline-block rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-500">
              Thinking…
            </span>
          </div>
        )}

        {error && (
          <p className="text-sm text-rose-600" role="alert">
            {error}
          </p>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="border-t border-slate-100 p-4"
      >
        <div className="flex gap-2">
          <label htmlFor="chat-input" className="sr-only">
            Ask a question about the budget
          </label>
          <input
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              atLimit
                ? "Question limit reached for this session"
                : "e.g. How much goes to the fire department?"
            }
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-slate-50"
            disabled={inputDisabled}
          />
          <button
            type="submit"
            disabled={loading || cooldown || atLimit || !input.trim()}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            Ask
          </button>
        </div>
        {atLimit ? (
          <p className="mt-2 text-xs text-slate-400">
            You&apos;ve reached {MAX_QUESTIONS} questions this session.
          </p>
        ) : (
          <p className="mt-2 text-xs text-slate-400">
            {MAX_QUESTIONS - askedCount} questions left this session.
          </p>
        )}
      </form>
    </div>
  );
}

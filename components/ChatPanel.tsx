"use client";

import { useState, useRef, useEffect } from "react";
import type { BudgetData } from "@/lib/budget-schema";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What is the total budget?",
  "How much is allocated to public safety?",
  "What are the largest sources of revenue?",
  "What changed the most compared to last year?",
];

export default function ChatPanel({
  budget,
  text,
}: {
  budget: BudgetData;
  text: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Guard scrollIntoView: not available in all environments (e.g. jsdom).
    endRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [messages, loading]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || loading) return;
    setError(null);
    setMessages((m) => [...m, { role: "user", content: q }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, budget, text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setMessages((m) => [...m, { role: "assistant", content: data.answer }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-4">
        <h3 className="text-base font-semibold text-slate-700">
          Ask about this budget
        </h3>
        <p className="text-xs text-slate-400">
          Answers come only from the uploaded document.
        </p>
      </div>

      <div
        className="flex-1 space-y-3 overflow-y-auto p-4"
        aria-live="polite"
        style={{ minHeight: 240, maxHeight: 420 }}
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

        {messages.map((m, i) => (
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
          </div>
        ))}

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
        className="flex gap-2 border-t border-slate-100 p-4"
      >
        <label htmlFor="chat-input" className="sr-only">
          Ask a question about the budget
        </label>
        <input
          id="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. How much goes to the fire department?"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-blue-200"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          Ask
        </button>
      </form>
    </div>
  );
}

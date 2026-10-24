/**
 * Derive a short, human-readable section title from a chat question.
 * Entirely client-side (no API call). Strips common filler/question words,
 * title-cases the remainder, and caps the length so pinned cards get a tidy
 * heading like "Taxes" from "Is there anything about taxes?".
 */

const FILLER = new Set([
  "a",
  "об", // stray non-ascii safety; harmless
  "about",
  "any",
  "anything",
  "are",
  "can",
  "could",
  "did",
  "do",
  "does",
  "for",
  "give",
  "how",
  "in",
  "info",
  "information",
  "is",
  "it",
  "me",
  "much",
  "of",
  "on",
  "please",
  "regarding",
  "show",
  "tell",
  "the",
  "there",
  "this",
  "to",
  "us",
  "what",
  "whats",
  "when",
  "where",
  "which",
  "who",
  "why",
  "will",
  "would",
  "you",
  "your",
  "budget",
]);

export function deriveSectionTitle(question: string): string {
  const cleaned = (question || "").trim();
  if (!cleaned) return "Question";

  // Tokenize on non-word characters, drop filler and very short tokens.
  const words = cleaned
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0);

  const keywords = words.filter((w) => !FILLER.has(w) && w.length > 1);

  // Fall back to the first few non-filler words, or the raw question.
  const chosen = (keywords.length > 0 ? keywords : words).slice(0, 4);
  if (chosen.length === 0) return "Question";

  const title = chosen
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  // Keep headings tidy.
  return title.length > 40 ? `${title.slice(0, 40).trimEnd()}…` : title;
}

"use client";

export type PinnedSection = {
  id: string;
  title: string;
  question: string;
  answer: string;
};

export default function PinnedSections({
  sections,
  onRemove,
}: {
  sections: PinnedSection[];
  onRemove: (id: string) => void;
}) {
  if (sections.length === 0) return null;

  return (
    <section aria-label="Pinned questions" className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-800">
        Your Questions
      </h2>
      {sections.map((s) => (
        <div
          key={s.id}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-brand-dark">
                {s.title}
              </h3>
              <p className="mt-0.5 text-xs text-slate-400">
                Asked: {s.question}
              </p>
            </div>
            <button
              onClick={() => onRemove(s.id)}
              aria-label={`Remove ${s.title} section`}
              className="shrink-0 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50"
            >
              Remove
            </button>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
            {s.answer}
          </p>
        </div>
      ))}
    </section>
  );
}

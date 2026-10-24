"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export type PinnedSection = {
  id: string;
  title: string;
  /** The question that produced a pinned answer; absent for custom sections. */
  question?: string;
  /** The section body (answer text, or user-authored notes/lists). */
  answer: string;
};

export default function PinnedSections({
  sections,
  onChange,
}: {
  sections: PinnedSection[];
  onChange: (next: PinnedSection[]) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onChange(arrayMove(sections, oldIndex, newIndex));
  }

  function updateSection(id: string, patch: Partial<PinnedSection>) {
    onChange(sections.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function removeSection(id: string) {
    onChange(sections.filter((s) => s.id !== id));
  }

  function addCustomSection() {
    const id = `custom-${Date.now()}`;
    onChange([
      ...sections,
      { id, title: "New Section", answer: "" },
    ]);
  }

  return (
    <section aria-label="Your sections" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Your Sections</h2>
        <button
          onClick={addCustomSection}
          className="no-print rounded-lg border border-brand px-3 py-1.5 text-sm font-medium text-brand hover:bg-blue-50"
        >
          + Add section
        </button>
      </div>

      {sections.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
          Pin an answer from the chat, or add a section, to build your report.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <SortableContext
            items={sections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {sections.map((s) => (
                <SortableCard
                  key={s.id}
                  section={s}
                  onUpdate={updateSection}
                  onRemove={removeSection}
                  collapsed={activeId !== null && activeId !== s.id}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
}

function SortableCard({
  section,
  onUpdate,
  onRemove,
  collapsed,
}: {
  section: PinnedSection;
  onUpdate: (id: string, patch: Partial<PinnedSection>) => void;
  onRemove: (id: string) => void;
  /** True when another card is being dragged — show just this card's header. */
  collapsed: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id });
  const [editing, setEditing] = useState(section.answer === "");

  const style = {
    // Translate only (not Transform): CSS.Transform injects scaleX/scaleY when
    // sortable items differ in height, which visibly stretches the dragged card.
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <button
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder"
            className="no-print mt-0.5 cursor-grab text-slate-400 hover:text-slate-600 active:cursor-grabbing"
            title="Drag to reorder"
          >
            ⠿
          </button>
          <div className="min-w-0 flex-1">
            {editing ? (
              <input
                value={section.title}
                onChange={(e) => onUpdate(section.id, { title: e.target.value })}
                aria-label="Section title"
                className="w-full rounded border border-slate-300 px-2 py-1 text-base font-semibold text-brand-dark focus:border-brand focus:outline-none"
              />
            ) : (
              <h3 className="truncate text-base font-semibold text-brand-dark">
                {section.title}
              </h3>
            )}
            {section.question && (
              <p className="mt-0.5 text-xs text-slate-400">
                Asked: {section.question}
              </p>
            )}
          </div>
        </div>

        <div className="no-print flex shrink-0 gap-2">
          <button
            onClick={() => setEditing((v) => !v)}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50"
          >
            {editing ? "Done" : "Edit"}
          </button>
          <button
            onClick={() => onRemove(section.id)}
            aria-label={`Remove ${section.title} section`}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50"
          >
            Remove
          </button>
        </div>
      </div>

      {/* While another card is being dragged, collapse to just the header. */}
      {collapsed ? null : editing ? (
        <textarea
          value={section.answer}
          onChange={(e) => onUpdate(section.id, { answer: e.target.value })}
          aria-label="Section content"
          rows={Math.max(3, section.answer.split("\n").length)}
          placeholder="Write notes, a list, or any content…"
          className="mt-3 w-full resize-y rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-brand focus:outline-none"
        />
      ) : (
        section.answer && (
          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
            {section.answer}
          </p>
        )
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import {
  useCategories,
  useCreateCategory,
  useCreateLog,
  useUpdateLog,
} from "@/lib/queries";
import type { Log } from "@/lib/types";
import { COLOR_PALETTE } from "@/lib/defaults";
import { cn } from "@/lib/utils";

export function LogForm({
  initial,
  defaultDate,
  onCancel,
  onSaved,
}: {
  initial?: Log;
  defaultDate: string;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { data: categories = [] } = useCategories();
  const createLog = useCreateLog();
  const updateLog = useUpdateLog();
  const createCategory = useCreateCategory();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const usedColors = new Set(categories.map((c) => c.color));
  const nextColor =
    COLOR_PALETTE.find((c) => !usedColors.has(c)) ??
    COLOR_PALETTE[categories.length % COLOR_PALETTE.length];
  const [newCatColor, setNewCatColor] = useState(nextColor);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  useEffect(() => {
    if (!categoryId && categories[0]) setCategoryId(categories[0].id);
  }, [categoryId, categories]);
  const [date, setDate] = useState(initial?.date ?? defaultDate);
  const [startTime, setStartTime] = useState(initial?.startTime ?? "");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "");
  const [tagsRaw, setTagsRaw] = useState(initial?.tags.join(", ") ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !categoryId) return;
    const tags = tagsRaw
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      categoryId,
      date,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      tags,
    };
    setSubmitting(true);
    setError(null);
    try {
      if (initial) await updateLog.mutateAsync({ id: initial.id, data: payload });
      else await createLog.mutateAsync(payload);
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function submitNewCategory() {
    if (!newCatName.trim()) return;
    try {
      const cat = await createCategory.mutateAsync({
        name: newCatName.trim(),
        color: newCatColor,
      });
      setCategoryId(cat.id);
      setNewCatName("");
      setCreatingCategory(false);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 animate-in">
      <div>
        <Label>Title</Label>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Push Day Workout"
          className={inputCls}
        />
      </div>

      <div>
        <Label>Category</Label>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => {
            const active = c.id === categoryId;
            return (
              <button
                type="button"
                key={c.id}
                onClick={() => setCategoryId(c.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition",
                  active
                    ? "border-transparent text-white"
                    : "border-border text-subtle hover:bg-muted"
                )}
                style={
                  active ? { background: c.color } : { background: "transparent" }
                }
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: c.color }}
                />
                {c.name}
              </button>
            );
          })}
          {!creatingCategory && (
            <button
              type="button"
              onClick={() => setCreatingCategory(true)}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-subtle hover:bg-muted hover:text-fg transition"
            >
              <Plus size={12} /> New
            </button>
          )}
        </div>

        {creatingCategory && (
          <div className="mt-2 rounded-lg border border-border bg-muted/40 p-3 space-y-2 animate-in">
            <input
              autoFocus
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitNewCategory();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  setCreatingCategory(false);
                  setNewCatName("");
                }
              }}
              placeholder="Category name"
              className={inputCls}
            />
            <div className="flex flex-wrap gap-1.5">
              {COLOR_PALETTE.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setNewCatColor(hex)}
                  aria-label={hex}
                  className={cn(
                    "h-6 w-6 rounded-full ring-offset-2 ring-offset-surface transition",
                    newCatColor === hex && "ring-2 ring-fg"
                  )}
                  style={{ background: hex }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={submitNewCategory}
                disabled={!newCatName.trim() || createCategory.isPending}
                className="rounded-md bg-fg text-bg px-3 py-1.5 text-xs font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {createCategory.isPending ? "Creating…" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreatingCategory(false);
                  setNewCatName("");
                }}
                className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-3">
          <Label>Date</Label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="col-span-1">
          <Label>Start</Label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="col-span-1">
          <Label>End</Label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="col-span-1">
          <Label>&nbsp;</Label>
          <button
            type="button"
            onClick={() => {
              setStartTime("");
              setEndTime("");
            }}
            className="w-full h-[38px] rounded-lg border border-border text-xs text-subtle hover:bg-muted transition"
          >
            Clear
          </button>
        </div>
      </div>

      <div>
        <Label>Notes</Label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Optional notes (markdown supported)"
          className={cn(inputCls, "resize-y min-h-[80px]")}
        />
      </div>

      <div>
        <Label>Tags</Label>
        <input
          value={tagsRaw}
          onChange={(e) => setTagsRaw(e.target.value)}
          placeholder="comma, separated, tags"
          className={inputCls}
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-500">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2 pt-2">
        <button
          type="submit"
          disabled={submitting || !categoryId}
          className="flex-1 rounded-lg bg-fg text-bg px-3 py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {submitting
            ? "Saving…"
            : initial
            ? "Save changes"
            : "Add log"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] uppercase tracking-wide text-subtle mb-1">
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent transition";

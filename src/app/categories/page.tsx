"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useLogs,
  useUpdateCategory,
} from "@/lib/queries";
import type { Category } from "@/lib/types";
import { useRouter } from "next/navigation";
import { COLOR_PALETTE } from "@/lib/defaults";
import { cn } from "@/lib/utils";
import { useUi } from "@/lib/store";

export default function CategoriesPage() {
  const router = useRouter();
  const { data: categories = [], isPending } = useCategories();
  const { data: logs = [] } = useLogs();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const counts = new Map<string, number>();
  for (const l of logs) counts.set(l.categoryId, (counts.get(l.categoryId) ?? 0) + 1);

  const handleCategoryClick = (categoryId: string) => {
    useUi.setState({
      search: "",
      filterCategoryIds: [categoryId],
      filterTags: [],
      filterRange: { from: null, to: null },
    });
    router.push("/search");
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-sm text-subtle">Settings</div>
          <h1 className="text-3xl font-semibold tracking-tight">Categories</h1>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setCreating(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-fg text-bg px-3 py-1.5 text-sm font-medium hover:opacity-90 transition"
        >
          <Plus size={14} /> New category
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-500">
          {error}
        </div>
      )}

      {(creating || editing) && (
        <CategoryEditor
          initial={editing ?? undefined}
          submitting={createCategory.isPending || updateCategory.isPending}
          onCancel={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSubmit={async (payload) => {
            setError(null);
            try {
              if (editing)
                await updateCategory.mutateAsync({ id: editing.id, data: payload });
              else await createCategory.mutateAsync(payload);
              setEditing(null);
              setCreating(false);
            } catch (err) {
              setError((err as Error).message);
            }
          }}
        />
      )}

      {isPending && categories.length === 0 && (
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[72px] rounded-xl border border-border bg-muted/40 animate-pulse"
            />
          ))}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        {categories.map((c) => (
          <motion.div
            key={c.id}
            layout
            onClick={() => handleCategoryClick(c.id)}
            className="cursor-pointer rounded-xl border border-border bg-surface p-4 flex items-center gap-3 hover:shadow-soft hover:border-accent/50 active:scale-[0.99] transition"
          >
            <div
              className="h-10 w-10 rounded-lg shrink-0"
              style={{ background: c.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{c.name}</div>
              <div className="text-xs text-subtle">
                {counts.get(c.id) ?? 0} logs
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCreating(false);
                setEditing(c);
              }}
              className="h-8 w-8 grid place-items-center rounded-md text-subtle hover:bg-muted transition"
              aria-label="Edit"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={async (e) => {
                e.stopPropagation();
                if (categories.length === 1) {
                  alert("Keep at least one category.");
                  return;
                }
                if (
                  !confirm(
                    `Delete "${c.name}"? Existing logs will be moved to another category.`
                  )
                )
                  return;
                setError(null);
                try {
                  await deleteCategory.mutateAsync(c.id);
                } catch (err) {
                  setError((err as Error).message);
                }
              }}
              className="h-8 w-8 grid place-items-center rounded-md text-subtle hover:bg-muted hover:text-red-500 transition"
              aria-label="Delete"
            >
              <Trash2 size={14} />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function CategoryEditor({
  initial,
  submitting,
  onCancel,
  onSubmit,
}: {
  initial?: Category;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (data: Omit<Category, "id">) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState(initial?.color ?? COLOR_PALETTE[0]);

  return (
    <div className="rounded-xl border border-border bg-surface shadow-soft p-4 mb-5 animate-in">
      <div className="flex items-center justify-between mb-3">
        <div className="font-medium">
          {initial ? "Edit category" : "New category"}
        </div>
        <button
          onClick={onCancel}
          className="h-7 w-7 grid place-items-center rounded-md text-subtle hover:bg-muted transition"
          aria-label="Close"
        >
          <X size={14} />
        </button>
      </div>
      <div className="space-y-3">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-subtle mb-1">
            Name
          </div>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Meditation"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent transition"
          />
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-subtle mb-1">
            Color
          </div>
          <div className="flex flex-wrap gap-2">
            {COLOR_PALETTE.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => setColor(hex)}
                aria-label={hex}
                className={cn(
                  "h-7 w-7 rounded-full ring-offset-2 ring-offset-surface transition",
                  color === hex && "ring-2 ring-fg"
                )}
                style={{ background: hex }}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => {
              if (!name.trim()) return;
              onSubmit({ name: name.trim(), color });
            }}
            disabled={submitting}
            className="flex-1 rounded-lg bg-fg text-bg px-3 py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {submitting ? "Saving…" : initial ? "Save changes" : "Create"}
          </button>
          <button
            onClick={onCancel}
            className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

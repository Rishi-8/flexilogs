"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import { Copy, Pencil, Plus, Trash2, X } from "lucide-react";
import { useCategories, useDeleteLog, useDuplicateLog, useLogs } from "@/lib/queries";
import { categoriesById, logsForDate } from "@/lib/selectors";
import type { Log } from "@/lib/types";
import { cn, parseIsoDate, withAlpha } from "@/lib/utils";
import { LogForm } from "./log-form";

export function DayPanel({
  date,
  onClose,
}: {
  date: string | null;
  onClose: () => void;
}) {
  const [editing, setEditing] = useState<Log | null>(null);
  const [creating, setCreating] = useState(false);

  const open = !!date;

  useEffect(() => {
    if (!open) {
      setEditing(null);
      setCreating(false);
    }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && date && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-40"
            onClick={onClose}
          />
          <motion.aside
            key="panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[440px] bg-surface border-l border-border shadow-pop flex flex-col"
          >
            <PanelBody
              date={date}
              editing={editing}
              creating={creating}
              onCreate={() => setCreating(true)}
              onEdit={(l) => setEditing(l)}
              onCancel={() => {
                setEditing(null);
                setCreating(false);
              }}
              onClose={onClose}
            />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function PanelBody({
  date,
  editing,
  creating,
  onCreate,
  onEdit,
  onCancel,
  onClose,
}: {
  date: string;
  editing: Log | null;
  creating: boolean;
  onCreate: () => void;
  onEdit: (l: Log) => void;
  onCancel: () => void;
  onClose: () => void;
}) {
  const { data: dayLogs = [], isPending } = useLogs({ from: date, to: date });
  const logs = logsForDate(dayLogs, date);
  const { data: categories = [] } = useCategories();
  const cats = categoriesById(categories);
  const deleteLog = useDeleteLog();
  const duplicateLog = useDuplicateLog();

  const showForm = creating || !!editing;
  const dateObj = parseIsoDate(date);

  return (
    <>
      <div className="flex items-start justify-between p-5 border-b border-border">
        <div>
          <div className="text-xs uppercase tracking-wide text-subtle">
            {format(dateObj, "EEEE")}
          </div>
          <div className="text-2xl font-semibold tracking-tight">
            {format(dateObj, "MMM d, yyyy")}
          </div>
          <div className="text-xs text-subtle mt-1">
            {logs.length} {logs.length === 1 ? "log" : "logs"}
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="rounded-lg border border-border h-9 w-9 grid place-items-center hover:bg-muted transition"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {showForm ? (
          <LogForm
            initial={editing ?? undefined}
            defaultDate={date}
            onCancel={onCancel}
            onSaved={onCancel}
          />
        ) : (
          <>
            {isPending ? (
              <DaySkeleton />
            ) : logs.length === 0 ? (
              <EmptyDay onCreate={onCreate} />
            ) : (
              logs.map((l) => {
                const c = cats[l.categoryId];
                return (
                  <motion.div
                    key={l.id}
                    layout
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "rounded-xl border border-border bg-elevated p-4 hover:shadow-soft transition"
                    )}
                    style={{
                      borderLeft: `3px solid ${c?.color ?? "#888"}`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                            style={{
                              background: withAlpha(c?.color ?? "#888", 0.12),
                              color: c?.color ?? "#888",
                            }}
                          >
                            {c?.name ?? "Uncategorized"}
                          </span>
                          {(l.startTime || l.endTime) && (
                            <span className="text-[11px] text-subtle">
                              {l.startTime}
                              {l.endTime ? `–${l.endTime}` : ""}
                            </span>
                          )}
                        </div>
                        <div className="font-medium mt-1.5 truncate">
                          {l.title}
                        </div>
                        {l.description && (
                          <p className="text-sm text-subtle mt-1 whitespace-pre-wrap break-words">
                            {l.description}
                          </p>
                        )}
                        {l.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {l.tags.map((t) => (
                              <span
                                key={t}
                                className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-muted text-subtle"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <IconBtn label="Edit" onClick={() => onEdit(l)}>
                          <Pencil size={14} />
                        </IconBtn>
                        <IconBtn
                          label="Duplicate"
                          onClick={() => duplicateLog.mutate(l.id)}
                        >
                          <Copy size={14} />
                        </IconBtn>
                        <IconBtn
                          label="Delete"
                          onClick={() => deleteLog.mutate(l.id)}
                          danger
                        >
                          <Trash2 size={14} />
                        </IconBtn>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </>
        )}
      </div>

      {!showForm && (
        <div className="p-4 border-t border-border">
          <button
            onClick={onCreate}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-fg text-bg px-3 py-2.5 text-sm font-medium hover:opacity-90 transition"
          >
            <Plus size={16} /> Add log
          </button>
        </div>
      )}
    </>
  );
}

function IconBtn({
  children,
  onClick,
  label,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "h-7 w-7 grid place-items-center rounded-md text-subtle hover:bg-muted transition",
        danger && "hover:text-red-500"
      )}
    >
      {children}
    </button>
  );
}

function DaySkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-24 rounded-xl border border-border bg-muted/40 animate-pulse"
        />
      ))}
    </div>
  );
}

function EmptyDay({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto h-12 w-12 rounded-full bg-muted grid place-items-center mb-3">
        <Plus size={18} className="text-subtle" />
      </div>
      <div className="font-medium">Nothing logged yet</div>
      <div className="text-sm text-subtle">
        Tap below to capture what you did today.
      </div>
      <button
        onClick={onCreate}
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-fg text-bg px-3 py-1.5 text-sm font-medium hover:opacity-90 transition"
      >
        <Plus size={14} /> Add first log
      </button>
    </div>
  );
}

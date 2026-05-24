"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCategories, useLogs } from "@/lib/queries";
import { categoriesById } from "@/lib/selectors";
import { cn, isoDate, withAlpha } from "@/lib/utils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function Calendar({
  onPickDate,
}: {
  onPickDate: (d: string) => void;
}) {
  const [cursor, setCursor] = useState(() => new Date());

  const range = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return { from: isoDate(start), to: isoDate(end) };
  }, [cursor]);

  const { data: logs = [], isPending: logsLoading } = useLogs(range);
  const { data: categories = [] } = useCategories();
  const cats = useMemo(() => categoriesById(categories), [categories]);
  const today = new Date();

  const categoriesUsedThisMonth = useMemo(() => {
    const used = new Set<string>();
    for (const l of logs) {
      const d = new Date(l.date);
      if (
        d.getFullYear() === cursor.getFullYear() &&
        d.getMonth() === cursor.getMonth()
      ) {
        used.add(l.categoryId);
      }
    }
    return categories.filter((c) => used.has(c.id));
  }, [logs, categories, cursor]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    const out: Date[] = [];
    const d = new Date(start);
    while (d <= end) {
      out.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return out;
  }, [cursor]);

  const byDate = useMemo(() => {
    const m = new Map<string, { count: number; cats: string[] }>();
    for (const l of logs) {
      const cur = m.get(l.date) ?? { count: 0, cats: [] };
      cur.count += 1;
      if (!cur.cats.includes(l.categoryId)) cur.cats.push(l.categoryId);
      m.set(l.date, cur);
    }
    return m;
  }, [logs]);

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
        <div>
          <div className="text-sm text-subtle">Dashboard</div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            {format(cursor, "MMMM yyyy")}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCursor(new Date())}
            className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted transition"
          >
            Today
          </button>
          <button
            onClick={() => setCursor(subMonths(cursor, 1))}
            aria-label="Previous month"
            className="rounded-lg border border-border h-9 w-9 grid place-items-center hover:bg-muted transition"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setCursor(addMonths(cursor, 1))}
            aria-label="Next month"
            className="rounded-lg border border-border h-9 w-9 grid place-items-center hover:bg-muted transition"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => onPickDate(isoDate(today))}
            className="ml-2 inline-flex items-center gap-1.5 rounded-lg bg-fg text-bg px-3 py-1.5 text-sm font-medium hover:opacity-90 transition"
          >
            <Plus size={14} /> New log
          </button>
        </div>
      </div>

      {categoriesUsedThisMonth.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-3 text-xs text-subtle">
          <span className="uppercase tracking-wide text-[10px]">Legend</span>
          {categoriesUsedThisMonth.map((c) => (
            <span key={c.id} className="inline-flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: c.color }}
              />
              {c.name}
            </span>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-surface shadow-soft overflow-hidden">
        <div className="grid grid-cols-7 text-xs uppercase tracking-wide text-subtle border-b border-border">
          {WEEKDAYS.map((w) => (
            <div key={w} className="px-3 py-2.5">
              {w}
            </div>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={cursor.toISOString().slice(0, 7)}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="grid grid-cols-7"
          >
            {days.map((d) => {
              const iso = isoDate(d);
              const inMonth = isSameMonth(d, cursor);
              const isToday = isSameDay(d, today);
              const stat = byDate.get(iso);
              return (
                <button
                  key={iso}
                  onClick={() => onPickDate(iso)}
                  className={cn(
                    "group relative text-left h-24 md:h-28 px-2.5 py-2 border-t border-r border-border",
                    "transition hover:bg-muted/60",
                    !inMonth && "bg-bg/40 text-subtle"
                  )}
                  style={{
                    background:
                      stat && inMonth
                        ? `linear-gradient(180deg, transparent 0%, ${withAlpha(
                            cats[stat.cats[0]]?.color ?? "#888",
                            0.06
                          )} 100%)`
                        : undefined,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-full text-sm",
                        isToday
                          ? "bg-fg text-bg font-semibold"
                          : "text-fg"
                      )}
                    >
                      {format(d, "d")}
                    </span>
                    {stat && (
                      <span className="text-[10px] text-subtle font-medium">
                        {stat.count}
                      </span>
                    )}
                  </div>

                  {stat && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {stat.cats.slice(0, 5).map((cid) => {
                        const c = cats[cid];
                        if (!c) return null;
                        return (
                          <span
                            key={cid}
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ background: c.color }}
                            title={c.name}
                          />
                        );
                      })}
                      {stat.cats.length > 5 && (
                        <span className="text-[10px] text-subtle">
                          +{stat.cats.length - 5}
                        </span>
                      )}
                    </div>
                  )}

                  {stat && stat.count > 0 && (
                    <div className="absolute inset-x-2 bottom-1.5 hidden group-hover:block">
                      <div className="text-[10px] text-subtle truncate">
                        {stat.count} {stat.count === 1 ? "log" : "logs"}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

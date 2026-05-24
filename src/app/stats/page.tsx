"use client";

import { useMemo } from "react";
import { format, subDays } from "date-fns";
import { Download, Flame, Trophy } from "lucide-react";
import { useCategories, useLogs } from "@/lib/queries";
import { categoriesById } from "@/lib/selectors";
import { isoDate, parseIsoDate, withAlpha } from "@/lib/utils";

export default function StatsPage() {
  const { data: logs = [], isPending } = useLogs();
  const { data: categories = [] } = useCategories();
  const cats = useMemo(() => categoriesById(categories), [categories]);

  const totals = useMemo(() => {
    const byCat = new Map<string, number>();
    const byDate = new Map<string, number>();
    const byWeekday = new Map<number, number>();
    for (const l of logs) {
      byCat.set(l.categoryId, (byCat.get(l.categoryId) ?? 0) + 1);
      byDate.set(l.date, (byDate.get(l.date) ?? 0) + 1);
      const w = parseIsoDate(l.date).getDay();
      byWeekday.set(w, (byWeekday.get(w) ?? 0) + 1);
    }
    return { byCat, byDate, byWeekday };
  }, [logs]);

  const streaks = useMemo(() => computeStreaks(totals.byDate), [totals.byDate]);

  const today = new Date();
  const heatDays = useMemo(() => {
    const out: { date: string; count: number }[] = [];
    for (let i = 181; i >= 0; i--) {
      const d = subDays(today, i);
      const iso = isoDate(d);
      out.push({ date: iso, count: totals.byDate.get(iso) ?? 0 });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totals.byDate]);

  const maxCount = Math.max(1, ...heatDays.map((h) => h.count));
  const topCategoryEntries = Array.from(totals.byCat.entries()).sort(
    (a, b) => b[1] - a[1]
  );
  const totalLogs = logs.length;

  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const maxWeekday = Math.max(1, ...Array.from(totals.byWeekday.values()));

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
        <div>
          <div className="text-sm text-subtle">Insights</div>
          <h1 className="text-3xl font-semibold tracking-tight">Stats</h1>
        </div>
        <ExportButton logs={logs} categories={categories} />
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <StatCard label="Total logs" value={totalLogs.toString()} loading={isPending} />
        <StatCard
          label="Current streak"
          value={`${streaks.current} ${streaks.current === 1 ? "day" : "days"}`}
          icon={<Flame size={14} className="text-orange-500" />}
          loading={isPending}
        />
        <StatCard
          label="Longest streak"
          value={`${streaks.longest} ${streaks.longest === 1 ? "day" : "days"}`}
          icon={<Trophy size={14} className="text-amber-500" />}
          loading={isPending}
        />
      </div>

      <Card title="Last 26 weeks">
        <div className="overflow-x-auto no-scrollbar">
          <div
            className="grid grid-flow-col gap-1"
            style={{ gridTemplateRows: "repeat(7, minmax(0, 1fr))" }}
          >
            {heatDays.map((h) => {
              const pct = h.count === 0 ? 0 : 0.15 + (h.count / maxCount) * 0.85;
              return (
                <div
                  key={h.date}
                  title={`${h.date} — ${h.count} ${
                    h.count === 1 ? "log" : "logs"
                  }`}
                  className="h-3 w-3 rounded-sm"
                  style={{
                    background:
                      h.count === 0
                        ? "rgb(var(--muted))"
                        : withAlpha("#6366f1", pct),
                  }}
                />
              );
            })}
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-3 mt-3">
        <Card title="Category distribution">
          {topCategoryEntries.length === 0 ? (
            <Empty />
          ) : (
            <div className="space-y-2">
              {topCategoryEntries.map(([id, count]) => {
                const c = cats[id];
                if (!c) return null;
                const pct = (count / totalLogs) * 100;
                return (
                  <div key={id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium">{c.name}</span>
                      <span className="text-subtle">
                        {count} · {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: c.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="Most active days">
          <div className="grid grid-cols-7 gap-2">
            {weekdayLabels.map((label, i) => {
              const v = totals.byWeekday.get(i) ?? 0;
              const h = (v / maxWeekday) * 80 + 4;
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-md bg-gradient-to-t from-indigo-500 to-fuchsia-500"
                    style={{ height: `${h}px`, opacity: v === 0 ? 0.15 : 1 }}
                  />
                  <div className="text-[10px] text-subtle">{label}</div>
                  <div className="text-[10px] font-medium">{v}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  loading,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
      <div className="text-xs text-subtle flex items-center gap-1.5">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-semibold tracking-tight mt-1">
        {loading ? <span className="inline-block h-7 w-20 bg-muted/60 rounded animate-pulse" /> : value}
      </div>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
      <div className="text-xs uppercase tracking-wide text-subtle mb-3">
        {title}
      </div>
      {children}
    </div>
  );
}

function Empty() {
  return (
    <div className="text-sm text-subtle py-4 text-center">No data yet.</div>
  );
}

function computeStreaks(byDate: Map<string, number>): {
  current: number;
  longest: number;
} {
  if (byDate.size === 0) return { current: 0, longest: 0 };
  const dates = Array.from(byDate.keys()).sort();
  let longest = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const d of dates) {
    const cur = parseIsoDate(d);
    if (prev) {
      const diff = (cur.getTime() - prev.getTime()) / 86400000;
      run = diff === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    prev = cur;
  }
  let current = 0;
  const today = new Date();
  for (let i = 0; i < 1000; i++) {
    const d = subDays(today, i);
    if (byDate.has(isoDate(d))) current += 1;
    else break;
  }
  return { current, longest };
}

function ExportButton({
  logs,
  categories,
}: {
  logs: unknown[];
  categories: unknown[];
}) {
  function exportJson() {
    const blob = new Blob(
      [JSON.stringify({ categories, logs }, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flexilog-${format(new Date(), "yyyy-MM-dd")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <button
      onClick={exportJson}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted transition"
    >
      <Download size={14} /> Export
    </button>
  );
}

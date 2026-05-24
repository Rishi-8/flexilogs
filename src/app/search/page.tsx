"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Search, X } from "lucide-react";
import { useUi } from "@/lib/store";
import { useCategories, useLogs } from "@/lib/queries";
import {
  allTags as allTagsFn,
  categoriesById,
  filterLogs,
} from "@/lib/selectors";
import { cn, parseIsoDate, withAlpha } from "@/lib/utils";
import { DayPanel } from "@/components/day-panel";

export default function SearchPage() {
  const search = useUi((s) => s.search);
  const setSearch = useUi((s) => s.setSearch);
  const filterCategoryIds = useUi((s) => s.filterCategoryIds);
  const toggleFilterCategory = useUi((s) => s.toggleFilterCategory);
  const filterTags = useUi((s) => s.filterTags);
  const setFilterTags = useUi((s) => s.setFilterTags);
  const filterRange = useUi((s) => s.filterRange);
  const setFilterRange = useUi((s) => s.setFilterRange);
  const clearFilters = useUi((s) => s.clearFilters);

  const { data: categories = [] } = useCategories();
  const { data: logs = [], isPending } = useLogs(
    filterRange.from || filterRange.to
      ? { from: filterRange.from ?? undefined, to: filterRange.to ?? undefined }
      : undefined
  );
  const cats = useMemo(() => categoriesById(categories), [categories]);
  const allTags = useMemo(() => allTagsFn(logs), [logs]);
  const results = useMemo(
    () =>
      filterLogs(logs, {
        search,
        categoryIds: filterCategoryIds,
        tags: filterTags,
        from: filterRange.from,
        to: filterRange.to,
      }),
    [logs, search, filterCategoryIds, filterTags, filterRange]
  );

  const [openDate, setOpenDate] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const m = new Map<string, typeof results>();
    for (const l of results) {
      if (!m.has(l.date)) m.set(l.date, []);
      m.get(l.date)!.push(l);
    }
    return Array.from(m.entries()).sort(([a], [b]) => (a < b ? 1 : -1));
  }, [results]);

  const hasFilters =
    !!search ||
    filterCategoryIds.length > 0 ||
    filterTags.length > 0 ||
    !!filterRange.from ||
    !!filterRange.to;

  return (
    <>
      <div className="p-4 md:p-8 max-w-5xl">
        <div className="mb-6">
          <div className="text-sm text-subtle">Browse</div>
          <h1 className="text-3xl font-semibold tracking-tight">Search & filter</h1>
        </div>

        <div className="rounded-2xl border border-border bg-surface shadow-soft p-4 mb-5">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, notes, or tags..."
              className="w-full rounded-lg border border-border bg-surface pl-9 pr-3 py-2 text-sm outline-none focus:border-accent transition"
            />
          </div>

          <div className="mt-4">
            <div className="text-[11px] uppercase tracking-wide text-subtle mb-2">
              Categories
            </div>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => {
                const active = filterCategoryIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleFilterCategory(c.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition",
                      active
                        ? "border-transparent text-white"
                        : "border-border text-subtle hover:bg-muted"
                    )}
                    style={
                      active
                        ? { background: c.color }
                        : { background: "transparent" }
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
            </div>
          </div>

          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-subtle mb-1">
                From
              </div>
              <input
                type="date"
                value={filterRange.from ?? ""}
                onChange={(e) =>
                  setFilterRange({ ...filterRange, from: e.target.value || null })
                }
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent transition"
              />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-subtle mb-1">
                To
              </div>
              <input
                type="date"
                value={filterRange.to ?? ""}
                onChange={(e) =>
                  setFilterRange({ ...filterRange, to: e.target.value || null })
                }
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent transition"
              />
            </div>
          </div>

          {allTags.length > 0 && (
            <div className="mt-4">
              <div className="text-[11px] uppercase tracking-wide text-subtle mb-2">
                Tags
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((t) => {
                  const active = filterTags.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() =>
                        setFilterTags(
                          active
                            ? filterTags.filter((x) => x !== t)
                            : [...filterTags, t]
                        )
                      }
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[11px] transition",
                        active
                          ? "border-fg bg-fg text-bg"
                          : "border-border text-subtle hover:bg-muted"
                      )}
                    >
                      #{t}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {hasFilters && (
            <div className="mt-4 flex justify-between items-center">
              <div className="text-xs text-subtle">
                {results.length} {results.length === 1 ? "result" : "results"}
              </div>
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-xs text-subtle hover:text-fg transition"
              >
                <X size={12} /> Clear filters
              </button>
            </div>
          )}
        </div>

        {isPending ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-20 rounded-xl border border-border bg-muted/40 animate-pulse"
              />
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center">
            <div className="text-subtle text-sm">
              {hasFilters
                ? "No logs match your filters."
                : "Start typing to search your logs."}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(([date, items]) => (
              <div key={date}>
                <button
                  onClick={() => setOpenDate(date)}
                  className="text-xs uppercase tracking-wide text-subtle hover:text-fg transition mb-2"
                >
                  {format(parseIsoDate(date), "EEE, MMM d, yyyy")}
                </button>
                <div className="space-y-2">
                  {items.map((l) => {
                    const c = cats[l.categoryId];
                    return (
                      <div
                        key={l.id}
                        onClick={() => setOpenDate(l.date)}
                        className="cursor-pointer rounded-xl border border-border bg-surface p-3 hover:shadow-soft transition"
                        style={{
                          borderLeft: `3px solid ${c?.color ?? "#888"}`,
                        }}
                      >
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
                        <div className="font-medium mt-1">{l.title}</div>
                        {l.description && (
                          <p className="text-sm text-subtle truncate">
                            {l.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <DayPanel date={openDate} onClose={() => setOpenDate(null)} />
    </>
  );
}

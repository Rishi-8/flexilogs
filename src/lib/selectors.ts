import type { Category, Log } from "./types";
import { parseIsoDate } from "./utils";

export function logsForDate(logs: Log[], date: string): Log[] {
  return logs
    .filter((l) => l.date === date)
    .sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""));
}

export function categoriesById(
  categories: Category[]
): Record<string, Category> {
  return Object.fromEntries(categories.map((c) => [c.id, c]));
}

export interface LogFilters {
  search?: string;
  categoryIds?: string[];
  tags?: string[];
  from?: string | null;
  to?: string | null;
}

export function filterLogs(logs: Log[], f: LogFilters): Log[] {
  const q = f.search?.trim().toLowerCase() ?? "";
  return logs.filter((l) => {
    if (f.categoryIds?.length && !f.categoryIds.includes(l.categoryId))
      return false;
    if (f.tags?.length && !f.tags.some((t) => l.tags.includes(t)))
      return false;
    if (f.from && l.date < f.from) return false;
    if (f.to && l.date > f.to) return false;
    if (q) {
      const hay = `${l.title} ${l.description ?? ""} ${l.tags.join(
        " "
      )}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function allTags(logs: Log[]): string[] {
  const set = new Set<string>();
  for (const l of logs) for (const t of l.tags) set.add(t);
  return Array.from(set).sort();
}

export interface DayStat {
  date: string;
  count: number;
  categoryIds: string[];
}

export function buildMonthStats(
  logs: Log[],
  year: number,
  month: number
): Record<string, DayStat> {
  const out: Record<string, DayStat> = {};
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  for (const l of logs) {
    const d = parseIsoDate(l.date);
    if (d < start || d > end) continue;
    const cur = out[l.date] ?? { date: l.date, count: 0, categoryIds: [] };
    cur.count += 1;
    if (!cur.categoryIds.includes(l.categoryId))
      cur.categoryIds.push(l.categoryId);
    out[l.date] = cur;
  }
  return out;
}

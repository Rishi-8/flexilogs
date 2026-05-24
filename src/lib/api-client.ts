import type { Category, Log } from "./types";

async function http<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

// Categories
export const listCategories = () => http<Category[]>("/api/categories");
export const createCategory = (data: Omit<Category, "id">) =>
  http<Category>("/api/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const updateCategory = (id: string, data: Partial<Omit<Category, "id">>) =>
  http<Category>(`/api/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const deleteCategory = (id: string) =>
  http<{ ok: true; fallbackId: string }>(`/api/categories/${id}`, {
    method: "DELETE",
  });

// Logs
export const listLogs = (params?: { from?: string; to?: string }) => {
  const qs = new URLSearchParams();
  if (params?.from) qs.set("from", params.from);
  if (params?.to) qs.set("to", params.to);
  const q = qs.toString();
  return http<Log[]>(`/api/logs${q ? `?${q}` : ""}`);
};

export type LogInput = {
  categoryId: string;
  title: string;
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  tags: string[];
};

export const createLog = (data: LogInput) =>
  http<Log>("/api/logs", { method: "POST", body: JSON.stringify(data) });
export const updateLog = (id: string, data: Partial<LogInput>) =>
  http<Log>(`/api/logs/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const deleteLog = (id: string) =>
  http<{ ok: true }>(`/api/logs/${id}`, { method: "DELETE" });
export const duplicateLog = (id: string) =>
  http<Log>(`/api/logs/${id}/duplicate`, { method: "POST" });

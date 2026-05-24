"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import * as api from "./api-client";

const CATEGORIES_KEY = ["categories"] as const;
const logsKey = (params?: { from?: string; to?: string }) =>
  ["logs", params ?? {}] as const;

// Reads
export function useCategories() {
  return useQuery({
    queryKey: CATEGORIES_KEY,
    queryFn: api.listCategories,
  });
}

export function useLogs(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: logsKey(params),
    queryFn: () => api.listLogs(params),
  });
}

// Mutations
function useInvalidateAll() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["logs"] });
    qc.invalidateQueries({ queryKey: CATEGORIES_KEY });
  };
}

export function useCreateCategory() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: api.createCategory,
    onSuccess: invalidate,
  });
}

export function useUpdateCategory() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.updateCategory>[1] }) =>
      api.updateCategory(id, data),
    onSuccess: invalidate,
  });
}

export function useDeleteCategory() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: api.deleteCategory,
    onSuccess: invalidate,
  });
}

export function useCreateLog() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: api.createLog,
    onSuccess: invalidate,
  });
}

export function useUpdateLog() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<api.LogInput> }) =>
      api.updateLog(id, data),
    onSuccess: invalidate,
  });
}

export function useDeleteLog() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: api.deleteLog,
    onSuccess: invalidate,
  });
}

export function useDuplicateLog() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: api.duplicateLog,
    onSuccess: invalidate,
  });
}

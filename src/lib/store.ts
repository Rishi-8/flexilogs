"use client";

import { create } from "zustand";

interface UiState {
  selectedDate: string | null;
  search: string;
  filterCategoryIds: string[];
  filterTags: string[];
  filterRange: { from: string | null; to: string | null };

  setSelectedDate: (d: string | null) => void;
  setSearch: (s: string) => void;
  toggleFilterCategory: (id: string) => void;
  setFilterTags: (tags: string[]) => void;
  setFilterRange: (range: { from: string | null; to: string | null }) => void;
  clearFilters: () => void;
}

export const useUi = create<UiState>((set, get) => ({
  selectedDate: null,
  search: "",
  filterCategoryIds: [],
  filterTags: [],
  filterRange: { from: null, to: null },

  setSelectedDate: (d) => set({ selectedDate: d }),
  setSearch: (s) => set({ search: s }),
  toggleFilterCategory: (id) => {
    const cur = get().filterCategoryIds;
    set({
      filterCategoryIds: cur.includes(id)
        ? cur.filter((x) => x !== id)
        : [...cur, id],
    });
  },
  setFilterTags: (tags) => set({ filterTags: tags }),
  setFilterRange: (range) => set({ filterRange: range }),
  clearFilters: () =>
    set({
      search: "",
      filterCategoryIds: [],
      filterTags: [],
      filterRange: { from: null, to: null },
    }),
}));

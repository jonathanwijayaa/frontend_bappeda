/**
 * hooks/useTableSort.ts
 * Reusable 3-state sort hook: asc → desc → null (reset).
 * Menggantikan logika sort yang identik di DataRelawan dan HistoriRelawan.
 */
import { useState, useMemo, useCallback } from "react";

type SortOrder = "asc" | "desc" | null;

interface UseTableSortResult<K extends string> {
  /** Kolom yang sedang di-sort, null jika tidak ada */
  sortColumn: K | null;
  /** Urutan sort saat ini */
  sortOrder: SortOrder;
  /** Handler untuk toggle sort pada kolom tertentu */
  handleSort: (columnKey: string) => void;
  /** Reset sort ke kondisi awal */
  resetSort: () => void;
  /** Helper: apply sort ke array data */
  applySortToData: <T extends Record<string, unknown>>(data: T[]) => T[];
}

/**
 * @param sortableColumns - daftar nama kolom yang boleh di-sort
 * @param onSortChange - opsional callback saat sort berubah (mis. reset pagination)
 */
export function useTableSort<K extends string>(
  sortableColumns: K[],
  onSortChange?: () => void,
): UseTableSortResult<K> {
  const [sortColumn, setSortColumn] = useState<K | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  const sortableSet = useMemo(() => new Set<string>(sortableColumns), [sortableColumns]);

  const handleSort = useCallback(
    (columnKey: string) => {
      if (!sortableSet.has(columnKey)) return;

      const col = columnKey as K;
      if (sortColumn !== col) {
        setSortColumn(col);
        setSortOrder("asc");
      } else if (sortOrder === "asc") {
        setSortOrder("desc");
      } else {
        setSortColumn(null);
        setSortOrder(null);
      }
      onSortChange?.();
    },
    [sortColumn, sortOrder, sortableSet, onSortChange],
  );

  const resetSort = useCallback(() => {
    setSortColumn(null);
    setSortOrder(null);
  }, []);

  const applySortToData = useCallback(
    <T extends Record<string, unknown>>(data: T[]): T[] => {
      if (!sortColumn || !sortOrder) return data;
      return [...data].sort((a, b) => {
        const valA = String(a[sortColumn] || "").toLowerCase();
        const valB = String(b[sortColumn] || "").toLowerCase();
        const res = valA.localeCompare(valB, "id", { numeric: true });
        return sortOrder === "asc" ? res : -res;
      });
    },
    [sortColumn, sortOrder],
  );

  return { sortColumn, sortOrder, handleSort, resetSort, applySortToData };
}

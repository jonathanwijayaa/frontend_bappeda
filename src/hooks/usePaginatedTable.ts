/**
 * hooks/usePaginatedTable.ts
 * Abstraksi boilerplate search + pagination slice + totalPages.
 * Menggantikan pattern yang terduplikasi di 8+ halaman admin.
 */
import { useState, useMemo, useCallback } from "react";

interface UsePaginatedTableOptions<T> {
  /** Data sumber yang akan di-filter dan di-paginasi */
  data: T[];
  /** Jumlah item per halaman */
  itemsPerPage?: number;
  /** Fungsi filter: return true jika item cocok dengan query */
  filterFn: (item: T, query: string) => boolean;
}

interface UsePaginatedTableResult<T> {
  /** Term pencarian saat ini */
  searchTerm: string;
  /** Setter untuk search term (otomatis reset ke page 1) */
  setSearchTerm: (term: string) => void;
  /** Halaman saat ini (1-indexed) */
  currentPage: number;
  /** Setter untuk halaman */
  setCurrentPage: (page: number) => void;
  /** Total halaman berdasarkan data terfilter */
  totalPages: number;
  /** Data yang sudah di-slice untuk halaman saat ini */
  currentData: T[];
  /** Data yang sudah di-filter (sebelum pagination) */
  filteredData: T[];
  /** Items per page */
  itemsPerPage: number;
}

export function usePaginatedTable<T>(
  options: UsePaginatedTableOptions<T>,
): UsePaginatedTableResult<T> {
  const { data, itemsPerPage = 5, filterFn } = options;

  const [searchTerm, setSearchTermRaw] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  const setSearchTerm = useCallback((term: string) => {
    setSearchTermRaw(term);
    setCurrentPage(1);
  }, []);

  const filteredData = useMemo(() => {
    const q = searchTerm.toLowerCase();
    if (!q) return data;
    return data.filter((item) => filterFn(item, q));
  }, [data, searchTerm, filterFn]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const currentData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  return {
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    totalPages,
    currentData,
    filteredData,
    itemsPerPage,
  };
}

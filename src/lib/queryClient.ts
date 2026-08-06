/**
 * lib/queryClient.ts
 * Konfigurasi global QueryClient untuk TanStack Query.
 */
import { QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Hindari refetch otomatis saat tab kembali fokus supaya UI lebih stabil.
      refetchOnWindowFocus: false,
      // Coba ulang satu kali saja sebelum menampilkan error.
      retry: 1,
      // Data dianggap masih valid selama 2 menit sebelum dianggap stale.
      staleTime: 2 * 60 * 1000,
    },
  },
});

export default queryClient;

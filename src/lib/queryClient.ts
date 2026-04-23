/**
 * lib/queryClient.ts
 * Konfigurasi global QueryClient untuk TanStack Query.
 */
import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Jangan refetch saat window focus kembali (sesuai UX dashboard admin)
            refetchOnWindowFocus: false,
            // Retry 1x saja sebelum tampilkan error
            retry: 1,
            // Data dianggap stale setelah 2 menit
            staleTime: 2 * 60 * 1000,
        },
    },
});

export default queryClient;

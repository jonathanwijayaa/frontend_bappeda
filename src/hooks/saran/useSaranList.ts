/**
 * hooks/saran/useSaranList.ts
 * Fetch daftar saran & hotline (hanya untuk Super Admin).
 */
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/axios';
import { SaranData } from '../../types';

export const SARAN_KEYS = {
    all: ['saran'] as const,
    list: () => [...SARAN_KEYS.all, 'list'] as const,
};

// Ambil daftar saran dari backend untuk halaman admin.
export const useSaranList = (enabled = true) =>
    useQuery({
        queryKey: SARAN_KEYS.list(),
        queryFn: async (): Promise<SaranData[]> => {
            const { data } = await apiClient.get('/saran/admin?limit=100');
            if (!data.success) throw new Error(data.message || 'Gagal memuat saran masukan');
            return data.data;
        },
        enabled,
        staleTime: 30 * 1000,
    });

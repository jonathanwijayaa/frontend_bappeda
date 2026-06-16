/**
 * hooks/riwayat/useRiwayatPengajuan.ts
 * Fetch riwayat pengajuan perubahan data untuk relawan yang sedang login.
 */
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/axios';
import { PengajuanItem } from '../../types';

export const RIWAYAT_KEYS = {
    all: ['riwayat'] as const,
    list: () => [...RIWAYAT_KEYS.all, 'list'] as const,
};

// Ambil riwayat pengajuan perubahan data milik relawan login.
export const useRiwayatPengajuan = () =>
    useQuery({
        queryKey: RIWAYAT_KEYS.list(),
        queryFn: async (): Promise<PengajuanItem[]> => {
            const { data } = await apiClient.get('/relawan/history');
            if (!data.success) throw new Error(data.message || 'Gagal memuat riwayat');
            return data.data.riwayat_pengajuan || [];
        },
    });

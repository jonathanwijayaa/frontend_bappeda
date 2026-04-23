/**
 * hooks/relawan/usePengajuanList.ts
 * Fetch daftar pengajuan perubahan data relawan.
 */
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/axios';
import { PengajuanAPIData } from '../../types';

export const PENGAJUAN_KEYS = {
    all: ['pengajuan'] as const,
    list: (isSuperAdmin: boolean) => [...PENGAJUAN_KEYS.all, 'list', isSuperAdmin] as const,
};

export const usePengajuanList = (isSuperAdmin: boolean) =>
    useQuery({
        queryKey: PENGAJUAN_KEYS.list(isSuperAdmin),
        queryFn: async (): Promise<PengajuanAPIData[]> => {
            const endpoint = isSuperAdmin
                ? '/admin/relawan/pengajuan'
                : '/opd-admin/relawan/pengajuan';
            const { data } = await apiClient.get(endpoint);
            if (!data.success) throw new Error(data.message || 'Gagal memuat pengajuan');
            return data.data;
        },
    });

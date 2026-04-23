/**
 * hooks/kader/useKaderList.ts
 * Fetch daftar kader — endpoint berbeda untuk Super Admin vs OPD.
 */
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/axios';
import { KaderData } from '../../types';

export const KADER_KEYS = {
    all: ['kader'] as const,
    list: (isSuperAdmin: boolean) => [...KADER_KEYS.all, 'list', isSuperAdmin] as const,
    byOpd: (opdId: number) => [...KADER_KEYS.all, 'byOpd', opdId] as const,
};

/** Daftar kader utama (seluruh kader atau kader OPD) */
export const useKaderList = (isSuperAdmin: boolean) =>
    useQuery({
        queryKey: KADER_KEYS.list(isSuperAdmin),
        queryFn: async (): Promise<KaderData[]> => {
            const endpoint = isSuperAdmin ? '/kader' : '/opd-admin/kader';
            const { data } = await apiClient.get(endpoint);
            if (!data.success) throw new Error(data.message || 'Gagal memuat data kader');
            return data.data;
        },
    });

/** Kader berdasarkan opd_id — untuk dropdown di form assignment relawan */
export const useKaderByOpdId = (opdId: number, isSuperAdmin: boolean) =>
    useQuery({
        queryKey: KADER_KEYS.byOpd(opdId),
        queryFn: async () => {
            const endpoint = isSuperAdmin ? `/kader?opd_id=${opdId}` : '/opd-admin/kader';
            const { data } = await apiClient.get(endpoint);
            if (!data.success) throw new Error(data.message || 'Gagal memuat kader');
            return (data.data as any[]).map((k: any) => ({
                label: k.nama_kader as string,
                value: String(k.kader_id),
            }));
        },
        // Hanya fetch jika opdId sudah dipilih
        enabled: opdId > 0,
    });

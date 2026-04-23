/**
 * hooks/sk/useSkList.ts
 * Fetch daftar Surat Keputusan dan detail SK per id.
 */
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/axios';
import { SKData, SKDetail } from '../../types';

export const SK_KEYS = {
    all: ['sk'] as const,
    list: () => [...SK_KEYS.all, 'list'] as const,
    detail: (sk_id: number) => [...SK_KEYS.all, 'detail', sk_id] as const,
    pdf: (sk_id: number) => [...SK_KEYS.all, 'pdf', sk_id] as const,
};

export const useSkList = () =>
    useQuery({
        queryKey: SK_KEYS.list(),
        queryFn: async (): Promise<SKData[]> => {
            const { data } = await apiClient.get('/admin/sk');
            if (!data.success) throw new Error(data.message || 'Gagal memuat data SK');
            return data.data;
        },
    });

/** Fetch detail SK — hanya diaktifkan jika sk_id > 0 */
export const useSkDetail = (sk_id: number) =>
    useQuery({
        queryKey: SK_KEYS.detail(sk_id),
        queryFn: async (): Promise<SKDetail> => {
            const { data } = await apiClient.get(`/admin/sk/${sk_id}`);
            if (!data.success) throw new Error(data.message || 'Gagal memuat detail SK');
            return data.data;
        },
        enabled: sk_id > 0,
    });

/** Fetch PDF base64 dari SK — hanya diaktifkan jika sk_id > 0 */
export const useSkPdf = (sk_id: number) =>
    useQuery({
        queryKey: SK_KEYS.pdf(sk_id),
        queryFn: async (): Promise<string> => {
            const { data } = await apiClient.get(`/admin/sk/${sk_id}/pdf`);
            if (!data.success) throw new Error('Gagal memuat PDF');
            return data.data.file_path as string;
        },
        enabled: sk_id > 0,
        // PDF tidak perlu stale/refetch agresif
        staleTime: 10 * 60 * 1000,
    });

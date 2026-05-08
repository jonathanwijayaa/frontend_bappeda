/**
 * hooks/sk/useSkList.ts
 * Fetch daftar Surat Keputusan dan detail SK per id.
 */
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/axios';
import { SKData, SKDetail } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const SK_KEYS = {
    all: ['sk'] as const,
    list: (role: string) => [...SK_KEYS.all, 'list', role] as const,
    detail: (sk_id: number, role: string) => [...SK_KEYS.all, 'detail', sk_id, role] as const,
    pdf: (sk_id: number, role: string) => [...SK_KEYS.all, 'pdf', sk_id, role] as const,
};

export const useSkList = () => {
    const { user } = useAuth();
    const role = user?.role || 'super_admin';
    const endpoint = role === 'opd' ? '/opd-admin/sk' : '/admin/sk';

    return useQuery({
        queryKey: SK_KEYS.list(role),
        queryFn: async (): Promise<SKData[]> => {
            const { data } = await apiClient.get(endpoint);
            if (!data.success) throw new Error(data.message || 'Gagal memuat data SK');
            return data.data;
        },
    });
};

/** Fetch detail SK — hanya diaktifkan jika sk_id > 0 */
export const useSkDetail = (sk_id: number) => {
    const { user } = useAuth();
    const role = user?.role || 'super_admin';
    const endpoint = `/admin/sk/${sk_id}`;

    return useQuery({
        queryKey: SK_KEYS.detail(sk_id, role),
        queryFn: async (): Promise<SKDetail> => {
            const { data } = await apiClient.get(endpoint);
            if (!data.success) throw new Error(data.message || 'Gagal memuat detail SK');
            return data.data;
        },
        enabled: sk_id > 0,
    });
};

/** Fetch PDF base64 dari SK — hanya diaktifkan jika sk_id > 0 */
export const useSkPdf = (sk_id: number) => {
    const { user } = useAuth();
    const role = user?.role || 'super_admin';
    const endpoint = `/admin/sk/${sk_id}/pdf`;

    return useQuery({
        queryKey: SK_KEYS.pdf(sk_id, role),
        queryFn: async (): Promise<string> => {
            const { data } = await apiClient.get(endpoint);
            if (!data.success) throw new Error('Gagal memuat PDF');
            return data.data.file_path as string;
        },
        enabled: sk_id > 0,
        // PDF tidak perlu stale/refetch agresif
        staleTime: 10 * 60 * 1000,
    });
};

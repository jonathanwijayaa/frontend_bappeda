/**
 * hooks/opd/useOpdList.ts
 * Fetch daftar OPD dari backend.
 */
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/axios';
import { OPDData } from '../../types';

export const OPD_KEYS = {
    all: ['opd'] as const,
    list: () => [...OPD_KEYS.all, 'list'] as const,
};

// Ambil daftar OPD dan cache hasilnya lewat TanStack Query.
const fetchOpdList = async (): Promise<OPDData[]> => {
    const { data } = await apiClient.get('/opd');
    if (!data.success) throw new Error(data.message || 'Gagal memuat data OPD');
    return data.data;
};

// Hook utama untuk memuat daftar OPD sesuai kondisi enabled.
export const useOpdList = (enabled: boolean = true) =>
    useQuery({
        queryKey: OPD_KEYS.list(),
        queryFn: fetchOpdList,
        enabled,
    });

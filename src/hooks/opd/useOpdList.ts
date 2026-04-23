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

const fetchOpdList = async (): Promise<OPDData[]> => {
    const { data } = await apiClient.get('/opd');
    if (!data.success) throw new Error(data.message || 'Gagal memuat data OPD');
    return data.data;
};

export const useOpdList = () =>
    useQuery({
        queryKey: OPD_KEYS.list(),
        queryFn: fetchOpdList,
    });

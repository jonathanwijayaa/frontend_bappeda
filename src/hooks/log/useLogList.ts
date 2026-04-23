/**
 * hooks/log/useLogList.ts
 * Fetch audit log aktivitas.
 */
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/axios';
import { LogData } from '../../types';

export const LOG_KEYS = {
    all: ['log'] as const,
    list: (limit: number) => [...LOG_KEYS.all, 'list', limit] as const,
};

export const useLogList = (limit = 200) =>
    useQuery({
        queryKey: LOG_KEYS.list(limit),
        queryFn: async (): Promise<LogData[]> => {
            const { data } = await apiClient.get(`/admin/logs?limit=${limit}`);
            if (!data.success) throw new Error(data.message || 'Gagal memuat log aktivitas');
            return data.data;
        },
        // Log bisa banyak — stale lebih cepat supaya lebih sering refresh
        staleTime: 30 * 1000,
    });

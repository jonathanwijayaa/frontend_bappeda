/**
 * hooks/relawan/useRelawanMutations.ts
 * Semua mutasi untuk data relawan: tambah, update, hapus penugasan, review pengajuan, bulk.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/axios';
import { RELAWAN_KEYS } from './useRelawanList';
import { PENGAJUAN_KEYS } from './usePengajuanList';

// ── Tambah relawan baru ───────────────────────────────────────
export const useCreateRelawan = (isSuperAdmin: boolean) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: Record<string, any>) => {
            const endpoint = isSuperAdmin ? '/admin/relawan' : '/opd-admin/relawan';
            return apiClient.post(endpoint, payload).then(r => {
                if (!r.data.success) throw new Error(r.data.message);
                return r.data;
            });
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: RELAWAN_KEYS.all }),
    });
};

// ── Update data relawan ───────────────────────────────────────
export const useUpdateRelawan = (isSuperAdmin: boolean) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ relawan_id, payload }: { relawan_id: number; payload: Record<string, any> }) => {
            const endpoint = isSuperAdmin
                ? `/admin/relawan/${relawan_id}`
                : `/opd-admin/relawan/${relawan_id}`;
            return apiClient.put(endpoint, payload).then(r => {
                if (!r.data.success) throw new Error(r.data.message);
                return r.data;
            });
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: RELAWAN_KEYS.all }),
    });
};

// ── Hapus satu penugasan relawan ──────────────────────────────
export const useDeletePenugasan = (isSuperAdmin: boolean) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (penugasan_id: string) => {
            const endpoint = isSuperAdmin
                ? `/admin/relawan/penugasan/${penugasan_id}`
                : `/opd-admin/relawan/penugasan/${penugasan_id}`;
            return apiClient.delete(endpoint).then(r => {
                if (!r.data.success) throw new Error(r.data.message);
                return r.data;
            });
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: RELAWAN_KEYS.all }),
    });
};

// ── Review / approve / tolak pengajuan ───────────────────────
export const useReviewPengajuan = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            pengajuan_id,
            status,
            catatan,
        }: {
            pengajuan_id: number;
            status: 'Diterima' | 'Ditolak';
            catatan?: string;
        }) =>
            apiClient
                .patch(`/admin/relawan/pengajuan/${pengajuan_id}`, { status, catatan_verifikator: catatan })
                .then(r => {
                    if (!r.data.success) throw new Error(r.data.message);
                    return r.data;
                }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: PENGAJUAN_KEYS.all });
            qc.invalidateQueries({ queryKey: RELAWAN_KEYS.all });
        },
    });
};

// ── Bulk upload relawan via Excel ─────────────────────────────
export const useBulkRelawan = (isSuperAdmin: boolean) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (rows: any[]) => {
            const endpoint = isSuperAdmin ? '/admin/relawan/bulk' : '/opd-admin/relawan/bulk';
            return apiClient.post(endpoint, rows).then(r => {
                if (!r.data.success) throw new Error(r.data.message);
                return r.data;
            });
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: RELAWAN_KEYS.all }),
    });
};

/**
 * hooks/kader/useKaderMutations.ts
 * Mutasi CRUD untuk data Kader.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/axios';
import { KADER_KEYS } from './useKaderList';

const invalidateKader = (qc: ReturnType<typeof useQueryClient>) =>
    qc.invalidateQueries({ queryKey: KADER_KEYS.all });

// ── Tambah kader baru ─────────────────────────────────────────
// Buat kader baru dan invalidate cache daftar kader.
export const useCreateKader = (isSuperAdmin: boolean) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: Record<string, any>) => {
            const endpoint = isSuperAdmin ? '/kader' : '/opd-admin/kader';
            return apiClient.post(endpoint, payload).then(r => {
                if (!r.data.success) throw new Error(r.data.message);
                return r.data;
            });
        },
        onSuccess: () => invalidateKader(qc),
    });
};

// ── Update kader ──────────────────────────────────────────────
// Simpan perubahan data kader yang sedang diedit.
export const useUpdateKader = (isSuperAdmin: boolean) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ kader_id, payload }: { kader_id: number; payload: Record<string, any> }) => {
            const endpoint = isSuperAdmin ? `/kader/${kader_id}` : `/opd-admin/kader/${kader_id}`;
            return apiClient.put(endpoint, payload).then(r => {
                if (!r.data.success) throw new Error(r.data.message);
                return r.data;
            });
        },
        onSuccess: () => invalidateKader(qc),
    });
};

// ── Toggle status kader ───────────────────────────────────────
// Ubah status aktif/nonaktif kader lalu refresh daftar.
export const useToggleKaderStatus = (isSuperAdmin: boolean) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ kader_id, status_keaktifan }: { kader_id: number; status_keaktifan: boolean }) => {
            const endpoint = isSuperAdmin
                ? `/kader/${kader_id}/status`
                : `/opd-admin/kader/${kader_id}/status`;
            return apiClient.patch(endpoint, { status_keaktifan }).then(r => {
                if (!r.data.success) throw new Error(r.data.message);
                return r.data;
            });
        },
        onSuccess: () => invalidateKader(qc),
    });
};

// ── Bulk upload kader via Excel ───────────────────────────────
// Import banyak data kader sekaligus dari hasil unggahan Excel.
export const useBulkKader = (isSuperAdmin: boolean) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (rows: any[]) => {
            const endpoint = isSuperAdmin ? '/kader/bulk' : '/opd-admin/kader/bulk';
            return apiClient.post(endpoint, rows).then(r => {
                if (!r.data.success) throw new Error(r.data.message);
                return r.data;
            });
        },
        onSuccess: () => invalidateKader(qc),
    });
};

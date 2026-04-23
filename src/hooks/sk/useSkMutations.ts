/**
 * hooks/sk/useSkMutations.ts
 * Mutasi untuk Surat Keputusan: upload (multipart/form-data) dan hapus.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/axios';
import { SK_KEYS } from './useSkList';

// ── Upload SK baru (PDF + metadata) ──────────────────────────
export const useCreateSk = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (formData: FormData) =>
            apiClient
                .post('/admin/sk', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                })
                .then(r => {
                    if (!r.data.success) throw new Error(r.data.message);
                    return r.data;
                }),
        onSuccess: () => qc.invalidateQueries({ queryKey: SK_KEYS.list() }),
    });
};

// ── Hapus SK ──────────────────────────────────────────────────
export const useDeleteSk = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (sk_id: number) =>
            apiClient.delete(`/admin/sk/${sk_id}`).then(r => {
                if (!r.data.success) throw new Error(r.data.message);
                return r.data;
            }),
        onSuccess: () => qc.invalidateQueries({ queryKey: SK_KEYS.list() }),
    });
};

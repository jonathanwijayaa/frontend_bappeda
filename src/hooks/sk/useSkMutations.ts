/**
 * hooks/sk/useSkMutations.ts
 * Mutasi untuk Surat Keputusan: upload (multipart/form-data) dan hapus.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/axios';
import { SK_KEYS } from './useSkList';
import { useAuth } from '../../context/AuthContext';

// ── Upload SK baru (PDF + metadata) ──────────────────────────
// Upload file SK baru dan refresh daftar SK setelah sukses.
export const useCreateSk = () => {
    const qc = useQueryClient();
    const { user } = useAuth();
    const role = user?.role || 'super_admin';
    const endpoint = '/admin/sk';

    return useMutation({
        mutationFn: (formData: FormData) =>
            apiClient
                .post(endpoint, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                })
                .then(r => {
                    if (!r.data.success) throw new Error(r.data.message);
                    return r.data;
                }),
        onSuccess: () => qc.invalidateQueries({ queryKey: SK_KEYS.list(role) }),
    });
};

// ── Hapus SK ──────────────────────────────────────────────────
// Hapus SK terpilih lalu refresh daftar SK.
export const useDeleteSk = () => {
    const qc = useQueryClient();
    const { user } = useAuth();
    const role = user?.role || 'super_admin';

    return useMutation({
        mutationFn: (sk_id: number) => {
            const endpoint = `/admin/sk/${sk_id}`;
            return apiClient.delete(endpoint).then(r => {
                if (!r.data.success) throw new Error(r.data.message);
                return r.data;
            });
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: SK_KEYS.list(role) }),
    });
};

// ── Toggle status aktif/nonaktif SK ───────────────────────────
// Ubah status aktif/nonaktif SK kemudian refresh daftar.
export const useToggleSkStatus = () => {
    const qc = useQueryClient();
    const { user } = useAuth();
    const role = user?.role || 'super_admin';

    return useMutation({
        mutationFn: ({ sk_id, status }: { sk_id: number; status: 'Aktif' | 'Tidak Aktif' }) => {
            const endpoint = `/admin/sk/${sk_id}/status`;
            return apiClient.patch(endpoint, { status }).then(r => {
                if (!r.data.success) throw new Error(r.data.message);
                return r.data;
            });
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: SK_KEYS.list(role) }),
    });
};

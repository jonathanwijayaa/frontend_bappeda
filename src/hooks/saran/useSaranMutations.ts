/**
 * hooks/saran/useSaranMutations.ts
 * Mutasi: kirim saran (relawan/OPD) dan respond saran (Super Admin).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/axios';
import { SARAN_KEYS } from './useSaranList';

// ── Kirim saran baru (relawan / OPD) ─────────────────────────
// Kirim saran baru dari user yang sedang login.
export const useCreateSaran = () =>
    useMutation({
        mutationFn: (payload: { subjek: string; pesan: string }) =>
            apiClient.post('/saran', payload).then(r => {
                if (!r.data.success) throw new Error(r.data.message);
                return r.data;
            }),
    });

// ── Respond / update status saran (Super Admin) ───────────────
// Update status dan catatan admin untuk saran yang masuk.
export const useRespondSaran = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            saran_id,
            status,
            catatan_admin,
        }: {
            saran_id: number;
            status: 'Menunggu' | 'Selesai';
            catatan_admin: string | null;
        }) =>
            apiClient
                .patch(`/saran/admin/${saran_id}/baca`, { status, catatan_admin })
                .then(r => {
                    if (!r.data.success) throw new Error(r.data.message);
                    return r.data;
                }),
        onSuccess: () => qc.invalidateQueries({ queryKey: SARAN_KEYS.list() }),
    });
};

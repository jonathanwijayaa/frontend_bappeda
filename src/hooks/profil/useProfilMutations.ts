/**
 * hooks/profil/useProfilMutations.ts
 * Mutasi: update profil dan ganti password.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/axios';
import { PROFIL_KEYS } from './useProfileData';

// ── Update nama & no_hp ───────────────────────────────────────
export const useUpdateProfil = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: { nama_lengkap: string; no_hp: string | null }) =>
            apiClient.put('/profile/update', payload).then(r => {
                if (!r.data.success) throw new Error(r.data.message);
                return r.data;
            }),
        onSuccess: () => qc.invalidateQueries({ queryKey: PROFIL_KEYS.me() }),
    });
};

// ── Ganti password ────────────────────────────────────────────
export const useChangePassword = () =>
    useMutation({
        mutationFn: (payload: { password_lama: string; password_baru: string }) =>
            apiClient.patch('/profile/change-password', payload).then(r => {
                if (!r.data.success) throw new Error(r.data.message);
                return r.data;
            }),
    });

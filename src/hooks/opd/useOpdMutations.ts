/**
 * hooks/opd/useOpdMutations.ts
 * Mutasi CRUD untuk data OPD: tambah, update, toggle status, bulk upload.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../lib/axios";
import { OPD_KEYS } from "./useOpdList";

// ── Tambah OPD baru ───────────────────────────────────────────
// Kirim data OPD baru ke server lalu invalidate daftar OPD./ data lama sudah basi jadi akan refetch otomatis.
export const useCreateOpd = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, string>) =>
      apiClient.post("/opd", payload).then((r) => {
        if (!r.data.success) throw new Error(r.data.message);
        return r.data;
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: OPD_KEYS.list() }),
  });
};

// ── Update OPD ────────────────────────────────────────────────
// Update data OPD terpilih dan refresh cache daftar OPD.
export const useUpdateOpd = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ opd_id, payload }: { opd_id: number; payload: Record<string, string> }) =>
      apiClient.put(`/opd/${opd_id}`, payload).then((r) => {
        if (!r.data.success) throw new Error(r.data.message);
        return r.data;
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: OPD_KEYS.list() }),
  });
};

// ── Toggle status aktif/nonaktif OPD ─────────────────────────
// Ubah status aktif/nonaktif OPD lalu refresh data yang ditampilkan.
export const useToggleOpdStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ opd_id, status_keaktifan }: { opd_id: number; status_keaktifan: boolean }) =>
      apiClient.patch(`/opd/${opd_id}/status`, { status_keaktifan }).then((r) => {
        if (!r.data.success) throw new Error(r.data.message);
        return r.data;
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: OPD_KEYS.list() }),
  });
};

// ── Bulk upload OPD via Excel ─────────────────────────────────
// Import banyak OPD sekaligus dari data Excel.
export const useBulkOpd = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any[]) =>
      apiClient.post("/opd/bulk", data).then((r) => {
        if (!r.data.success) throw new Error(r.data.message);
        return r.data;
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: OPD_KEYS.list() }),
  });
};

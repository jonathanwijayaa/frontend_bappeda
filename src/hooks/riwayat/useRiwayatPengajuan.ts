/**
 * hooks/riwayat/useRiwayatPengajuan.ts
 * Fetch riwayat pengajuan perubahan data untuk relawan yang sedang login.
 */
import { useQuery } from "@tanstack/react-query";
import apiClient from "../../lib/axios";
import type { PengajuanItem } from "../../types";

export const RIWAYAT_KEYS = {
  all: ["riwayat"] as const,
  list: () => [...RIWAYAT_KEYS.all, "list"] as const,
};

// Ambil riwayat pengajuan perubahan data milik relawan login.
export const useRiwayatPengajuan = () =>
  useQuery({
    queryFn: async (): Promise<PengajuanItem[]> => {
      const { data } = await apiClient.get("/relawan/history");
      if (!data.success) throw new Error(data.message || "Gagal memuat riwayat");

      const rawList = Array.isArray(data.data?.riwayat_pengajuan)
        ? data.data.riwayat_pengajuan
        : Array.isArray(data.data)
        ? data.data
        : [];

      // Normalisasi status_pengajuan ke status
      return rawList.map((item: any) => ({
        ...item,
        status: (item.status_pengajuan || item.status || "Menunggu Review") as PengajuanItem["status"],
      }));
    },
    queryKey: RIWAYAT_KEYS.list(),
  });
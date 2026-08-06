/**
 * hooks/kader/useKaderList.ts
 * Fetch daftar kader — endpoint berbeda untuk Super Admin vs OPD.
 */
import { useQuery } from "@tanstack/react-query";
import apiClient from "../../lib/axios";
import type { KaderData } from "../../types";

export const KADER_KEYS = {
  all: ["kader"] as const,
  byOpd: (opdId: number) => [...KADER_KEYS.all, "byOpd", opdId] as const,
  list: (isSuperAdmin: boolean) => [...KADER_KEYS.all, "list", isSuperAdmin] as const,
};

/** Daftar kader utama (seluruh kader atau kader OPD) */
// Ambil daftar kader dengan endpoint yang berbeda untuk Super Admin dan OPD.
export const useKaderList = (isSuperAdmin: boolean) =>
  useQuery({
    queryFn: async (): Promise<KaderData[]> => {
      const endpoint = isSuperAdmin ? "/kader" : "/opd-admin/kader";
      const { data } = await apiClient.get(endpoint);
      if (!data.success) throw new Error(data.message || "Gagal memuat data kader");
      return data.data;
    },
    queryKey: KADER_KEYS.list(isSuperAdmin),
  });

/** Kader berdasarkan opd_id — untuk dropdown di form assignment relawan */
// Ambil opsi kader per OPD untuk input assignment relawan.
export const useKaderByOpdId = (opdId: number, isSuperAdmin: boolean) =>
  useQuery({
    // Hanya fetch jika opdId sudah dipilih
    enabled: opdId > 0,
    queryFn: async () => {
      const endpoint = isSuperAdmin ? `/kader?opd_id=${opdId}` : "/opd-admin/kader";
      const { data } = await apiClient.get(endpoint);
      if (!data.success) throw new Error(data.message || "Gagal memuat kader");
      return (data.data as unknown[]).map((k: unknown) => ({
        label: k.nama_kader as string,
        value: String(k.kader_id),
      }));
    },
    queryKey: KADER_KEYS.byOpd(opdId),
  });

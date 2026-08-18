/**
 * hooks/saran/useSaranList.ts
 * Fetch daftar saran & hotline (hanya untuk Super Admin).
 */
import { useQuery } from "@tanstack/react-query";
import apiClient from "../../lib/axios";
import type { SaranData } from "../../types";

export const SARAN_KEYS = {
  all: ["saran"] as const,
  list: () => [...SARAN_KEYS.all, "list"] as const,
  mine: () => [...SARAN_KEYS.all, "mine"] as const,
};

// Helper: Normalisasi data backend agar field status selalu konsisten
export const normalizeSaranItem = (item: any): SaranData => ({
  ...item,
  catatan_admin: item.catatan_admin || item.tanggapan || null,
  no_hp: item.no_hp || item.telepon || "-",
  pesan: item.pesan || item.isi_saran || "-",
  // Petakan status_keaktifan atau status backend ke enum UI ("Menunggu" | "Selesai")
  status: (item.status === "Selesai" || item.status_keaktifan === "Selesai"
    ? "Selesai"
    : "Menunggu") as SaranData["status"],
});

// Ambil daftar saran dari backend untuk halaman admin.
export const useSaranList = (enabled = true) =>
  useQuery({
    enabled,
    queryFn: async (): Promise<SaranData[]> => {
      const { data } = await apiClient.get("/saran/admin?limit=100");
      if (!data.success) throw new Error(data.message || "Gagal memuat saran masukan");

      const rawList = Array.isArray(data.data)
        ? data.data
        : Array.isArray(data.data?.saran)
        ? data.data.saran
        : [];

      return rawList.map(normalizeSaranItem);
    },
    queryKey: SARAN_KEYS.list(),
    staleTime: 30 * 1000,
  });
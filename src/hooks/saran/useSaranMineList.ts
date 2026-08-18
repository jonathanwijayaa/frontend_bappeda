/**
 * hooks/saran/useSaranMineList.ts
 * Fetch riwayat saran milik user sendiri (relawan / OPD).
 * Menembak endpoint /saran/me agar tidak perlu filter manual di client.
 */
import { useQuery } from "@tanstack/react-query";
import apiClient from "../../lib/axios";
import type { SaranData } from "../../types";
import { SARAN_KEYS, normalizeSaranItem } from "./useSaranList";

/**
 * Hook untuk mengambil daftar saran milik user yang sedang login.
 * Endpoint: GET /saran/me
 */
export const useSaranMineList = (enabled = true) =>
  useQuery({
    enabled,
    queryFn: async (): Promise<SaranData[]> => {
      const { data } = await apiClient.get("/saran/me");
      if (!data.success) throw new Error(data.message || "Gagal memuat riwayat saran");

      const rawList = Array.isArray(data.data)
        ? data.data
        : Array.isArray(data.data?.riwayat_saran)
        ? data.data.riwayat_saran
        : [];

      return rawList.map(normalizeSaranItem);
    },
    queryKey: SARAN_KEYS.mine(),
    staleTime: 30 * 1000,
  });
/**
 * hooks/relawan/useRelawanList.ts
 * Fetch daftar relawan dari backend dan kelompokkan ke dalam RelawanData.
 */
import { useQuery } from "@tanstack/react-query";
import apiClient from "../../lib/axios";
import type { RelawanData } from "../../types";
import { groupRelawanRows } from "../../utils/groupRelawan";

export const RELAWAN_KEYS = {
  all: ["relawan"] as const,
  list: (isSuperAdmin: boolean) => [...RELAWAN_KEYS.all, "list", isSuperAdmin] as const,
};

// Ambil daftar relawan untuk role Super Admin atau OPD.
export const useRelawanList = (isSuperAdmin: boolean) =>
  useQuery({
    queryFn: async (): Promise<RelawanData[]> => {
      const endpoint = isSuperAdmin ? "/admin/relawan" : "/opd-admin/relawan";
      const { data } = await apiClient.get(endpoint);
      if (!data.success) throw new Error(data.message || "Gagal memuat data relawan");
      
      const rawList = Array.isArray(data.data) ? data.data : [];
      return groupRelawanRows(rawList);
    },
    queryKey: RELAWAN_KEYS.list(isSuperAdmin),
    staleTime: 30 * 1000,
  });
/**
 * hooks/relawan/useKaderByOpd.ts
 * Fetch kader berdasarkan opd_id — digunakan di form assignment DataRelawan.
 * Cache per opd_id, sehingga jika OPD sama tidak fetch ulang.
 */
import { useQuery } from "@tanstack/react-query";
import apiClient from "../../lib/axios";
import type { AutoOption } from "../../types/common.types";
import { KADER_KEYS } from "../kader/useKaderList";

const fetchKaderByOpd = async (opdId: number, isOPD: boolean): Promise<AutoOption[]> => {
  const endpoint = isOPD ? "/opd-admin/kader" : `/kader?opd_id=${opdId}`;
  const { data } = await apiClient.get(endpoint);
  if (!data.success) return [];
  return (data.data as { kader_id: number; nama_kader: string }[]).map((k) => ({
    label: k.nama_kader,
    value: String(k.kader_id),
  }));
};

/**
 * Hook yang mengembalikan options kader untuk satu opd_id.
 * Cached per-opd_id sehingga multiple assignment ke OPD yang sama hanya fetch sekali.
 */
// Ambil options kader per OPD dan cache hasilnya agar form assignment lebih cepat.
export const useKaderByOpd = (opdId: number, isOPD: boolean, enabled = true) =>
  useQuery({
    enabled: enabled && (isOPD ? true : opdId > 0),
    queryFn: () => fetchKaderByOpd(opdId, isOPD),
    queryKey: KADER_KEYS.byOpd(opdId),
    staleTime: 5 * 60 * 1000, // 5 menit — kader tidak sering berubah
  });

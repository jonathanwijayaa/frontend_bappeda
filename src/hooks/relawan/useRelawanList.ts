/**
 * hooks/relawan/useRelawanList.ts
 * Fetch daftar relawan dari backend dan kelompokkan ke dalam RelawanData.
 */
import { useQuery } from "@tanstack/react-query";
import apiClient from "../../lib/axios";
import type { RelawanData, RelawanAPIData, Assignment } from "../../types";

export const RELAWAN_KEYS = {
  all: ["relawan"] as const,
  list: (isSuperAdmin: boolean) => [...RELAWAN_KEYS.all, "list", isSuperAdmin] as const,
};

/** Mapping baris API flat → RelawanData untuk tabel */
// Ubah row API relawan menjadi format tabel yang dipakai frontend.
const mapToRelawanData = (r: RelawanAPIData): RelawanData => ({
  alamat: r.alamat_ktp || "-",
  assignments: [],
  jabatan: r.penugasan || "-",
  jenisKelamin: r.jenis_kelamin || "L",
  kader: r.nama_kader || "-",
  kelurahan: r.kelurahan || "-",
  kemantren: r.kemantren || "-",
  namaLengkap: r.nama_lengkap,
  nik: r.nik,
  no_hp: r.no_hp || "-",
  penugasan: r.nama_opd || "-",
  relawan_id: r.relawan_id,
  status_keaktifan: r.status_keaktifan ? "Aktif" : "Tidak Aktif",
  user_id: r.user_id,
});

/**
 * Kelompokkan rows flat API menjadi satu relawan dengan banyak assignment.
 */
// Gabungkan baris API yang berulang menjadi satu relawan dengan daftar assignment.
export const groupRelawanRows = (rows: unknown[]): RelawanData[] => {
  const map = new Map<string, RelawanData>();
  rows.forEach((r) => {
    const key = r.nik;
    if (!map.has(key)) {
      map.set(key, { ...mapToRelawanData(r), assignments: [] });
    }
    if (r.penugasan_id) {
      const entry = map.get(key)!;
      const assignment: Assignment = {
        batasAktif: r.batas_aktif || "",
        detail: r.detail_jabatan || "-",
        id: String(r.penugasan_id),
        kader: r.nama_kader || "-",
        kader_id: r.kader_id ?? null,
        nomorSK: r.nomor_sk || "",
        opd: r.nama_opd || "-",
        opd_id: r.opd_id,
        penugasan: r.penugasan || "-",
        peran: r.jabatan || "-",
        skId: String(r.sk_id || ""),
        status_keaktifan: r.status_keaktifan === "Aktif" ? "Aktif" : "Tidak Aktif",
        tanggalTerbit: r.tanggal_terbit || "",
      };
      entry.assignments!.push(assignment);
    }
  });
  return Array.from(map.values());
};

// Ambil daftar relawan untuk role Super Admin atau OPD.
export const useRelawanList = (isSuperAdmin: boolean) =>
  useQuery({
    queryFn: async (): Promise<RelawanData[]> => {
      const endpoint = isSuperAdmin ? "/admin/relawan" : "/opd-admin/relawan";
      const { data } = await apiClient.get(endpoint);
      if (!data.success) throw new Error(data.message || "Gagal memuat data relawan");
      return groupRelawanRows(data.data);
    },
    queryKey: RELAWAN_KEYS.list(isSuperAdmin),
  });

/**
 * utils/groupRelawan.ts
 * Helper tunggal untuk mengelompokkan baris flat API relawan menjadi per-relawan
 * dengan daftar assignment. Menggantikan duplikasi:
 * - groupRelawanRows() di useRelawanList.ts
 * - groupRelawanData() di HistoriRelawan.tsx
 */
import type { RelawanData, Assignment } from "../types/relawan.types";

interface RawRelawanRow {
  alamat_ktp?: string;
  batas_aktif?: string;
  detail_jabatan?: string;
  jabatan?: string;
  jenis_kelamin?: string;
  kader_id?: number | null;
  kelurahan?: string;
  kemantren?: string;
  nama_kader?: string;
  nama_lengkap: string;
  nama_opd?: string;
  nik: string;
  no_hp?: string;
  nomor_sk?: string;
  opd_id?: number;
  penugasan?: string;
  penugasan_id?: number;
  relawan_id?: number;
  sk_id?: number;
  status_keaktifan?: boolean | string;
  status_penugasan?: string;
  tahun?: number | string;
  tanggal_terbit?: string;
  user_id?: number;
}

/**
 * Kelompokkan rows flat API menjadi satu relawan dengan banyak assignment.
 * Berfungsi sebagai adapter sementara sebelum backend beralih ke format nested JSON.
 */
export const groupRelawanRows = (rows: RawRelawanRow[]): RelawanData[] => {
  const map = new Map<string, RelawanData>();

  rows.forEach((r) => {
    const key = r.nik;
    if (!map.has(key)) {
      map.set(key, {
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
        status_keaktifan:
          r.status_keaktifan === true || r.status_keaktifan === "Aktif"
            ? "Aktif"
            : "Tidak Aktif",
        user_id: r.user_id,
      });
    }

    // Cek apakah ada data penugasan yang bermakna
    const hasAssignment = r.penugasan_id || r.nama_opd || r.penugasan || r.nama_kader;
    if (hasAssignment) {
      const entry = map.get(key)!;
      const assignment: Assignment = {
        batasAktif: r.batas_aktif || "",
        detail: r.detail_jabatan || "-",
        id: r.penugasan_id?.toString() || Math.random().toString(),
        kader: r.nama_kader || "-",
        kader_id: r.kader_id ?? null,
        nomorSK: r.nomor_sk || "",
        opd: r.nama_opd || "-",
        opd_id: r.opd_id,
        penugasan: r.penugasan || "-",
        peran: r.jabatan || "-",
        skId: String(r.sk_id || ""),
        status_keaktifan:
          r.status_penugasan === "Aktif" || r.status_penugasan === "Tidak Aktif"
            ? r.status_penugasan
            : r.status_keaktifan === true || r.status_keaktifan === "Aktif"
              ? "Aktif"
              : "Tidak Aktif",
        tahun: r.tahun,
        tahunMulai: r.tanggal_terbit ? new Date(r.tanggal_terbit).getFullYear() : undefined,
        tahunSelesai: r.batas_aktif ? new Date(r.batas_aktif).getFullYear() : undefined,
        tanggalTerbit: r.tanggal_terbit || "",
      };
      entry.assignments!.push(assignment);
    }
  });

  return Array.from(map.values());
};

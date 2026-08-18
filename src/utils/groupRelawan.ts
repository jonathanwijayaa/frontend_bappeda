/**
 * utils/groupRelawan.ts
 * Helper adapter untuk menormalisasi payload relawan dari backend.
 * Mendukung format Nested JSON (baru) maupun Flat Rows (legacy fallback).
 */
import type { RelawanData, Assignment } from "../types/relawan.types";

interface RawRelawanRow {
  alamat_ktp?: string;
  alamat?: string;
  assignments?: any[];
  batas_aktif?: string;
  detail_jabatan?: string;
  detail?: string;
  jabatan?: string;
  jenis_kelamin?: string;
  kader_id?: number | null;
  kader?: string;
  kelurahan?: string;
  kemantren?: string;
  nama_kader?: string;
  nama_lengkap?: string;
  namaLengkap?: string;
  nama_opd?: string;
  nik: string;
  no_hp?: string;
  nomor_sk?: string;
  opd_id?: number;
  opd?: string;
  penugasan?: string;
  penugasan_id?: number;
  peran?: string;
  relawan_id?: number;
  sk_id?: number;
  status_keaktifan?: boolean | string;
  status_penugasan?: string;
  tahun?: number | string;
  tanggal_terbit?: string;
  user_id?: number;
}

/**
 * Normalisasi data relawan dari API ke RelawanData[]
 */
export const groupRelawanRows = (rows: RawRelawanRow[] | any[]): RelawanData[] => {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  // ── 1. SAFE GUARD: Jika backend sudah mengembalikan format Nested JSON ──
  const isAlreadyNested = Array.isArray(rows[0]?.assignments);

  if (isAlreadyNested) {
    return rows.map((row: any) => ({
      alamat: row.alamat_ktp || row.alamat || "-",
      assignments: Array.isArray(row.assignments)
        ? row.assignments.map((a: any) => ({
            batasAktif: a.batas_aktif || a.batasAktif || "",
            detail: a.detail_jabatan || a.detail || "-",
            id: String(a.penugasan_id || a.id || Math.random()),
            kader: a.nama_kader || a.kader || "-",
            kader_id: a.kader_id ?? null,
            nomorSK: a.nomor_sk || a.nomorSK || "",
            opd: a.nama_opd || a.opd || "-",
            opd_id: a.opd_id,
            penugasan: a.penugasan || "-",
            peran: a.jabatan || a.peran || "-",
            skId: String(a.sk_id || a.skId || ""),
            status_keaktifan:
              a.status_penugasan === "Aktif" ||
              a.status_penugasan === "Tidak Aktif" ||
              a.status_keaktifan === "Aktif" ||
              a.status_keaktifan === "Tidak Aktif"
                ? a.status_penugasan || a.status_keaktifan
                : a.status_keaktifan === true
                ? "Aktif"
                : "Tidak Aktif",
            tahun: a.tahun,
            tahunMulai: a.tanggal_terbit
              ? new Date(a.tanggal_terbit).getFullYear()
              : a.tahunMulai ?? undefined,
            tahunSelesai: a.batas_aktif
              ? new Date(a.batas_aktif).getFullYear()
              : a.tahunSelesai ?? undefined,
            tanggalTerbit: a.tanggal_terbit || a.tanggalTerbit || "",
          }))
        : [],
      jabatan: row.jabatan || row.penugasan || "-",
      jenisKelamin: row.jenis_kelamin || row.jenisKelamin || "L",
      kader: row.kader || row.nama_kader || "-",
      kelurahan: row.kelurahan || "-",
      kemantren: row.kemantren || "-",
      namaLengkap: row.nama_lengkap || row.namaLengkap || "",
      nik: row.nik,
      no_hp: row.no_hp || "-",
      penugasan: row.nama_opd || row.penugasan || "-",
      relawan_id: row.relawan_id,
      status_keaktifan:
        row.status_keaktifan === true || row.status_keaktifan === "Aktif"
          ? "Aktif"
          : "Tidak Aktif",
      user_id: row.user_id,
    }));
  }

  // ── 2. FALLBACK: Jika backend masih mengirim baris flat join (Legacy) ──
  const map = new Map<string, RelawanData>();

  rows.forEach((r: any) => {
    const key = r.nik;
    if (!map.has(key)) {
      map.set(key, {
        alamat: r.alamat_ktp || r.alamat || "-",
        assignments: [],
        jabatan: r.penugasan || "-",
        jenisKelamin: r.jenis_kelamin || "L",
        kader: r.nama_kader || "-",
        kelurahan: r.kelurahan || "-",
        kemantren: r.kemantren || "-",
        namaLengkap: r.nama_lengkap || r.namaLengkap || "",
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

// Ekspor alias agar kompatibel dengan pemanggilan fungsi bernama normalizeRelawanPayload
export const normalizeRelawanPayload = groupRelawanRows;
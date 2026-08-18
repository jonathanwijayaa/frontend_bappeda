// Relawan (Volunteer) Data Types

// ── Assignment (penugasan per relawan) ──────────────────────────
export interface Assignment {
  // Tanggal terbit SK
  batasAktif?: string;
  detail: string;
  id: string;
  kader: string;
  kader_id: number | null;
  nomorSK: string;
  opd: string;
  opd_id?: number;
  penugasan?: string;
  peran: string;
  skId: string;
  status_keaktifan: "Aktif" | "Tidak Aktif";
  tahun?: number | string;
  tahunMulai?: number | null;
  tahunSelesai?: number | null;
  // Reference to SK document
  tanggalTerbit?: string; // Batas aktif SK
}

// ── RelawanData — dipakai di tabel DataRelawan ──────────────────
export interface RelawanData {
  alamat: string;
  assignments?: Assignment[];
  jabatan: string;
  jenisKelamin?: string;
  kader: string;
  kelurahan: string;
  kemantren: string;
  namaLengkap: string;
  nik: string;
  no_hp: string;
  penugasan: string;
  relawan_id?: number;
  status_keaktifan: string;
  user_id?: number;
}

// ── Response mentah dari API (flat row per penugasan) ───────────
export interface RelawanAPIData {
  alamat_ktp: string | null;
  email: string | null;
  jenis_kelamin: string;
  kelurahan: string | null;
  kemantren: string | null;
  nama_kader: string | null;
  nama_lengkap: string;
  nama_opd: string | null;
  nik: string;
  no_hp: string | null;
  penugasan: string | null;
  relawan_id: number;
  status_keaktifan: boolean;
  status_penugasan: string | null;
  user_id: number;
}

// ── Pengajuan perubahan data relawan ────────────────────────────
export interface PengajuanAPIData {
  catatan_relawan: string | null;
  data_baru?: unknown;
  data_lama?: unknown;
  jenis_perubahan: string;
  nama_lengkap: string;
  nik: string;
  pengajuan_id: number;
  relawan_id: number;
  status_pengajuan: string;
  tanggal_pengajuan: string;
}

// ── Legacy / UI form data ────────────────────────────────────────
export interface PengajuanData {
  catatanRelawan?: string;
  dataBaru?: Record<string, string>;
  dataLama?: Record<string, string>;
  namaLengkap: string;
  nik: string;
  status_pengajuan: string;
  tanggalPengajuan: string;
}

export interface RelawanFormData {
  alamat: string;
  assignments: Assignment[];
  jabatan: string;
  jenisKelamin: string;
  kader: string;
  kelurahan: string;
  kemantren: string;
  namaRelawan: string;
  nik: string;
  penugasan: string;
}

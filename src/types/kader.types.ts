// Kader Data Types — sesuai response API backend

export interface KaderData {
  created_at: string;
  deskripsi: string | null;
  /** Jumlah anggota — khusus response OPD */
  jumlah_anggota?: number;
  kader_id: number;
  nama_kader: string;
  nama_opd: string;
  opd_id: number;
  /** PIC — dari tabel pic_kader → relawan → users */
  pic_nama: string | null;
  pic_nik: string | null;
  pic_no_hp: string | null;
  pic_relawan_id: number | null;
  pic_tanggal_mulai: string | null;
  status_keaktifan: boolean;
  updated_at: string;
}

export interface OPDOption {
  nama_opd: string;
  opd_id: number;
}

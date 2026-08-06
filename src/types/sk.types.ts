// Surat Keputusan (SK) Data Types — sesuai response API backend

export interface SKData {
  batas_aktif: string | null;
  has_file: boolean;
  judul_sk: string | null;
  jumlah_relawan: number;
  nama_opd: string;
  nomor_sk: string;
  opd_id?: number;
  sk_id: number;
  status_keaktifan: string;
  tanggal_terbit: string | null;
}

export interface SKRelawanItem {
  jabatan: string | null;
  kader_id: number | null;
  nama_kader: string | null;
  nama_lengkap: string;
  nik: string;
  no_hp: string | null;
  penugasan_id: number;
  status_keaktifan: string;
}

export interface SKDetail extends SKData {
  daftar_relawan: SKRelawanItem[];
  file_path?: string;
}

export interface ErrorHint {
  link?: string;
  link_text?: string;
  steps: string[];
  title: string;
}
export interface SKUploadMetadata {
    batasAktif?: string;
    judulSK: string;
    kader_ids?: string | number[];
    nomorSK: string;
    opd_id: string | number;
    tanggalTerbit: string;
  }
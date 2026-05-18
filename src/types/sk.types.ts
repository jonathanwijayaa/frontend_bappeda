// Surat Keputusan (SK) Data Types — sesuai response API backend

export interface SKData {
    sk_id: number;
    nomor_sk: string;
    judul_sk: string | null;
    tanggal_terbit: string | null;
    batas_aktif: string | null;
    status_keaktifan: string;
    nama_opd: string;
    opd_id?: number;
    jumlah_relawan: number;
    has_file: boolean;
}

export interface SKRelawanItem {
    penugasan_id: number;
    nik: string;
    nama_lengkap: string;
    no_hp: string | null;
    nama_kader: string | null;
    kader_id: number | null;
    status_keaktifan: string;
    jabatan: string | null;
}

export interface SKDetail extends SKData {
    file_path?: string;
    daftar_relawan: SKRelawanItem[];
}

export interface ErrorHint {
    title: string;
    steps: string[];
    link?: string;
    link_text?: string;
}

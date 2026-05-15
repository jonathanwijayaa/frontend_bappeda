// Kader Data Types — sesuai response API backend

export interface KaderData {
    kader_id: number;
    nama_kader: string;
    deskripsi: string | null;
    nama_opd: string;
    opd_id: number;
    status_keaktifan: boolean;
    created_at: string;
    updated_at: string;
    /** PIC — dari tabel pic_kader → relawan → users */
    pic_nama: string | null;
    pic_nik: string | null;
    pic_no_hp: string | null;
    pic_relawan_id: number | null;
    pic_tanggal_mulai: string | null;
    /** Jumlah anggota — khusus response OPD */
    jumlah_anggota?: number;
}

export interface OPDOption {
    opd_id: number;
    nama_opd: string;
}

// Relawan (Volunteer) Data Types

// ── Assignment (penugasan per relawan) ──────────────────────────
export interface Assignment {
    id: string;
    opd: string;
    opd_id?: number;
    kader: string;
    kader_id: number | null;
    peran: string;
    detail: string;
    penugasan?: string;
    statusKeaktifan: 'Aktif' | 'Nonaktif';
    nomorSK: string;
    skId: string; // Reference to SK document
}

// ── RelawanData — dipakai di tabel DataRelawan ──────────────────
export interface RelawanData {
    relawan_id?: number;
    no_hp: string;
    user_id?: number;
    nik: string;
    namaLengkap: string;
    alamat: string;
    kelurahan: string;
    kader: string;
    jabatan: string;
    penugasan: string;
    jenisKelamin?: string;
    assignments?: Assignment[];
}

// ── Response mentah dari API (flat row per penugasan) ───────────
export interface RelawanAPIData {
    user_id: number;
    nik: string;
    nama_lengkap: string;
    email: string | null;
    no_hp: string | null;
    is_active: boolean;
    relawan_id: number;
    jenis_kelamin: string;
    alamat_ktp: string | null;
    kelurahan: string | null;
    penugasan: string | null;
    status_penugasan: string | null;
    nama_opd: string | null;
    nama_kader: string | null;
}

// ── Pengajuan perubahan data relawan ────────────────────────────
export interface PengajuanAPIData {
    pengajuan_id: number;
    jenis_perubahan: string;
    status: string;
    tanggal_pengajuan: string;
    catatan_relawan: string | null;
    nama_lengkap: string;
    nik: string;
    relawan_id: number;
    data_baru?: any;
    data_lama?: any;
}

// ── Legacy / UI form data ────────────────────────────────────────
export interface PengajuanData {
    nik: string;
    namaLengkap: string;
    tanggalPengajuan: string;
    status: string;
    dataLama?: { [key: string]: string };
    dataBaru?: { [key: string]: string };
    catatanRelawan?: string;
}

export interface RelawanFormData {
    namaRelawan: string;
    nik: string;
    alamat: string;
    kelurahan: string;
    kader: string;
    jabatan: string;
    penugasan: string;
    jenisKelamin: string;
    assignments: Assignment[];
}

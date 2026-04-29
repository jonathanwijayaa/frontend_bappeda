// Histori Relawan Types — digunakan di halaman HistoriRelawan

export interface HistoriAssignment {
    id: string;
    opd: string;
    opd_id?: number;
    kader: string;
    kader_id?: number | null;
    peran: string;
    detail: string;
    penugasan?: string;
    statusKeaktifan: string;
    nomorSK?: string;
    tahun?: number | string;
    tahunMulai?: number | null;
    tahunSelesai?: number | null;
}

export interface HistoriRelawanData {
    nik: string;
    namaLengkap: string;
    alamat: string;
    no_hp: string;
    kelurahan: string;
    jenisKelamin: string;
    kader: string;
    jabatan: string;
    penugasan: string;
    relawan_id?: number;
    user_id?: number;
    assignments: HistoriAssignment[];
}

// Relawan (Volunteer) Data Types

// Assignment interface for volunteer assignments
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

export interface PengajuanData {
    nik: string;
    namaLengkap: string;
    tanggalPengajuan: string;
    status: string;
    dataLama?: {
        [key: string]: string;
    };
    dataBaru?: {
        [key: string]: string;
    };
    catatanRelawan?: string;
}

export interface RelawanData {
    user_id?: number;
    nik: string;
    namaLengkap: string;
    alamat: string;
    kelurahan: string;
    kader: string;
    jabatan: string;
    penugasan: string;
    jenisKelamin?: string;
    assignments?: Assignment[]; // Multiple assignments
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

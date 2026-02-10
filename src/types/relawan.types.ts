// Relawan (Volunteer) Data Types

// Assignment interface for volunteer assignments
export interface Assignment {
    id: string;
    opd: string;
    kader: string;
    peran: string;
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
    nik: string;
    namaLengkap: string;
    jenisKelamin: string;
    noTelepon: string;
    alamat?: string;
    assignments?: Assignment[]; // Multiple assignments
}

export interface RelawanFormData {
    namaRelawan: string;
    nik: string;
    jenisKelamin: string;
    alamat: string;
    noHp: string;
    assignments: Assignment[];
}

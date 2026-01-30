// Relawan (Volunteer) Data Types
export interface PengajuanData {
    nik: string;
    namaLengkap: string;
    tanggalPengajuan: string;
    status: string;
}

export interface RelawanData {
    nik: string;
    namaLengkap: string;
    jenisKelamin: string;
    noTelepon: string;
}

export interface RelawanFormData {
    namaRelawan: string;
    nik: string;
    jenisKelamin: string;
    alamat: string;
    noHp: string;
    opd: string;
    komunitas: string;
    peran: string;
    statusKeaktifan: string;
}

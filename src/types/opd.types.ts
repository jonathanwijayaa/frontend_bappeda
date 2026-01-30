// OPD (Organisasi Perangkat Daerah) Data Types
export interface OPDData {
    id: number;
    namaOpd: string;
    kode: string;
    status: string;
    alamat: string;
    pic: string;
    kontak: string;
}

export interface OPDFormData {
    namaOpd: string;
    status: string;
    alamat: string;
    pic: string;
    kontak: string;
}

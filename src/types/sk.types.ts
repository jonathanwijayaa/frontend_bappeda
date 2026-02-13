// Surat Keputusan (Decision Letter) Types
export interface SKData {
    id: string;
    nomorSK: string;
    judulSK: string;
    tanggalTerbit: string;
    batasAktif: string;
    opdId: number;
    namaOPD: string;
    namaKader?: string;
    jumlahRelawan: number;
    status: 'Aktif' | 'Nonaktif';
    filePath?: string;
}

export interface SKFormData {
    nomorSK: string;
    judulSK: string;
    tanggalTerbit: string;
    opdId: number;
    namaOPD: string;
    namaKader?: string;
    status: 'Aktif' | 'Nonaktif';
}

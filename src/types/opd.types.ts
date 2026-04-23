// OPD Data Types — sesuai response API backend

export interface OPDData {
    opd_id: number;
    nama_opd: string;
    alamat: string | null;
    pic: string | null;
    nik_pic: string | null;
    kontak: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

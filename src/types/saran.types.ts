// Saran & Hotline Types — sesuai response API backend

export interface SaranData {
    saran_id: number;
    nama_lengkap: string;
    no_hp: string;
    subjek: string | null;
    pesan: string;
    status: 'Menunggu' | 'Selesai';
    catatan_admin: string | null;
    created_at: string;
    updated_at: string;
    role: string;
}

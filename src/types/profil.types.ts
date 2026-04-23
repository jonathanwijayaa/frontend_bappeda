// Profil Types — sesuai response API backend /profile/me

export interface ProfileData {
    user_id: number;
    nik: string;
    nama_lengkap: string;
    no_hp: string | null;
    email: string | null;
    role: string;
}

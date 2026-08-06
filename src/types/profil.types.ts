// Profil Types — sesuai response API backend /profile/me

export interface ProfileData {
  email: string | null;
  foto_profil?: string | null;
  nama_lengkap: string;
  nik: string;
  no_hp: string | null;
  role: string;
  user_id: number;
}

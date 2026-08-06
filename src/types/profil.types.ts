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

export interface ProfilDataRelawan {
  alamat_ktp: string | null;
  jenis_kelamin: string;
  kelurahan: string | null;
  kemantren: string | null;
  nama_lengkap: string;
  nik: string;
  no_hp: string | null;
}

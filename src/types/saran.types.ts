// Saran & Hotline Types — sesuai response API backend

export interface SaranData {
  catatan_admin: string | null;
  created_at: string;
  nama_lengkap: string;
  no_hp: string;
  pesan: string;
  role: string;
  saran_id: number;
  status: "Menunggu" | "Selesai";
  subjek: string | null;
  updated_at: string;
}

export interface HotlineInfo {
  jam_layanan: string;
  telepon: string;
  updated_at?: string | null;
  whatsapp: string;
}

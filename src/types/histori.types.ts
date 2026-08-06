// Histori Relawan Types — digunakan di halaman HistoriRelawan

export interface HistoriAssignment {
  batasAktif?: string;
  detail: string;
  id: string;
  kader: string;
  kader_id?: number | null;
  nomorSK?: string;
  opd: string;
  opd_id?: number;
  penugasan?: string;
  peran: string;
  status_keaktifan: string;
  tahun?: number | string;
  tahunMulai?: number | null;
  tahunSelesai?: number | null;
  tanggalTerbit?: string;
}

export interface HistoriRelawanData {
  alamat: string;
  assignments: HistoriAssignment[];
  jabatan: string;
  jenisKelamin: string;
  kader: string;
  kelurahan: string;
  kemantren: string;
  namaLengkap: string;
  nik: string;
  no_hp: string;
  penugasan: string;
  relawan_id?: number;
  user_id?: number;
}

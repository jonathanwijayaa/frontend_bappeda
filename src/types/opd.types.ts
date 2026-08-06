// OPD Data Types — sesuai response API backend

export interface OPDData {
  alamat: string | null;
  created_at: string;
  kontak: string | null;
  nama_opd: string;
  nik_pic: string | null;
  opd_id: number;
  pic: string | null;
  status_keaktifan: boolean;
  updated_at: string;
}

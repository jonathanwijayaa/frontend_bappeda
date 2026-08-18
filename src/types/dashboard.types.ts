// Dashboard Chart Data Types
export interface ChartDataItem {
  [key: string]: number | string;
  name: string;
}

export interface DashboardData {
  grafik_relawan_per_opd: { jumlah_relawan: number; nama_opd: string }[];
  nama_opd?: string;
  ringkasan: {
    pengajuan_pending: number;
    total_kader: number;
    total_opd: number;
    total_relawan_aktif: number;
  };
}

export interface TopRelawanItem {
  relawan_id: number;
  nama_lengkap: string;
  nama_opd?: string;
  total_penugasan: number;
}

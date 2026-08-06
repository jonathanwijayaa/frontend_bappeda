// Riwayat Pengajuan Types (Relawan) — sesuai response API backend /relawan/history

export interface PengajuanItem {
  catatan_relawan: string | null;
  catatan_verifikator: string | null;
  data_baru?: Record<string, unknown>;
  data_lama?: Record<string, unknown>;
  jenis_perubahan: string;
  pengajuan_id: number;
  status: "Diterima" | "Ditolak" | "Menunggu Review";
  tanggal_pengajuan: string;
  tanggal_verifikasi: string | null;
}

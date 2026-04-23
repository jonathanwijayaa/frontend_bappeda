// Riwayat Pengajuan Types (Relawan) — sesuai response API backend /relawan/history

export interface PengajuanItem {
    pengajuan_id: number;
    jenis_perubahan: string;
    status: 'Menunggu Review' | 'Diterima' | 'Ditolak';
    catatan_relawan: string | null;
    catatan_verifikator: string | null;
    tanggal_pengajuan: string;
    tanggal_verifikasi: string | null;
    data_baru?: Record<string, any>;
    data_lama?: Record<string, any>;
}

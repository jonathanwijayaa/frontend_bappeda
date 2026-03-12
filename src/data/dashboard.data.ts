// TODO: File ini sudah tidak dipakai untuk Super Admin (sudah fetch dari API). Hapus setelah OPD dashboard juga disambungkan.
import { ChartDataItem } from '../types/dashboard.types';

// Sample data Super Admin - OPD Chart
export const mockOPDChartData: ChartDataItem[] = [
    { name: 'Dinas Kesehatan', jumlah: 450 },
    { name: 'Dinas Pendidikan', jumlah: 350 },
    { name: 'Dinas Perhubungan', jumlah: 320 },
    { name: 'Dinas Sosial', jumlah: 480 },
    { name: 'Dinas Pekerjaan Umum', jumlah: 390 },
    { name: 'Dinas Pariwisata', jumlah: 430 },
    { name: 'Dinas Pertanian', jumlah: 360 },
    { name: 'Dinas Perindustrian', jumlah: 330 },
];

// Sample data for OPD - Kader Chart
export const mockKaderChartData: ChartDataItem[] = [
    { name: 'Kader Kesehatan', jumlah: 30 },
    { name: 'Kader Pendidikan', jumlah: 40 },
    { name: 'Kader Sosial Kemasyarakatan', jumlah: 47 },
    { name: 'Kader Lingkungan', jumlah: 43 },
    { name: 'Kader Ekonomi Kreatif', jumlah: 48 },
];

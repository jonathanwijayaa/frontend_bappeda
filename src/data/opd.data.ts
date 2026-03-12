// TODO: Ganti mock data ini dengan API call ke GET /api/opd
import { OPDData } from '../types/opd.types';

export const mockOPDData: OPDData[] = [
    {
        id: 1,
        namaOpd: 'Dinas Kesehatan',
        status: 'Aktif',
        alamat: 'Jl. Malioboro No. 56, Yogyakarta',
        pic: 'Jonathan Wijaya',
        kontak: '0812-3456-7890'
    },
    {
        id: 2,
        namaOpd: 'Dinas Pendidikan',
        status: 'Aktif',
        alamat: 'Jl. Kenari No. 12, Yogyakarta',
        pic: 'Siti Aminah',
        kontak: '0813-4567-8901'
    },
    {
        id: 3,
        namaOpd: 'Dinas Perhubungan',
        status: 'Aktif',
        alamat: 'Jl. Sudirman No. 45, Yogyakarta',
        pic: 'Budi Santoso',
        kontak: '0814-5678-9012'
    },
    {
        id: 4,
        namaOpd: 'Dinas Sosial',
        status: 'Nonaktif',
        alamat: 'Jl. Ahmad Yani No. 78, Yogyakarta',
        pic: 'Dewi Lestari',
        kontak: '0815-6789-0123'
    },
    {
        id: 5,
        namaOpd: 'Dinas Pekerjaan Umum',
        status: 'Aktif',
        alamat: 'Jl. Gajah Mada No. 23, Yogyakarta',
        pic: 'Andi Pratama',
        kontak: '0816-7890-1234'
    },
    {
        id: 6,
        namaOpd: 'Dinas Pariwisata',
        status: 'Aktif',
        alamat: 'Jl. Tugu No. 34, Yogyakarta',
        pic: 'Maya Sari',
        kontak: '0817-8901-2345'
    },
    {
        id: 7,
        namaOpd: 'Dinas Pertanian',
        status: 'Aktif',
        alamat: 'Jl. Kaliurang KM 5, Yogyakarta',
        pic: 'Rudi Hartono',
        kontak: '0818-9012-3456'
    },
    {
        id: 8,
        namaOpd: 'Dinas Perindustrian',
        status: 'Aktif',
        alamat: 'Jl. Ring Road Utara No. 89, Yogyakarta',
        pic: 'Lina Kusuma',
        kontak: '0819-0123-4567'
    },
];

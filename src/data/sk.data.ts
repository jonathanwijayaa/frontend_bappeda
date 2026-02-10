import { SKData } from '../types/sk.types';

export const mockSKData: SKData[] = [
    {
        id: 'SK001',
        nomorSK: 'SK/001/KESEHATAN/2024',
        judulSK: 'SK Penugasan Relawan Kader Pembangunan Daerah A',
        tanggalTerbit: '15 Januari 2024',
        opdId: 1,
        namaOPD: 'Dinas Kesehatan',
        namaKader: 'Kader Pembangunan Daerah A',
        jumlahRelawan: 15,
        status: 'Aktif',
        filePath: '/documents/sk-001.pdf'
    },
    {
        id: 'SK002',
        nomorSK: 'SK/002/PENDIDIKAN/2024',
        judulSK: 'SK Penugasan Relawan Kader Pemberdayaan Masyarakat B',
        tanggalTerbit: '20 Januari 2024',
        opdId: 2,
        namaOPD: 'Dinas Pendidikan',
        namaKader: 'Kader Pemberdayaan Masyarakat B',
        jumlahRelawan: 12,
        status: 'Aktif',
        filePath: '/documents/sk-002.pdf'
    },
    {
        id: 'SK003',
        nomorSK: 'SK/003/DINSOS/2024',
        judulSK: 'SK Penugasan Relawan OPD Dinas Sosial',
        tanggalTerbit: '25 Januari 2024',
        opdId: 4,
        namaOPD: 'Dinas Sosial',
        jumlahRelawan: 20,
        status: 'Aktif',
        filePath: '/documents/sk-003.pdf'
    },
    {
        id: 'SK004',
        nomorSK: 'SK/004/PERHUBUNGAN/2024',
        judulSK: 'SK Penugasan Relawan Kader Lingkungan Hidup C',
        tanggalTerbit: '01 Februari 2024',
        opdId: 3,
        namaOPD: 'Dinas Perhubungan',
        namaKader: 'Kader Lingkungan Hidup C',
        jumlahRelawan: 10,
        status: 'Aktif',
        filePath: '/documents/sk-004.pdf'
    },
    {
        id: 'SK005',
        nomorSK: 'SK/005/DISHUB/2024',
        judulSK: 'SK Penugasan Relawan OPD Dinas Perhubungan',
        tanggalTerbit: '05 Februari 2024',
        opdId: 3,
        namaOPD: 'Dinas Perhubungan',
        jumlahRelawan: 18,
        status: 'Aktif',
        filePath: '/documents/sk-005.pdf'
    },
    {
        id: 'SK006',
        nomorSK: 'SK/006/KESEHATAN/2024',
        judulSK: 'SK Penugasan Relawan Kader Kesehatan D',
        tanggalTerbit: '10 Februari 2024',
        opdId: 1,
        namaOPD: 'Dinas Kesehatan',
        namaKader: 'Kader Kesehatan D',
        jumlahRelawan: 14,
        status: 'Aktif',
        filePath: '/documents/sk-006.pdf'
    },
    {
        id: 'SK007',
        nomorSK: 'SK/007/DISDIK/2024',
        judulSK: 'SK Penugasan Relawan OPD Dinas Pendidikan',
        tanggalTerbit: '15 Februari 2024',
        opdId: 2,
        namaOPD: 'Dinas Pendidikan',
        jumlahRelawan: 25,
        status: 'Aktif',
        filePath: '/documents/sk-007.pdf'
    },
    {
        id: 'SK008',
        nomorSK: 'SK/008/PARIWISATA/2023',
        judulSK: 'SK Penugasan Relawan Kader Ekonomi Kreatif E (Nonaktif)',
        tanggalTerbit: '20 Desember 2023',
        opdId: 6,
        namaOPD: 'Dinas Pariwisata',
        namaKader: 'Kader Ekonomi Kreatif E',
        jumlahRelawan: 8,
        status: 'Nonaktif',
        filePath: '/documents/sk-008.pdf'
    },
];

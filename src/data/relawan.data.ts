import { PengajuanData, RelawanData } from '../types/relawan.types';

export const mockPengajuanData: PengajuanData[] = [
    {
        nik: '1234567890123456',
        namaLengkap: 'Mingyu Gantenk 123',
        tanggalPengajuan: 'Senin, 01-01-2021 07:07:07',
        status: 'Menunggu',
        dataLama: {
            'No. Telepon': '081234xxxxxx'
        },
        dataBaru: {
            'No. Telepon': '089876xxxxxx'
        },
        catatanRelawan: 'Nomor yang lama udah mati kartunya'
    },
];

export const mockRelawanData: RelawanData[] = [
    {
        nik: '3201012345670001',
        namaLengkap: 'Jonathan Wijaya',
        jenisKelamin: 'Laki-Laki',
        noTelepon: '081234567890',
        alamat: 'Jl. Merdeka No. 123, Bandung',
        assignments: [
            {
                id: 'A001',
                opd: 'Bappeda Kota Bandung',
                kader: 'Kader Pembangunan Daerah A',
                peran: 'Koordinator',
                statusKeaktifan: 'Aktif',
                nomorSK: 'SK/001/BAPPEDA/2024',
                skId: 'SK001'
            }
        ]
    },
    {
        nik: '3201012345670002',
        namaLengkap: 'Siti Nurhaliza',
        jenisKelamin: 'Perempuan',
        noTelepon: '081234567891',
        alamat: 'Jl. Asia Afrika No. 45, Bandung',
        assignments: [
            {
                id: 'A002',
                opd: 'Bappeda Kota Bandung',
                kader: 'Kader Pemberdayaan Masyarakat B',
                peran: 'Anggota',
                statusKeaktifan: 'Aktif',
                nomorSK: 'SK/002/BAPPEDA/2024',
                skId: 'SK002'
            },
            {
                id: 'A003',
                opd: 'Dinas Sosial Kota Bandung',
                kader: '-',
                peran: 'Koordinator',
                statusKeaktifan: 'Aktif',
                nomorSK: 'SK/003/DINSOS/2024',
                skId: 'SK003'
            }
        ]
    },
    {
        nik: '3201012345670003',
        namaLengkap: 'Budi Santoso',
        jenisKelamin: 'Laki-Laki',
        noTelepon: '081234567892',
        alamat: 'Jl. Braga No. 78, Bandung',
        assignments: [
            {
                id: 'A004',
                opd: 'Bappeda Kota Bandung',
                kader: 'Kader Lingkungan Hidup C',
                peran: 'Anggota',
                statusKeaktifan: 'Aktif',
                nomorSK: 'SK/004/BAPPEDA/2024',
                skId: 'SK004'
            }
        ]
    },
    {
        nik: '3201012345670004',
        namaLengkap: 'Dewi Lestari',
        jenisKelamin: 'Perempuan',
        noTelepon: '081234567893',
        alamat: 'Jl. Dago No. 234, Bandung',
        assignments: [
            {
                id: 'A005',
                opd: 'Dinas Perhubungan Kota Bandung',
                kader: '-',
                peran: 'Anggota',
                statusKeaktifan: 'Aktif',
                nomorSK: 'SK/005/DISHUB/2024',
                skId: 'SK005'
            }
        ]
    },
    {
        nik: '3201012345670005',
        namaLengkap: 'Ahmad Fauzi',
        jenisKelamin: 'Laki-Laki',
        noTelepon: '081234567894',
        alamat: 'Jl. Cihampelas No. 56, Bandung',
        assignments: [
            {
                id: 'A006',
                opd: 'Bappeda Kota Bandung',
                kader: 'Kader Kesehatan D',
                peran: 'Koordinator',
                statusKeaktifan: 'Aktif',
                nomorSK: 'SK/006/BAPPEDA/2024',
                skId: 'SK006'
            },
            {
                id: 'A007',
                opd: 'Dinas Pendidikan Kota Bandung',
                kader: '-',
                peran: 'Anggota',
                statusKeaktifan: 'Aktif',
                nomorSK: 'SK/007/DISDIK/2024',
                skId: 'SK007'
            }
        ]
    },
    {
        nik: '3201012345670006',
        namaLengkap: 'Rina Marlina',
        jenisKelamin: 'Perempuan',
        noTelepon: '081234567895',
        alamat: 'Jl. Setiabudhi No. 89, Bandung',
        assignments: [
            {
                id: 'A008',
                opd: 'Bappeda Kota Bandung',
                kader: 'Kader Ekonomi Kreatif E',
                peran: 'Anggota',
                statusKeaktifan: 'Nonaktif',
                nomorSK: 'SK/008/BAPPEDA/2023',
                skId: 'SK008'
            }
        ]
    },
];

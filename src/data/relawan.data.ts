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
        namaLengkap: 'Budi Santoso',
        jenisKelamin: 'Laki-Laki',
        noTelepon: '081234567801',
        alamat: 'Jl. Malioboro No. 1, Yogyakarta',
        assignments: [
            { id: 'ASG001', opd: 'Dinas Kesehatan', kader: 'Kader Kesehatan', peran: 'Koordinator', statusKeaktifan: 'Aktif', nomorSK: 'SK/001/KESEHATAN/2024', skId: 'SK001' },
            { id: 'ASG022', opd: 'Dinas Kesehatan', kader: 'Kader Kesehatan', peran: 'Koordinator', statusKeaktifan: 'Aktif', nomorSK: 'SK/006/KESEHATAN/2024', skId: 'SK006' }
        ]
    },
    {
        nik: '3201012345670002',
        namaLengkap: 'Siti Nurhaliza',
        jenisKelamin: 'Perempuan',
        noTelepon: '081234567802',
        alamat: 'Jl. Solo No. 2, Yogyakarta',
        assignments: [{ id: 'ASG002', opd: 'Dinas Kesehatan', kader: 'Kader Kesehatan', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/001/KESEHATAN/2024', skId: 'SK001' }]
    },
    {
        nik: '3201012345670003',
        namaLengkap: 'Ahmad Fauzi',
        jenisKelamin: 'Laki-Laki',
        noTelepon: '081234567803',
        alamat: 'Jl. Kaliurang No. 3, Yogyakarta',
        assignments: [{ id: 'ASG003', opd: 'Dinas Kesehatan', kader: 'Kader Kesehatan', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/001/KESEHATAN/2024', skId: 'SK001' }]
    },
    {
        nik: '3201012345670004',
        namaLengkap: 'Dewi Lestari',
        jenisKelamin: 'Perempuan',
        noTelepon: '081234567804',
        alamat: 'Jl. Gejayan No. 4, Yogyakarta',
        assignments: [{ id: 'ASG004', opd: 'Dinas Kesehatan', kader: 'Kader Kesehatan', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/001/KESEHATAN/2024', skId: 'SK001' }]
    },
    {
        nik: '3201012345670005',
        namaLengkap: 'Rudi Hermawan',
        jenisKelamin: 'Laki-Laki',
        noTelepon: '081234567805',
        alamat: 'Jl. Affandi No. 5, Yogyakarta',
        assignments: [
            { id: 'ASG005', opd: 'Dinas Kesehatan', kader: 'Kader Kesehatan', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/001/KESEHATAN/2024', skId: 'SK001' },
            { id: 'ASG023', opd: 'Dinas Kesehatan', kader: 'Kader Kesehatan', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/006/KESEHATAN/2024', skId: 'SK006' }
        ]
    },
    {
        nik: '3201012345670006',
        namaLengkap: 'Linda Wijaya',
        jenisKelamin: 'Perempuan',
        noTelepon: '081234567806',
        alamat: 'Jl. Seturan No. 6, Yogyakarta',
        assignments: [
            { id: 'ASG006', opd: 'Dinas Pendidikan', kader: 'Kader Pendidikan', peran: 'Koordinator', statusKeaktifan: 'Aktif', nomorSK: 'SK/002/PENDIDIKAN/2024', skId: 'SK002' },
            { id: 'ASG025', opd: 'Dinas Pendidikan', kader: 'Kader Literasi dan Pendidikan', peran: 'Koordinator', statusKeaktifan: 'Aktif', nomorSK: 'SK/007/DISDIK/2024', skId: 'SK007' }
        ]
    },
    {
        nik: '3201012345670007',
        namaLengkap: 'Andi Prasetyo',
        jenisKelamin: 'Laki-Laki',
        noTelepon: '081234567807',
        alamat: 'Jl. Magelang No. 7, Yogyakarta',
        assignments: [{ id: 'ASG007', opd: 'Dinas Pendidikan', kader: 'Kader Pendidikan', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/002/PENDIDIKAN/2024', skId: 'SK002' }]
    },
    {
        nik: '3201012345670008',
        namaLengkap: 'Maya Sari',
        jenisKelamin: 'Perempuan',
        noTelepon: '081234567808',
        alamat: 'Jl. Godean No. 8, Yogyakarta',
        assignments: [{ id: 'ASG008', opd: 'Dinas Pendidikan', kader: 'Kader Pendidikan', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/002/PENDIDIKAN/2024', skId: 'SK002' }]
    },
    {
        nik: '3201012345670009',
        namaLengkap: 'Hendra Gunawan',
        jenisKelamin: 'Laki-Laki',
        noTelepon: '081234567809',
        alamat: 'Jl. Wates No. 9, Yogyakarta',
        assignments: [
            { id: 'ASG009', opd: 'Dinas Pendidikan', kader: 'Kader Pendidikan', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/002/PENDIDIKAN/2024', skId: 'SK002' },
            { id: 'ASG026', opd: 'Dinas Pendidikan', kader: 'Kader Literasi dan Pendidikan', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/007/DISDIK/2024', skId: 'SK007' }
        ]
    },
    {
        nik: '3201012345670010',
        namaLengkap: 'Rina Marlina',
        jenisKelamin: 'Perempuan',
        noTelepon: '081234567810',
        alamat: 'Jl. Sudirman No. 10, Yogyakarta',
        assignments: [{ id: 'ASG010', opd: 'Dinas Sosial', kader: 'Kader Sosial Kemasyarakatan', peran: 'Koordinator', statusKeaktifan: 'Aktif', nomorSK: 'SK/003/DINSOS/2024', skId: 'SK003' }]
    },
    {
        nik: '3201012345670011',
        namaLengkap: 'Bambang Sutrisno',
        jenisKelamin: 'Laki-Laki',
        noTelepon: '081234567811',
        alamat: 'Jl. Ahmad Yani No. 11, Yogyakarta',
        assignments: [{ id: 'ASG011', opd: 'Dinas Sosial', kader: 'Kader Sosial Kemasyarakatan', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/003/DINSOS/2024', skId: 'SK003' }]
    },
    {
        nik: '3201012345670012',
        namaLengkap: 'Fitri Handayani',
        jenisKelamin: 'Perempuan',
        noTelepon: '081234567812',
        alamat: 'Jl. Kusumanegara No. 12, Yogyakarta',
        assignments: [{ id: 'ASG012', opd: 'Dinas Sosial', kader: 'Kader Sosial Kemasyarakatan', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/003/DINSOS/2024', skId: 'SK003' }]
    },
    {
        nik: '3201012345670013',
        namaLengkap: 'Dedi Kurniawan',
        jenisKelamin: 'Laki-Laki',
        noTelepon: '081234567813',
        alamat: 'Jl. Kenari No. 13, Yogyakarta',
        assignments: [{ id: 'ASG013', opd: 'Dinas Sosial', kader: 'Kader Sosial Kemasyarakatan', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/003/DINSOS/2024', skId: 'SK003' }]
    },
    {
        nik: '3201012345670014',
        namaLengkap: 'Yuni Astuti',
        jenisKelamin: 'Perempuan',
        noTelepon: '081234567814',
        alamat: 'Jl. Colombo No. 14, Yogyakarta',
        assignments: [{ id: 'ASG014', opd: 'Dinas Sosial', kader: 'Kader Sosial Kemasyarakatan', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/003/DINSOS/2024', skId: 'SK003' }]
    },
    {
        nik: '3201012345670015',
        namaLengkap: 'Agus Setiawan',
        jenisKelamin: 'Laki-Laki',
        noTelepon: '081234567815',
        alamat: 'Jl. Laksda Adisucipto No. 15, Yogyakarta',
        assignments: [{ id: 'ASG015', opd: 'Dinas Perhubungan', kader: 'Kader Lingkungan', peran: 'Koordinator', statusKeaktifan: 'Aktif', nomorSK: 'SK/004/PERHUBUNGAN/2024', skId: 'SK004' }]
    },
    {
        nik: '3201012345670016',
        namaLengkap: 'Nurul Hidayah',
        jenisKelamin: 'Perempuan',
        noTelepon: '081234567816',
        alamat: 'Jl. Monjali No. 16, Yogyakarta',
        assignments: [{ id: 'ASG016', opd: 'Dinas Perhubungan', kader: 'Kader Lingkungan', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/004/PERHUBUNGAN/2024', skId: 'SK004' }]
    },
    {
        nik: '3201012345670017',
        namaLengkap: 'Irfan Hakim',
        jenisKelamin: 'Laki-Laki',
        noTelepon: '081234567817',
        alamat: 'Jl. Ringroad Utara No. 17, Yogyakarta',
        assignments: [
            { id: 'ASG017', opd: 'Dinas Perhubungan', kader: 'Kader Lingkungan', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/004/PERHUBUNGAN/2024', skId: 'SK004' },
            { id: 'ASG018', opd: 'Dinas Perhubungan', kader: 'Kader Transportasi dan Lalu Lintas', peran: 'Koordinator', statusKeaktifan: 'Aktif', nomorSK: 'SK/005/DISHUB/2024', skId: 'SK005' }
        ]
    },
    {
        nik: '3201012345670018',
        namaLengkap: 'Wati Suryani',
        jenisKelamin: 'Perempuan',
        noTelepon: '081234567818',
        alamat: 'Jl. Veteran No. 18, Yogyakarta',
        assignments: [{ id: 'ASG019', opd: 'Dinas Perhubungan', kader: 'Kader Transportasi dan Lalu Lintas', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/005/DISHUB/2024', skId: 'SK005' }]
    },
    {
        nik: '3201012345670019',
        namaLengkap: 'Rizki Ramadhan',
        jenisKelamin: 'Laki-Laki',
        noTelepon: '081234567819',
        alamat: 'Jl. Palagan No. 19, Yogyakarta',
        assignments: [{ id: 'ASG020', opd: 'Dinas Perhubungan', kader: 'Kader Transportasi dan Lalu Lintas', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/005/DISHUB/2024', skId: 'SK005' }]
    },
    {
        nik: '3201012345670020',
        namaLengkap: 'Indah Permata',
        jenisKelamin: 'Perempuan',
        noTelepon: '081234567820',
        alamat: 'Jl. Bantul No. 20, Yogyakarta',
        assignments: [{ id: 'ASG021', opd: 'Dinas Perhubungan', kader: 'Kader Transportasi dan Lalu Lintas', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/005/DISHUB/2024', skId: 'SK005' }]
    },
    {
        nik: '3201012345670021',
        namaLengkap: 'Fajar Sidik',
        jenisKelamin: 'Laki-Laki',
        noTelepon: '081234567821',
        alamat: 'Jl. Imogiri No. 21, Yogyakarta',
        assignments: [{ id: 'ASG024', opd: 'Dinas Kesehatan', kader: 'Kader Kesehatan', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/006/KESEHATAN/2024', skId: 'SK006' }]
    },
    {
        nik: '3201012345670022',
        namaLengkap: 'Sri Wahyuni',
        jenisKelamin: 'Perempuan',
        noTelepon: '081234567822',
        alamat: 'Jl. Wonosari No. 22, Yogyakarta',
        assignments: [{ id: 'ASG027', opd: 'Dinas Pendidikan', kader: 'Kader Literasi dan Pendidikan', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/007/DISDIK/2024', skId: 'SK007' }]
    },
    {
        nik: '3201012345670023',
        namaLengkap: 'Tono Sugiarto',
        jenisKelamin: 'Laki-Laki',
        noTelepon: '081234567823',
        alamat: 'Jl. Parangtritis No. 23, Yogyakarta',
        assignments: [{ id: 'ASG028', opd: 'Dinas Pendidikan', kader: 'Kader Literasi dan Pendidikan', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/007/DISDIK/2024', skId: 'SK007' }]
    },
    {
        nik: '3201012345670024',
        namaLengkap: 'Eko Prasetyo',
        jenisKelamin: 'Laki-Laki',
        noTelepon: '081234567824',
        alamat: 'Jl. Prawirotaman No. 24, Yogyakarta',
        assignments: [{ id: 'ASG029', opd: 'Dinas Pendidikan', kader: 'Kader Literasi dan Pendidikan', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/007/DISDIK/2024', skId: 'SK007' }]
    },
    {
        nik: '3201012345670025',
        namaLengkap: 'Ratna Sari',
        jenisKelamin: 'Perempuan',
        noTelepon: '081234567825',
        alamat: 'Jl. Dagen No. 25, Yogyakarta',
        assignments: [{ id: 'ASG030', opd: 'Dinas Pendidikan', kader: 'Kader Literasi dan Pendidikan', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/007/DISDIK/2024', skId: 'SK007' }]
    },
    {
        nik: '3201012345670026',
        namaLengkap: 'Joko Widodo',
        jenisKelamin: 'Laki-Laki',
        noTelepon: '081234567826',
        alamat: 'Jl. Kota Gede No. 26, Yogyakarta',
        assignments: [{ id: 'ASG031', opd: 'Dinas Pariwisata', kader: 'Kader Ekonomi Kreatif', peran: 'Koordinator', statusKeaktifan: 'Nonaktif', nomorSK: 'SK/008/PARIWISATA/2023', skId: 'SK008' }]
    },
    {
        nik: '3201012345670027',
        namaLengkap: 'Sinta Dewi',
        jenisKelamin: 'Perempuan',
        noTelepon: '081234567827',
        alamat: 'Jl. Taman Siswa No. 27, Yogyakarta',
        assignments: [{ id: 'ASG032', opd: 'Dinas Pariwisata', kader: 'Kader Ekonomi Kreatif', peran: 'Anggota', statusKeaktifan: 'Nonaktif', nomorSK: 'SK/008/PARIWISATA/2023', skId: 'SK008' }]
    },
];

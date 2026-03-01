import { PengajuanData, RelawanData } from '../types/relawan.types';

export const mockPengajuanData: PengajuanData[] = [
    {
        nik: '1234567890123456',
        namaLengkap: 'Mingyu Gantenk 123',
        tanggalPengajuan: 'Senin, 01-01-2021 07:07:07',
        status: 'Menunggu',
        dataLama: {
            'Alamat': 'Jl. Lama No. 1'
        },
        dataBaru: {
            'Alamat': 'Jl. Baru No. 99'
        },
        catatanRelawan: 'Pindah alamat rumah baru'
    },
];

export const mockRelawanData: RelawanData[] = [
    {
        nik: '3201012345670001',
        namaLengkap: 'Budi Santoso',
        alamat: 'Jl. Malioboro No. 1',
        kelurahan: 'Suryatmajan',
        kader: 'KADER KESEHATAN',
        jabatan: 'Koordinator',
        kedinasan: 'Alun-Alun',
        assignments: [
            { id: 'ASG001', opd: 'Dinas Kesehatan', kader: 'KADER KESEHATAN', peran: 'Koordinator', statusKeaktifan: 'Aktif', nomorSK: 'SK/001/KESEHATAN/2024', skId: 'SK001' },
            { id: 'ASG022', opd: 'Dinas Kesehatan', kader: 'KADER KESEHATAN', peran: 'Koordinator', statusKeaktifan: 'Aktif', nomorSK: 'SK/006/KESEHATAN/2024', skId: 'SK006' }
        ]
    },
    {
        nik: '3201012345670002',
        namaLengkap: 'Siti Nurhaliza',
        alamat: 'Jl. Solo No. 2',
        kelurahan: 'Gondokusuman',
        kader: 'PKK',
        jabatan: 'Anggota',
        kedinasan: 'Baciro',
        assignments: [{ id: 'ASG002', opd: 'Dinas Kesehatan', kader: 'PKK', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/001/KESEHATAN/2024', skId: 'SK001' }]
    },
    {
        nik: '3201012345670003',
        namaLengkap: 'Ahmad Fauzi',
        alamat: 'Jl. Kaliurang No. 3',
        kelurahan: 'Caturtunggal',
        kader: 'LPMK',
        jabatan: 'Anggota',
        kedinasan: 'Bausasran',
        assignments: [{ id: 'ASG003', opd: 'Lembaga Kemasyarakatan Kelurahan', kader: 'LPMK', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/001/LKK/2024', skId: 'SK001' }]
    },
    {
        nik: '3201012345670004',
        namaLengkap: 'Dewi Lestari',
        alamat: 'Jl. Gejayan No. 4',
        kelurahan: 'Demangan',
        kader: 'Posyandu_DP3AP2KB',
        jabatan: 'Anggota',
        kedinasan: 'Demangan',
        assignments: [{ id: 'ASG004', opd: 'Dinas Pemberdayaan Perempuan, Perlindungan Anak, Pengendalian Penduduk dan Keluarga Berencana', kader: 'Posyandu_DP3AP2KB', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/001/DP3AP2KB/2024', skId: 'SK002' }]
    },
    {
        nik: '3201012345670005',
        namaLengkap: 'Rudi Hermawan',
        alamat: 'Jl. Affandi No. 5',
        kelurahan: 'Caturtunggal',
        kader: 'RT',
        jabatan: 'Anggota',
        kedinasan: 'Cokrodiningratan',
        assignments: [
            { id: 'ASG005', opd: 'Lembaga Kemasyarakatan Kelurahan', kader: 'RT', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/002/LKK/2024', skId: 'SK003' },
            { id: 'ASG023', opd: 'Lembaga Kemasyarakatan Kelurahan', kader: 'RT', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/006/LKK/2024', skId: 'SK006' }
        ]
    },
    {
        nik: '3201012345670006',
        namaLengkap: 'Linda Wijaya',
        alamat: 'Jl. Seturan No. 6',
        kelurahan: 'Caturtunggal',
        kader: 'RW',
        jabatan: 'Koordinator',
        kedinasan: 'Gedongkiwo',
        assignments: [
            { id: 'ASG006', opd: 'Lembaga Kemasyarakatan Kelurahan', kader: 'RW', peran: 'Koordinator', statusKeaktifan: 'Aktif', nomorSK: 'SK/003/LKK/2024', skId: 'SK004' },
            { id: 'ASG025', opd: 'Dinas Pendidikan, Pemuda, dan Olahraga', kader: 'RW', peran: 'Koordinator', statusKeaktifan: 'Aktif', nomorSK: 'SK/007/DISDIK/2024', skId: 'SK007' }
        ]
    },
    {
        nik: '3201012345670007',
        namaLengkap: 'Andi Prasetyo',
        alamat: 'Jl. Magelang No. 7',
        kelurahan: 'Sinduadi',
        kader: 'KARANGTARUNA',
        jabatan: 'Anggota',
        kedinasan: 'Gowongan',
        assignments: [{ id: 'ASG007', opd: 'Dinas Pendidikan, Pemuda, dan Olahraga', kader: 'KARANGTARUNA', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/002/DISDIK/2024', skId: 'SK005' }]
    },
    {
        nik: '3201012345670008',
        namaLengkap: 'Maya Sari',
        alamat: 'Jl. Godean No. 8',
        kelurahan: 'Sidoarum',
        kader: 'FBSK',
        jabatan: 'Anggota',
        kedinasan: 'Bumijo',
        assignments: [{ id: 'ASG008', opd: 'Dinas Sosial, Tenaga Kerja, dan Transmigrasi', kader: 'FBSK', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/001/DINSOS/2024', skId: 'SK008' }]
    },
    {
        nik: '3201012345670009',
        namaLengkap: 'Hendra Gunawan',
        alamat: 'Jl. Wates No. 9',
        kelurahan: 'Ngestiharjo',
        kader: 'TAGANA',
        jabatan: 'Anggota',
        kedinasan: 'Jogokariyan',
        assignments: [
            { id: 'ASG009', opd: 'Badan Penanggulangan Bencana Daerah', kader: 'TAGANA', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/001/BPBD/2024', skId: 'SK009' },
            { id: 'ASG026', opd: 'Dinas Sosial, Tenaga Kerja, dan Transmigrasi', kader: 'TAGANA', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/002/DINSOS/2024', skId: 'SK010' }
        ]
    },
    {
        nik: '3201012345670010',
        namaLengkap: 'Rina Marlina',
        alamat: 'Jl. Sudirman No. 10',
        kelurahan: 'Kotabaru',
        kader: 'TKSK',
        jabatan: 'Koordinator',
        kedinasan: 'Kotabaru',
        assignments: [{ id: 'ASG010', opd: 'Dinas Sosial, Tenaga Kerja, dan Transmigrasi', kader: 'TKSK', peran: 'Koordinator', statusKeaktifan: 'Aktif', nomorSK: 'SK/003/DINSOS/2024', skId: 'SK011' }]
    },
    {
        nik: '3201012345670011',
        namaLengkap: 'Bambang Sutrisno',
        alamat: 'Jl. Ahmad Yani No. 11',
        kelurahan: 'Ngupasan',
        kader: 'SATLINMAS',
        jabatan: 'Anggota',
        kedinasan: 'Ketandan',
        assignments: [{ id: 'ASG011', opd: 'Satuan Polisi Pamong Praja (PP)', kader: 'SATLINMAS', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/001/SATPOLPP/2024', skId: 'SK012' }]
    },
    {
        nik: '3201012345670012',
        namaLengkap: 'Fitri Handayani',
        alamat: 'Jl. Kusumanegara No. 12',
        kelurahan: 'Semaki',
        kader: 'FKI',
        jabatan: 'Anggota',
        kedinasan: 'Bintaran',
        assignments: [{ id: 'ASG012', opd: 'Dinas Kesehatan', kader: 'FKI', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/002/KESEHATAN/2024', skId: 'SK013' }]
    },
    {
        nik: '3201012345670013',
        namaLengkap: 'Dedi Kurniawan',
        alamat: 'Jl. Kenari No. 13',
        kelurahan: 'Muja Muju',
        kader: 'KSB',
        jabatan: 'Anggota',
        kedinasan: 'Danukusuman',
        assignments: [{ id: 'ASG013', opd: 'Badan Penanggulangan Bencana Daerah', kader: 'KSB', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/002/BPBD/2024', skId: 'SK014' }]
    },
    {
        nik: '3201012345670014',
        namaLengkap: 'Yuni Astuti',
        alamat: 'Jl. Colombo No. 14',
        kelurahan: 'Caturtunggal',
        kader: 'PORDAM',
        jabatan: 'Anggota',
        kedinasan: 'Glagahsari',
        assignments: [{ id: 'ASG014', opd: 'Dinas Pemadam Kebakaran', kader: 'PORDAM', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/001/DAMKAR/2024', skId: 'SK015' }]
    },
    {
        nik: '3201012345670015',
        namaLengkap: 'Agus Setiawan',
        alamat: 'Jl. Laksda Adisucipto No. 15',
        kelurahan: 'Demangan',
        kader: 'SIGRAK',
        jabatan: 'Koordinator',
        kedinasan: 'Klitren Lor',
        assignments: [{ id: 'ASG015', opd: 'Dinas Kesehatan', kader: 'SIGRAK', peran: 'Koordinator', statusKeaktifan: 'Aktif', nomorSK: 'SK/003/KESEHATAN/2024', skId: 'SK016' }]
    },
    {
        nik: '3201012345670016',
        namaLengkap: 'Nurul Hidayah',
        alamat: 'Jl. Monjali No. 16',
        kelurahan: 'Sinduadi',
        kader: 'FPRB',
        jabatan: 'Anggota',
        kedinasan: 'Karangwaru Lor',
        assignments: [{ id: 'ASG016', opd: 'Badan Penanggulangan Bencana Daerah', kader: 'FPRB', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/003/BPBD/2024', skId: 'SK017' }]
    },
    {
        nik: '3201012345670017',
        namaLengkap: 'Irfan Hakim',
        alamat: 'Jl. Ringroad Utara No. 17',
        kelurahan: 'Maguwoharjo',
        kader: 'REDCAR',
        jabatan: 'Koordinator',
        kedinasan: 'Kadipaten Kulon',
        assignments: [
            { id: 'ASG017', opd: 'Dinas Kesehatan', kader: 'REDCAR', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/004/KESEHATAN/2024', skId: 'SK018' },
            { id: 'ASG018', opd: 'Dinas Pemadam Kebakaran', kader: 'REDCAR', peran: 'Koordinator', statusKeaktifan: 'Aktif', nomorSK: 'SK/002/DAMKAR/2024', skId: 'SK019' }
        ]
    },
    {
        nik: '3201012345670018',
        namaLengkap: 'Wati Suryani',
        alamat: 'Jl. Veteran No. 18',
        kelurahan: 'Warungboto',
        kader: 'IPSM',
        jabatan: 'Anggota',
        kedinasan: 'Giwangan',
        assignments: [{ id: 'ASG019', opd: 'Dinas Sosial, Tenaga Kerja, dan Transmigrasi', kader: 'IPSM', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/004/DINSOS/2024', skId: 'SK020' }]
    },
    {
        nik: '3201012345670019',
        namaLengkap: 'Rizki Ramadhan',
        alamat: 'Jl. Palagan No. 19',
        kelurahan: 'Sariharjo',
        kader: 'ATLIT',
        jabatan: 'Anggota',
        kedinasan: 'Juminahan',
        assignments: [{ id: 'ASG020', opd: 'Dinas Pendidikan, Pemuda, dan Olahraga', kader: 'ATLIT', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/003/DISDIK/2024', skId: 'SK021' }]
    },
    {
        nik: '3201012345670020',
        namaLengkap: 'Indah Permata',
        alamat: 'Jl. Bantul No. 20',
        kelurahan: 'Panggungharjo',
        kader: 'KTB',
        jabatan: 'Anggota',
        kedinasan: 'Kauman',
        assignments: [{ id: 'ASG021', opd: 'Dinas Kesehatan', kader: 'KTB', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/005/KESEHATAN/2024', skId: 'SK022' }]
    },
    {
        nik: '3201012345670021',
        namaLengkap: 'Fajar Sidik',
        alamat: 'Jl. Imogiri No. 21',
        kelurahan: 'Trimulyo',
        kader: 'KETUA KAMPUNG',
        jabatan: 'Anggota',
        kedinasan: 'Lempuyangan',
        assignments: [{ id: 'ASG024', opd: 'Lembaga Kemasyarakatan Kelurahan', kader: 'KETUA KAMPUNG', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/004/LKK/2024', skId: 'SK023' }]
    },
    {
        nik: '3201012345670022',
        namaLengkap: 'Sri Wahyuni',
        alamat: 'Jl. Wonosari No. 22',
        kelurahan: 'Wonosari',
        kader: 'TPK',
        jabatan: 'Anggota',
        kedinasan: 'Mangkuyudan',
        assignments: [{ id: 'ASG027', opd: 'Dinas Pendidikan, Pemuda, dan Olahraga', kader: 'TPK', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/004/DISDIK/2024', skId: 'SK024' }]
    },
    {
        nik: '3201012345670023',
        namaLengkap: 'Tono Sugiarto',
        alamat: 'Jl. Parangtritis No. 23',
        kelurahan: 'Parangtritis',
        kader: 'KARANGTARUNA',
        jabatan: 'Anggota',
        kedinasan: 'Brontokusuman',
        assignments: [{ id: 'ASG028', opd: 'Dinas Pendidikan, Pemuda, dan Olahraga', kader: 'KARANGTARUNA', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/005/DISDIK/2024', skId: 'SK025' }]
    },
    {
        nik: '3201012345670024',
        namaLengkap: 'Eko Prasetyo',
        alamat: 'Jl. Prawirotaman No. 24',
        kelurahan: 'Brontokusuman',
        kader: 'SATLINMAS',
        jabatan: 'Anggota',
        kedinasan: 'Celeban',
        assignments: [{ id: 'ASG029', opd: 'Satuan Polisi Pamong Praja (PP)', kader: 'SATLINMAS', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/002/SATPOLPP/2024', skId: 'SK026' }]
    },
    {
        nik: '3201012345670025',
        namaLengkap: 'Ratna Sari',
        alamat: 'Jl. Dagen No. 25',
        kelurahan: 'Sosromenduran',
        kader: 'PKK',
        jabatan: 'Anggota',
        kedinasan: 'Kepatihan',
        assignments: [{ id: 'ASG030', opd: 'Dinas Pemberdayaan Perempuan, Perlindungan Anak, Pengendalian Penduduk dan Keluarga Berencana', kader: 'PKK', peran: 'Anggota', statusKeaktifan: 'Aktif', nomorSK: 'SK/002/DP3AP2KB/2024', skId: 'SK027' }]
    },
    {
        nik: '3201012345670026',
        namaLengkap: 'Joko Widodo',
        alamat: 'Jl. Kota Gede No. 26',
        kelurahan: 'Prenggan',
        kader: 'SIGRAK',
        jabatan: 'Koordinator',
        kedinasan: 'Gamelan',
        assignments: [{ id: 'ASG031', opd: 'Dinas Kesehatan', kader: 'SIGRAK', peran: 'Koordinator', statusKeaktifan: 'Nonaktif', nomorSK: 'SK/006/KESEHATAN/2023', skId: 'SK028' }]
    },
    {
        nik: '3201012345670027',
        namaLengkap: 'Sinta Dewi',
        alamat: 'Jl. Taman Siswa No. 27',
        kelurahan: 'Wirogunan',
        kader: 'TAGANA',
        jabatan: 'Anggota',
        kedinasan: 'Dipowinatan',
        assignments: [{ id: 'ASG032', opd: 'Badan Penanggulangan Bencana Daerah', kader: 'TAGANA', peran: 'Anggota', statusKeaktifan: 'Nonaktif', nomorSK: 'SK/004/BPBD/2023', skId: 'SK029' }]
    },
];

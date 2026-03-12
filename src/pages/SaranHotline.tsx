import React, { useState } from 'react';
import { Phone, MessageCircle, Clock, Check, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import Card from '../components/ui/Card';
import RelawanMenu from '../components/RelawanMenu';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';

// --- MOCK DATA UNTUK SUPER ADMIN ---
// TODO: Ganti dengan API call ke backend (misal: GET /api/admin/saran)
interface SaranData {
    id: number;
    namaPengirim: string;
    noTelepon: string;
    saran: string;
    tanggalKirim: string;
    isResolved: boolean;
}

const mockSaranList: SaranData[] = [
    {
        id: 1,
        namaPengirim: 'Budi Santoso',
        noTelepon: '081234567890',
        saran: 'Mohon agar jadwal kegiatan diperbarui di sistem lebih cepat, karena kadang kami mendapat info mendadak.',
        tanggalKirim: '12 Mar 2026 10:30',
        isResolved: false
    },
    {
        id: 2,
        namaPengirim: 'Siti Aminah',
        noTelepon: '081987654321',
        saran: 'Aplikasi sudah bagus, tapi mohon tambahkan fitur notifikasi via WhatsApp agar lebih mudah dan efisien untuk tim lapangan.',
        tanggalKirim: '11 Mar 2026 14:15',
        isResolved: true
    },
    {
        id: 3,
        namaPengirim: 'Jonathan Wijaya',
        noTelepon: '08122334455',
        saran: 'Ada beberapa kader yang belum terdaftar di sistem, mohon bantuannya untuk import data kader terbaru dari dinas.',
        tanggalKirim: '10 Mar 2026 09:00',
        isResolved: false
    },
    {
        id: 4,
        namaPengirim: 'Ahmad Faisal',
        noTelepon: '085611223344',
        saran: 'Aplikasi sering logout sendiri jika didiamkan lebih dari 15 menit, bisa tolong durasi login diperpanjang?',
        tanggalKirim: '09 Mar 2026 15:20',
        isResolved: true
    },
    {
        id: 5,
        namaPengirim: 'Maya Indahsari',
        noTelepon: '081399887766',
        saran: 'Tolong tambahkan fitur export data relawan ke format PDF juga selain Excel. Terima kasih.',
        tanggalKirim: '09 Mar 2026 10:10',
        isResolved: false
    },
    {
        id: 6,
        namaPengirim: 'Dedi Kusuma',
        noTelepon: '082144556677',
        saran: 'SK yang saya upload kemarin ternyata salah file, apakah ada cara untuk menghapusnya atau menimpanya langsung tanpa harus buat pengajuan baru?',
        tanggalKirim: '08 Mar 2026 14:45',
        isResolved: true
    },
    {
        id: 7,
        namaPengirim: 'Rini Yulianti',
        noTelepon: '085733221100',
        saran: 'Menu OPD Dashboard kadang lemot loading datanya saat pagi hari, mohon dioptimalkan servernya.',
        tanggalKirim: '08 Mar 2026 08:30',
        isResolved: false
    },
    {
        id: 8,
        namaPengirim: 'Kunto Wibisono',
        noTelepon: '081199998888',
        saran: 'Mohon panduan atau buku manual ditambahkan di menu bantuan agar relawan baru mudah belajar.',
        tanggalKirim: '07 Mar 2026 11:20',
        isResolved: false
    },
    {
        id: 9,
        namaPengirim: 'Siska Noviana',
        noTelepon: '082233445566',
        saran: 'Alamat kelurahan di dropdown ada yang salah ketik (typo), tolong admin Bappeda diperbaiki.',
        tanggalKirim: '07 Mar 2026 09:15',
        isResolved: true
    },
    {
        id: 10,
        namaPengirim: 'Heru Pramono',
        noTelepon: '081877665544',
        saran: 'Apakah memungkinkan aplikasi ini dibuatkan versi Android (APK)? Biar lebih mudah akses tanpa browser.',
        tanggalKirim: '06 Mar 2026 16:00',
        isResolved: false
    },
    {
        id: 11,
        namaPengirim: 'Andi Saputra',
        noTelepon: '085211223344',
        saran: 'Data log audit kurang lengkap, tolong dicantumkan juga IP Address user yang mengubah data.',
        tanggalKirim: '05 Mar 2026 10:30',
        isResolved: true
    }
];

const SaranHotline: React.FC = () => {
    const { user, isSuperAdmin } = useAuth();
    const isRelawan = user?.role === 'relawan';

    // State untuk form
    const [formData, setFormData] = useState({
        namaLengkap: user?.name || '',
        noTelepon: '',
        saran: ''
    });

    // State untuk tabel Super Admin
    const [saranList, setSaranList] = useState<SaranData[]>(mockSaranList);
    const [selectedSaran, setSelectedSaran] = useState<SaranData | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 5;

    // Pagination Logic
    const totalPages = Math.ceil(saranList.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentSaranData = saranList.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.namaLengkap || !formData.noTelepon || !formData.saran) {
            alert('Mohon lengkapi semua field');
            return;
        }

        // TODO: Ganti dengan POST /api/saran
        console.log('Form submitted:', formData);
        alert('Terima kasih! Saran Anda telah dikirim.');

        setFormData({ namaLengkap: user?.name || '', noTelepon: '', saran: '' });
    };

    const handleResolve = (id: number) => {
        // TODO: Ganti dengan PATCH /api/admin/saran/:id/resolve
        setSaranList(prev => prev.map(s => s.id === id ? { ...s, isResolved: !s.isResolved } : s));
    };

    const saranColumns = [
        { header: 'NAMA PENGIRIM', accessor: 'namaPengirim' as keyof SaranData },
        { header: 'NO. TELEPON', accessor: 'noTelepon' as keyof SaranData },
        {
            header: 'SARAN',
            render: (row: SaranData) => (
                <div className="truncate max-w-[250px]" title={row.saran}>
                    {row.saran}
                </div>
            )
        },
        { header: 'TANGGAL TERKIRIM', accessor: 'tanggalKirim' as keyof SaranData },
        {
            header: 'STATUS',
            render: (row: SaranData) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${row.isResolved
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    }`}>
                    {row.isResolved ? 'Resolved' : 'Pending'}
                </span>
            )
        }
    ];

    const saranActions = (row: SaranData) => (
        <>
            <button
                onClick={() => setSelectedSaran(row)}
                className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                title="Lihat Detail"
            >
                <Eye size={18} />
            </button>
            <button
                onClick={() => handleResolve(row.id)}
                className={`p-1.5 rounded-lg transition-colors ${row.isResolved
                    ? 'text-gray-400 hover:bg-gray-200'
                    : 'text-green-600 hover:bg-green-100'
                    }`}
                title={row.isResolved ? "Batal Resolve" : "Tandai Resolved"}
            >
                <Check size={18} />
            </button>
        </>
    );

    // Shared contact info content
    const contactInfo = (
        <div className="space-y-5">
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="text-gray-600" size={24} />
                </div>
                <div>
                    <p className="text-sm text-gray-600 mb-1">Telepon</p>
                    <p className="text-base font-semibold text-gray-800">0274-XXXXXXX</p>
                </div>
            </div>
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="text-gray-600" size={24} />
                </div>
                <div>
                    <p className="text-sm text-gray-600 mb-1">WhatsApp</p>
                    <p className="text-base font-semibold text-gray-800">+62 812-XXXX-XXXX</p>
                </div>
            </div>
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="text-gray-600" size={24} />
                </div>
                <div>
                    <p className="text-sm text-gray-600 mb-1">Jam Layanan</p>
                    <p className="text-base font-semibold text-gray-800">Senin–Jumat, 08.00–16.00</p>
                </div>
            </div>
        </div>
    );

    // Shared form content
    const feedbackForm = (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <input
                    type="text"
                    name="namaLengkap"
                    value={formData.namaLengkap}
                    onChange={handleInputChange}
                    placeholder="Nama Lengkap"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
            </div>
            <div>
                <input
                    type="tel"
                    name="noTelepon"
                    value={formData.noTelepon}
                    onChange={handleInputChange}
                    placeholder="No. Telepon"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
            </div>
            <div>
                <textarea
                    name="saran"
                    value={formData.saran}
                    onChange={handleInputChange}
                    placeholder="Tuliskan saran atau kendala Anda di sini..."
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none text-sm"
                />
            </div>
            <Button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors justify-center"
            >
                Kirim Saran
            </Button>
        </form>
    );

    // =====================================
    // LAYOUT SUPER ADMIN: Tabel Kotak Masuk
    // =====================================
    if (isSuperAdmin) {
        return (
            <div className="space-y-6">
                <Card title="Kotak Masuk Saran & Kendala">
                    <Table
                        columns={saranColumns}
                        data={currentSaranData}
                        actions={saranActions}
                        minRows={5}
                    />

                    {/* Pagination */}
                    {saranList.length > 0 && (
                        <div className="mt-4 flex justify-between items-center">
                            <div className="text-sm text-gray-500">
                                Menampilkan {startIndex + 1}-{Math.min(endIndex, saranList.length)} dari {saranList.length} Saran
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={16} />
                                    Sebelumnya
                                </Button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <Button
                                        key={page}
                                        variant={currentPage === page ? "primary" : "outline"}
                                        size="sm"
                                        onClick={() => handlePageChange(page)}
                                        className="min-w-[40px]"
                                    >
                                        {page}
                                    </Button>
                                ))}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Selanjutnya
                                    <ChevronRight size={16} />
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>

                {/* MODAL DETAIL SARAN */}
                <Modal
                    isOpen={!!selectedSaran}
                    onClose={() => setSelectedSaran(null)}
                    title="Detail Saran"
                    maxWidth="md"
                >
                    {selectedSaran && (
                        <div className="space-y-5 text-sm">
                            <div>
                                <p className="text-gray-500 mb-1">Pengirim</p>
                                <p className="font-medium text-gray-800 text-base">{selectedSaran.namaPengirim}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-gray-500 text-xs mb-1">No. Telepon</p>
                                    <div className="flex items-center gap-2">
                                        <Phone size={14} className="text-gray-400" />
                                        <p className="font-medium text-gray-800">{selectedSaran.noTelepon}</p>
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-gray-500 text-xs mb-1">Tanggal Dikirim</p>
                                    <div className="flex items-center gap-2">
                                        <Clock size={14} className="text-gray-400" />
                                        <p className="font-medium text-gray-800">{selectedSaran.tanggalKirim}</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-2">Pesan / Saran</p>
                                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg text-gray-700 whitespace-pre-wrap leading-relaxed">
                                    {selectedSaran.saran}
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 mt-4 border-t border-gray-100">
                                {!selectedSaran.isResolved && (
                                    <Button
                                        onClick={() => {
                                            handleResolve(selectedSaran.id);
                                            setSelectedSaran({ ...selectedSaran, isResolved: true });
                                        }}
                                        className="bg-green-500 hover:bg-green-600 text-white font-medium flex items-center gap-2 shadow-sm"
                                    >
                                        <Check size={16} /> Tandai Resolved
                                    </Button>
                                )}
                                <Button
                                    variant="secondary"
                                    onClick={() => setSelectedSaran(null)}
                                >
                                    Tutup
                                </Button>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        );
    }

    // =====================================
    // LAYOUT RELAWAN: Mobile View
    // =====================================
    if (isRelawan) {
        return (
            <div className="min-h-screen bg-gray-50">
                <RelawanMenu title="Icon App" />
                <div className="px-4 py-5 space-y-4">
                    <h1 className="text-2xl font-bold text-gray-800 text-center">Saran/Hotline</h1>
                    <Card className="shadow-md">
                        <div className="p-4">
                            <h2 className="text-base font-bold text-gray-800 mb-4">Hotline BAPPEDA Kota Yogyakarta</h2>
                            {contactInfo}
                        </div>
                    </Card>
                    <Card className="shadow-md">
                        <div className="p-4">
                            <h2 className="text-base font-bold text-gray-800 mb-4">Kirim Saran</h2>
                            {feedbackForm}
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    // =====================================
    // LAYOUT OPD: Desktop Form
    // =====================================
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Hotline BAPPEDA Kota Yogyakarta">
                    {contactInfo}
                </Card>
                <Card title="Kirim Saran & Masukan">
                    {feedbackForm}
                </Card>
            </div>
        </div>
    );
};

export default SaranHotline;

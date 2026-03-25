import React, { useState, useEffect } from 'react';
import { Phone, MessageCircle, Clock, Check, Eye, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import Card from '../components/ui/Card';
import RelawanMenu from '../components/RelawanMenu';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Toast, { ToastType } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';

interface SaranData {
    saran_id: number;
    nama_lengkap: string;
    no_hp: string;
    subjek: string | null;
    pesan: string;
    status: 'Menunggu' | 'Selesai';   // ✅ ENUM bukan boolean
    catatan_admin: string | null;      // ✅ Respon dari admin
    created_at: string;
    updated_at: string;
    role: string;
}

const SaranHotline: React.FC = () => {
    const { user, isSuperAdmin } = useAuth();
    const isRelawan = user?.role === 'relawan';

    const [formData, setFormData] = useState({
        namaLengkap: user?.name || '',
        noTelepon: '',
        saran: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    // State Super Admin
    const [saranList, setSaranList] = useState<SaranData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedSaran, setSelectedSaran] = useState<SaranData | null>(null);
    const [isResponding, setIsResponding] = useState(false);

    // State modal respon
    const [responForm, setResponForm] = useState({
        status: 'Selesai' as 'Menunggu' | 'Selesai',
        catatan_admin: ''
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 5;

    useEffect(() => {
        if (!isSuperAdmin) return;
        fetchSaran();
    }, [isSuperAdmin]);

    const fetchSaran = async () => {
        setIsLoading(true);
        try {
            const response = await apiFetch('/saran/admin?limit=100');
            const result = await response.json();
            if (result.success) {
                setSaranList(result.data);
            } else {
                setToast({ message: result.message || 'Gagal memuat saran masukan', type: 'error' });
            }
        } catch {
            setToast({ message: 'Tidak dapat terhubung ke server', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    // Pagination
    const totalPages = Math.ceil(saranList.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentSaranData = saranList.slice(startIndex, endIndex);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.namaLengkap || !formData.noTelepon || !formData.saran) {
            setToast({ message: 'Mohon lengkapi semua field', type: 'error' });
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await apiFetch('/saran', {
                method: 'POST',
                body: JSON.stringify({
                    subjek: `Dari: ${formData.namaLengkap} (${formData.noTelepon})`,
                    pesan: formData.saran
                })
            });
            const result = await response.json();

            if (response.ok && result.success) {
                setToast({ message: 'Saran berhasil dikirim. Terima kasih!', type: 'success' });
                setFormData({ namaLengkap: user?.name || '', noTelepon: '', saran: '' });
            } else {
                setToast({ message: result.message || 'Gagal mengirim saran', type: 'error' });
            }
        } catch {
            setToast({ message: 'Tidak dapat terhubung ke server', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Buka modal detail + siapkan form respon
    const handleDetailClick = (saran: SaranData) => {
        setSelectedSaran(saran);
        setResponForm({
            status: saran.status === 'Menunggu' ? 'Selesai' : 'Menunggu',
            catatan_admin: saran.catatan_admin || ''
        });
    };

    // Kirim respon & update status
    const handleRespond = async () => {
        if (!selectedSaran) return;
        setIsResponding(true);
        try {
            const response = await apiFetch(`/saran/admin/${selectedSaran.saran_id}/baca`, {
                method: 'PATCH',
                body: JSON.stringify({
                    status: responForm.status,
                    catatan_admin: responForm.catatan_admin || null
                })
            });
            const result = await response.json();

            if (response.ok && result.success) {
                setToast({ message: result.message, type: 'success' });
                setSelectedSaran(null);
                fetchSaran(); // Refresh data
            } else {
                setToast({ message: result.message || 'Gagal memperbarui status', type: 'error' });
            }
        } catch {
            setToast({ message: 'Tidak dapat terhubung ke server', type: 'error' });
        } finally {
            setIsResponding(false);
        }
    };

    // Toggle cepat tanpa buka modal
    const handleQuickToggle = async (saran: SaranData) => {
        const newStatus = saran.status === 'Menunggu' ? 'Selesai' : 'Menunggu';
        try {
            const response = await apiFetch(`/saran/admin/${saran.saran_id}/baca`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus, catatan_admin: saran.catatan_admin || null })
            });
            const result = await response.json();
            if (response.ok && result.success) {
                setSaranList(prev => prev.map(s =>
                    s.saran_id === saran.saran_id ? { ...s, status: newStatus } : s
                ));
                setToast({ message: result.message, type: 'success' });
            } else {
                setToast({ message: result.message || 'Gagal memperbarui status', type: 'error' });
            }
        } catch {
            setToast({ message: 'Tidak dapat terhubung ke server', type: 'error' });
        }
    };

    const saranColumns = [
        { header: 'NAMA PENGIRIM', accessor: 'nama_lengkap' as keyof SaranData },
        { header: 'NO. TELEPON', accessor: 'no_hp' as keyof SaranData },
        {
            header: 'SARAN',
            render: (row: SaranData) => (
                <div className="truncate max-w-[250px]" title={row.pesan}>{row.pesan}</div>
            )
        },
        {
            header: 'TANGGAL TERKIRIM',
            render: (row: SaranData) => (
                <span>{new Date(row.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            )
        },
        {
            header: 'STATUS',
            render: (row: SaranData) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    row.status === 'Selesai'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                }`}>
                    {row.status === 'Selesai' ? '✓ Selesai' : '⏳ Menunggu'}
                </span>
            )
        }
    ];

    const saranActions = (row: SaranData) => (
        <>
            <button
                onClick={() => handleDetailClick(row)}
                className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                title="Lihat Detail & Beri Respon"
            >
                <Eye size={18} />
            </button>
            <button
                onClick={() => handleQuickToggle(row)}
                className={`p-1.5 rounded-lg transition-colors ${
                    row.status === 'Selesai'
                        ? 'text-gray-400 hover:bg-gray-200'
                        : 'text-green-600 hover:bg-green-100'
                }`}
                title={row.status === 'Selesai' ? 'Batal Selesai' : 'Tandai Selesai'}
            >
                <Check size={18} />
            </button>
        </>
    );

    // Shared contact info
    const contactInfo = (
        <div className="space-y-5">
            {[
                { icon: <Phone className="text-gray-600" size={24} />, label: 'Telepon', value: '0274-XXXXXXX' },
                { icon: <MessageCircle className="text-gray-600" size={24} />, label: 'WhatsApp', value: '+62 812-XXXX-XXXX' },
                { icon: <Clock className="text-gray-600" size={24} />, label: 'Jam Layanan', value: 'Senin–Jumat, 08.00–16.00' },
            ].map(item => (
                <div key={item.label} className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        {item.icon}
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 mb-1">{item.label}</p>
                        <p className="text-base font-semibold text-gray-800">{item.value}</p>
                    </div>
                </div>
            ))}
        </div>
    );

    // Shared feedback form
    const feedbackForm = (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input
                type="text"
                name="namaLengkap"
                value={formData.namaLengkap}
                onChange={handleInputChange}
                placeholder="Nama Lengkap"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            />
            <input
                type="tel"
                name="noTelepon"
                value={formData.noTelepon}
                onChange={handleInputChange}
                placeholder="No. Telepon"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            />
            <textarea
                name="saran"
                value={formData.saran}
                onChange={handleInputChange}
                placeholder="Tuliskan saran atau kendala Anda di sini..."
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none text-sm"
            />
            <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors justify-center disabled:opacity-70"
            >
                {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                        <Loader2 size={18} className="animate-spin" /> Mengirim...
                    </span>
                ) : 'Kirim Saran'}
            </Button>
        </form>
    );

    // ── SUPER ADMIN VIEW ──
    if (isSuperAdmin) {
        return (
            <div className="space-y-6">
                {isLoading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 size={28} className="animate-spin text-gray-400" />
                        <span className="ml-3 text-gray-500">Memuat saran masukan...</span>
                    </div>
                ) : (
                    <Card title="Kotak Masuk Saran & Kendala">
                        <Table columns={saranColumns} data={currentSaranData} actions={saranActions} minRows={5} />

                        {saranList.length > 0 && (
                            <div className="mt-4 flex justify-between items-center">
                                <div className="text-sm text-gray-500">
                                    Menampilkan {startIndex + 1}-{Math.min(endIndex, saranList.length)} dari {saranList.length} Saran
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="disabled:opacity-50">
                                        <ChevronLeft size={16} /> Sebelumnya
                                    </Button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <Button key={page} variant={currentPage === page ? "primary" : "outline"} size="sm" onClick={() => setCurrentPage(page)} className="min-w-[40px]">
                                            {page}
                                        </Button>
                                    ))}
                                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="disabled:opacity-50">
                                        Selanjutnya <ChevronRight size={16} />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>
                )}

                {/* Modal Detail + Respon */}
                <Modal isOpen={!!selectedSaran} onClose={() => setSelectedSaran(null)} title="Detail Saran & Beri Respon" maxWidth="md">
                    {selectedSaran && (
                        <div className="space-y-5 text-sm">
                            {/* Info pengirim */}
                            <div>
                                <p className="text-gray-500 mb-1">Pengirim</p>
                                <p className="font-semibold text-gray-800 text-base">{selectedSaran.nama_lengkap}</p>
                                <p className="text-gray-500 text-xs">{selectedSaran.role}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-gray-500 text-xs mb-1">No. Telepon</p>
                                    <div className="flex items-center gap-2">
                                        <Phone size={14} className="text-gray-400" />
                                        <p className="font-medium text-gray-800">{selectedSaran.no_hp || '-'}</p>
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-gray-500 text-xs mb-1">Tanggal Dikirim</p>
                                    <div className="flex items-center gap-2">
                                        <Clock size={14} className="text-gray-400" />
                                        <p className="font-medium text-gray-800">
                                            {new Date(selectedSaran.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Isi saran */}
                            <div>
                                <p className="text-gray-500 mb-2">Pesan / Saran</p>
                                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg text-gray-700 whitespace-pre-wrap leading-relaxed">
                                    {selectedSaran.pesan}
                                </div>
                            </div>

                            {/* Divider respon admin */}
                            <div className="border-t border-gray-200 pt-4">
                                <p className="font-medium text-gray-800 mb-3">Beri Respon</p>

                                {/* Update Status */}
                                <div className="mb-3">
                                    <label className="text-xs text-gray-500 mb-1 block">Update Status</label>
                                    <div className="flex gap-3">
                                        {(['Menunggu', 'Selesai'] as const).map(s => (
                                            <label key={s} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="status"
                                                    value={s}
                                                    checked={responForm.status === s}
                                                    onChange={() => setResponForm(prev => ({ ...prev, status: s }))}
                                                    className="w-4 h-4 text-green-600"
                                                />
                                                <span className={`text-sm font-medium ${s === 'Selesai' ? 'text-green-700' : 'text-yellow-700'}`}>
                                                    {s === 'Selesai' ? '✓ Selesai' : '⏳ Menunggu'}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Catatan Admin */}
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Catatan Admin (opsional)</label>
                                    <textarea
                                        value={responForm.catatan_admin}
                                        onChange={(e) => setResponForm(prev => ({ ...prev, catatan_admin: e.target.value }))}
                                        placeholder="Tuliskan respon atau catatan untuk pengirim..."
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                    />
                                </div>

                                {/* Tampilkan catatan admin lama jika ada */}
                                {selectedSaran.catatan_admin && (
                                    <div className="mt-2 p-3 bg-green-50 border border-green-100 rounded-lg text-xs text-green-800">
                                        <p className="font-medium mb-1">Catatan sebelumnya:</p>
                                        <p>{selectedSaran.catatan_admin}</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                                <Button variant="secondary" onClick={() => setSelectedSaran(null)}>Batal</Button>
                                <Button
                                    onClick={handleRespond}
                                    disabled={isResponding}
                                    className="bg-green-500 hover:bg-green-600 text-white font-medium flex items-center gap-2"
                                >
                                    {isResponding ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                    Simpan Respon
                                </Button>
                            </div>
                        </div>
                    )}
                </Modal>

                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            </div>
        );
    }

    // ── RELAWAN VIEW (Mobile) ──
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
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            </div>
        );
    }

    // ── OPD VIEW (Desktop) ──
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Hotline BAPPEDA Kota Yogyakarta">{contactInfo}</Card>
                <Card title="Kirim Saran & Masukan">{feedbackForm}</Card>
            </div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default SaranHotline;
//SaranHotline.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Phone, MessageCircle, Clock, Check, Eye, Loader2, Edit2, Save, X, Search, ExternalLink } from 'lucide-react';
import Card from '../components/ui/Card';
import RelawanMenu from '../components/RelawanMenu';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Toast, { ToastType } from '../components/ui/Toast';
import Pagination from '../components/ui/Pagination';
import { useAuth } from '../context/AuthContext';
import { SaranData } from '../types';
import { useSaranList } from '../hooks/saran/useSaranList';
import { useCreateSaran, useRespondSaran } from '../hooks/saran/useSaranMutations';
import { useProfileData } from '../hooks/profil/useProfileData';
import { parseErrorMessage } from '../utils/parseErrorMessage';
import apiClient from '../lib/axios';
import { formatPhoneDisplay } from '../utils/formatPhone';
interface HotlineInfo {
    telepon: string;
    whatsapp: string;
    jam_layanan: string;
    updated_at?: string | null;
}

const DEFAULT_HOTLINE: HotlineInfo = {
    telepon: '0274-XXXXXXX',
    whatsapp: '+62 812-XXXX-XXXX',
    jam_layanan: 'Senin–Jumat, 08.00–16.00',
};

const SaranHotline: React.FC = () => {
    const { user, isSuperAdmin } = useAuth();
    const isRelawan = user?.role === 'relawan';
    const userNoHp = (user as any)?.no_hp || '';

    // ── Server State ─────────────────────────────────────────
    const { data: saranList = [], isLoading } = useSaranList(isSuperAdmin);
    const { data: profileData } = useProfileData();
    const createSaran = useCreateSaran();
    const respondSaran = useRespondSaran();

    // ── Hotline Info ──────────────────────────────────────────
    const [hotline, setHotline] = useState<HotlineInfo>(DEFAULT_HOTLINE);
    const [isLoadingHotline, setIsLoadingHotline] = useState(false);
    const [isEditingHotline, setIsEditingHotline] = useState(false);
    const [hotlineForm, setHotlineForm] = useState<HotlineInfo>(DEFAULT_HOTLINE);
    const [isSavingHotline, setIsSavingHotline] = useState(false);

    const fetchHotline = useCallback(async () => {
        setIsLoadingHotline(true);
        try {
            const { data } = await apiClient.get('/settings/hotline');
            if (data.success) {
                setHotline(data.data);
                setHotlineForm(data.data);
            }
        } catch {
            // pakai default
        } finally {
            setIsLoadingHotline(false);
        }
    }, []);

    useEffect(() => { fetchHotline(); }, [fetchHotline]);

    const handleSaveHotline = async () => {
        setIsSavingHotline(true);
        try {
            const { data } = await apiClient.put('/settings/hotline', {
                telepon: hotlineForm.telepon,
                whatsapp: hotlineForm.whatsapp,
                jam_layanan: hotlineForm.jam_layanan,
            });
            if (data.success) {
                setHotline({ ...hotlineForm, updated_at: new Date().toISOString() });
                setIsEditingHotline(false);
                setToast({ message: 'Informasi hotline berhasil diperbarui!', type: 'success' });
            }
        } catch (e: any) {
            setToast({ message: parseErrorMessage(e, 'Gagal menyimpan hotline'), type: 'error' });
        } finally {
            setIsSavingHotline(false);
        }
    };

    // ── UI State ──────────────────────────────────────────────
    const [formData, setFormData] = useState({ namaLengkap: user?.name || '', noTelepon: userNoHp, saran: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const [selectedSaran, setSelectedSaran] = useState<SaranData | null>(null);
    const [isResponding, setIsResponding] = useState(false);
    const [responForm, setResponForm] = useState({ status: 'Selesai' as 'Menunggu' | 'Selesai', catatan_admin: '' });
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [searchTerm, setSearchTerm] = useState('');
    const itemsPerPage = 5;

    useEffect(() => {
        const autoNama = user?.name || '';
        const autoNoHp = profileData?.no_hp || userNoHp;
        setFormData(prev => ({
            ...prev,
            namaLengkap: prev.namaLengkap || autoNama,
            noTelepon: prev.noTelepon || autoNoHp,
        }));
    }, [user?.name, userNoHp, profileData?.no_hp]);

    // Filter & Pagination
    const filteredSaran = saranList.filter(s => {
        const q = searchTerm.toLowerCase();
        return !q ||
            (s.nama_lengkap || '').toLowerCase().includes(q) ||
            (s.no_hp || '').toLowerCase().includes(q) ||
            (s.pesan || '').toLowerCase().includes(q) ||
            (s.status || '').toLowerCase().includes(q);
    });
    const totalPages = Math.ceil(filteredSaran.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentSaranData = filteredSaran.slice(startIndex, endIndex);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.namaLengkap.trim()) {
            setToast({ message: 'Nama lengkap wajib diisi', type: 'error' });
            return;
        }
        if (!formData.noTelepon.trim()) {
            setToast({ message: 'Nomor telepon wajib diisi', type: 'error' });
            return;
        }
        if (!/^[0-9+\-\s]{10,13}$/.test(formData.noTelepon.trim())) {
            setToast({ message: 'Nomor telepon tidak valid — harus 10–13 digit angka (contoh: 08123456789)', type: 'error' });
            return;
        }
        if (!formData.saran.trim()) {
            setToast({ message: 'Saran atau kendala tidak boleh kosong', type: 'error' });
            return;
        }
        setIsSubmitting(true);
        createSaran.mutate(
            { subjek: `Dari: ${formData.namaLengkap} (${formData.noTelepon.replace(/\D/g, '')})`, pesan: formData.saran },
            {
                onSuccess: () => {
                    setToast({ message: 'Saran berhasil dikirim. Terima kasih!', type: 'success' });
                    setFormData({ namaLengkap: user?.name || '', noTelepon: profileData?.no_hp || userNoHp, saran: '' });
                },
                onError: (err: any) => setToast({ message: parseErrorMessage(err, 'Gagal mengirim saran'), type: 'error' }),
                onSettled: () => setIsSubmitting(false),
            }
        );
    };

    const handleDetailClick = (saran: SaranData) => {
        setSelectedSaran(saran);
        setResponForm({ status: saran.status === 'Menunggu' ? 'Selesai' : 'Menunggu', catatan_admin: saran.catatan_admin || '' });
    };

    const handleRespond = async () => {
        if (!selectedSaran) return;
        setIsResponding(true);
        respondSaran.mutate(
            { saran_id: selectedSaran.saran_id, status: responForm.status, catatan_admin: responForm.catatan_admin || null },
            {
                onSuccess: (d) => { setToast({ message: d.message, type: 'success' }); setSelectedSaran(null); },
                onError: (err: any) => setToast({ message: parseErrorMessage(err, 'Gagal memperbarui status'), type: 'error' }),
                onSettled: () => setIsResponding(false),
            }
        );
    };

    const handleQuickToggle = async (saran: SaranData) => {
        const newStatus = saran.status === 'Menunggu' ? 'Selesai' : 'Menunggu';
        respondSaran.mutate(
            { saran_id: saran.saran_id, status: newStatus, catatan_admin: saran.catatan_admin || null },
            {
                onSuccess: (d) => setToast({ message: d.message, type: 'success' }),
                onError: (err: any) => setToast({ message: parseErrorMessage(err, 'Gagal memperbarui status'), type: 'error' }),
            }
        );
    };

    const saranColumns = [
        { header: 'NAMA PENGIRIM', accessor: 'nama_lengkap' as keyof SaranData },
        { 
            header: 'NO. TELEPON', 
            render: (row: SaranData) => formatPhoneDisplay(row.no_hp) 
        },
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
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${row.status === 'Selesai'
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
            <button onClick={() => handleDetailClick(row)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Lihat Detail & Beri Respon">
                <Eye size={18} />
            </button>
            <button
                onClick={() => handleQuickToggle(row)}
                className={`p-1.5 rounded-lg transition-colors ${row.status === 'Selesai' ? 'text-gray-400 hover:bg-gray-200' : 'text-green-600 hover:bg-green-100'}`}
                title={row.status === 'Selesai' ? 'Batal Selesai' : 'Tandai Selesai'}
            >
                <Check size={18} />
            </button>
        </>
    );

    // Helper URL WhatsApp
    const formatWhatsAppUrl = (waNumber: string) => {
        let cleaned = waNumber.replace(/\D/g, '');
        if (cleaned.startsWith('0')) {
            cleaned = '62' + cleaned.substring(1);
        }
        return `https://api.whatsapp.com/send/?phone=${cleaned}&type=phone_number&app_absent=0`;
    };

    // Contact info (dari API, bukan hardcoded)
    const contactInfo = (
        <div className="space-y-5">
            {[
                { icon: <Phone className="text-gray-600" size={24} />, label: 'Telepon', value: hotline.telepon },
                { icon: <MessageCircle className="text-gray-600" size={24} />, label: 'WhatsApp', value: hotline.whatsapp },
                { icon: <Clock className="text-gray-600" size={24} />, label: 'Jam Layanan', value: hotline.jam_layanan },
            ].map(item => (
                <div key={item.label} className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        {item.icon}
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 mb-1">{item.label}</p>
                        {item.label === 'WhatsApp' ? (
                            <a 
                                href={formatWhatsAppUrl(item.value)} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-base font-semibold text-green-600 hover:text-green-700 hover:underline flex items-center gap-1 w-fit"
                            >
                                {item.value}
                                <ExternalLink size={14} className="ml-1" />
                            </a>
                        ) : (
                            <p className="text-base font-semibold text-gray-800">{item.value}</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );

    const feedbackForm = (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" name="namaLengkap" value={formData.namaLengkap} onChange={handleInputChange} placeholder="Nama Lengkap"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
            <input type="tel" name="noTelepon" value={formData.noTelepon} disabled={!!userNoHp} onChange={handleInputChange} placeholder="No. Telepon"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm ${!!userNoHp ? 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed' : 'border-gray-300'}`} />
            <textarea name="saran" value={formData.saran} onChange={handleInputChange} placeholder="Tuliskan saran atau kendala Anda di sini..." rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none text-sm" />
            <Button type="submit" disabled={isSubmitting} className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors justify-center disabled:opacity-70">
                {isSubmitting ? (<span className="flex items-center justify-center gap-2"><Loader2 size={18} className="animate-spin" /> Mengirim...</span>) : 'Kirim Saran'}
            </Button>
        </form>
    );

    // ── SUPER ADMIN VIEW ──
    if (isSuperAdmin) {
        return (
            <div className="space-y-6">
                {/* ── Panel Editor Hotline ── */}
                <Card>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <Phone size={16} className="text-green-600" />
                                <h3 className="font-semibold text-gray-800 text-sm">Informasi Hotline</h3>
                            </div>
                            <p className="text-xs text-gray-500 mb-3">
                                Perubahan yang disimpan akan langsung tampil di halaman OPD dan Relawan.
                                {hotline.updated_at && (
                                    <span className="ml-2 text-gray-400">
                                        · Terakhir diubah: {new Date(hotline.updated_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                    </span>
                                )}
                            </p>

                            {isEditingHotline ? (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {[
                                        { label: 'Telepon', key: 'telepon', placeholder: '0274-XXXXXXX' },
                                        { label: 'WhatsApp', key: 'whatsapp', placeholder: '+62 812-XXXX-XXXX' },
                                        { label: 'Jam Layanan', key: 'jam_layanan', placeholder: 'Senin–Jumat, 08.00–16.00' },
                                    ].map(field => (
                                        <div key={field.key}>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
                                            <input
                                                type="text"
                                                value={(hotlineForm as any)[field.key]}
                                                onChange={e => setHotlineForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                                                placeholder={field.placeholder}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-6 text-sm text-gray-700">
                                    <span className="flex items-center gap-1.5"><Phone size={14} className="text-gray-400" /> {hotline.telepon}</span>
                                    <span className="flex items-center gap-1.5"><MessageCircle size={14} className="text-gray-400" /> {hotline.whatsapp}</span>
                                    <span className="flex items-center gap-1.5"><Clock size={14} className="text-gray-400" /> {hotline.jam_layanan}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2 flex-shrink-0">
                            {isEditingHotline ? (
                                <>
                                    <Button variant="secondary" size="sm" onClick={() => { setIsEditingHotline(false); setHotlineForm(hotline); }}>
                                        <X size={14} /> Batal
                                    </Button>
                                    <Button
                                        size="sm"
                                        disabled={isSavingHotline}
                                        onClick={handleSaveHotline}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        {isSavingHotline ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                        Simpan
                                    </Button>
                                </>
                            ) : (
                                <Button variant="outline" size="sm" onClick={() => setIsEditingHotline(true)}>
                                    <Edit2 size={14} /> Edit Hotline
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>

                {/* ── Kotak Masuk Saran ── */}
                {isLoading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 size={28} className="animate-spin text-gray-400" />
                        <span className="ml-3 text-gray-500">Memuat saran masukan...</span>
                    </div>
                ) : (
                    <Card>
                        {/* Header: judul kiri + search bar kanan — sejajar */}
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Kotak Masuk Saran &amp; Kendala</h3>
                            <div className="relative w-72">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    placeholder="Cari nama, telepon, atau pesan..."
                                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                                />
                            </div>
                        </div>

                        {saranList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <p className="text-gray-600 font-medium">Belum ada saran masuk</p>
                                <p className="text-sm text-gray-400 mt-1">Belum ada saran atau kendala yang dikirimkan oleh pengguna.</p>
                            </div>
                        ) : filteredSaran.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <p className="text-gray-600 font-medium">Tidak ada hasil pencarian</p>
                                <p className="text-sm text-gray-400 mt-1">Coba kata kunci lain.</p>
                            </div>
                        ) : (
                            <Table columns={saranColumns} data={currentSaranData} actions={saranActions} minRows={5} />
                        )}

                        {filteredSaran.length > 0 && (
                            <div className="mt-4 flex justify-between items-center">
                                <div className="text-sm text-gray-500">
                                    Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredSaran.length)} dari {filteredSaran.length} Saran
                                </div>
                                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(page) => setCurrentPage(page)} />
                            </div>
                        )}
                    </Card>
                )}

                {/* Modal Detail + Respon */}
                <Modal isOpen={!!selectedSaran} onClose={() => setSelectedSaran(null)} title="Detail Saran & Beri Respon" maxWidth="md">
                    {selectedSaran && (
                        <div className="space-y-5 text-sm">
                            <div>
                                <p className="text-gray-500 mb-1">Pengirim</p>
                                <p className="font-semibold text-gray-800 text-base">{selectedSaran.nama_lengkap}</p>
                                <p className="text-gray-500 text-xs">{selectedSaran.role}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-gray-500 text-xs mb-1">No. Telepon</p>
                                    <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400" /><p className="font-medium text-gray-800">{formatPhoneDisplay(selectedSaran.no_hp)}</p></div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-gray-500 text-xs mb-1">Tanggal Dikirim</p>
                                    <div className="flex items-center gap-2"><Clock size={14} className="text-gray-400" /><p className="font-medium text-gray-800">{new Date(selectedSaran.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p></div>
                                </div>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-2">Pesan / Saran</p>
                                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedSaran.pesan}</div>
                            </div>
                            <div className="border-t border-gray-200 pt-4">
                                <p className="font-medium text-gray-800 mb-3">Beri Respon</p>
                                <div className="mb-3">
                                    <label className="text-xs text-gray-500 mb-1 block">Update Status</label>
                                    <div className="flex gap-3">
                                        {(['Menunggu', 'Selesai'] as const).map(s => (
                                            <label key={s} className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" name="status" value={s} checked={responForm.status === s} onChange={() => setResponForm(prev => ({ ...prev, status: s }))} className="w-4 h-4 text-green-600" />
                                                <span className={`text-sm font-medium ${s === 'Selesai' ? 'text-green-700' : 'text-yellow-700'}`}>{s === 'Selesai' ? '✓ Selesai' : '⏳ Menunggu'}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Catatan Admin (opsional)</label>
                                    <textarea value={responForm.catatan_admin} onChange={(e) => setResponForm(prev => ({ ...prev, catatan_admin: e.target.value }))} placeholder="Tuliskan respon atau catatan untuk pengirim..." rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
                                </div>
                                {selectedSaran.catatan_admin && (
                                    <div className="mt-2 p-3 bg-green-50 border border-green-100 rounded-lg text-xs text-green-800">
                                        <p className="font-medium mb-1">Catatan sebelumnya:</p>
                                        <p>{selectedSaran.catatan_admin}</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                                <Button variant="secondary" onClick={() => setSelectedSaran(null)}>Batal</Button>
                                <Button onClick={handleRespond} disabled={isResponding} className="bg-green-500 hover:bg-green-600 text-white font-medium flex items-center gap-2">
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
                <RelawanMenu />
                <div className="px-4 py-5 space-y-4">
                    <h1 className="text-xl font-bold text-gray-800 text-center">Saran dan Hotline</h1>
                    <Card className="shadow-md">
                        <div className="p-4">
                            <h2 className="text-base font-bold text-gray-800 mb-4">Hotline BAPPEDA Kota Yogyakarta</h2>
                            {isLoadingHotline ? <Loader2 size={20} className="animate-spin text-gray-400" /> : contactInfo}
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
                <Card title="Hotline BAPPEDA Kota Yogyakarta">
                    {isLoadingHotline ? <Loader2 size={20} className="animate-spin text-gray-400" /> : contactInfo}
                </Card>
                <Card title="Kirim Saran & Masukan">{feedbackForm}</Card>
            </div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default SaranHotline;
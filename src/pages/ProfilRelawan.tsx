//ProfileRelawan.tsx
import { useState, useEffect, useCallback } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import RelawanMenu from '../components/RelawanMenu';
import Toast, { ToastType } from '../components/ui/Toast';
import apiClient from '../lib/axios';
import { parseErrorMessage } from '../utils/parseErrorMessage';
import { formatPhoneDisplay } from '../utils/formatPhone';
import { Loader2 } from 'lucide-react';

interface ProfilData {
    nik: string;
    nama_lengkap: string;
    no_hp: string | null;
    jenis_kelamin: string;
    alamat_ktp: string | null;
    kelurahan: string | null;
}

const ProfilRelawan = () => {
    const [profil, setProfil] = useState<ProfilData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    // State form hanya menyisakan data yang diizinkan untuk diubah
    const [updateForm, setUpdateForm] = useState({
        alamat: '',
        kelurahan: '',
        noHp: '',
        catatan: '',
    });

    const fetchProfil = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data: result } = await apiClient.get('/relawan/profile');
            if (result.success) {
                setProfil(result.data);
            } else {
                setToast({ message: 'Gagal memuat profil', type: 'error' });
            }
        } catch (e: any) {
            setToast({ message: parseErrorMessage(e, 'Tidak dapat terhubung ke server'), type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchProfil(); }, [fetchProfil]);

    const handleOpenModal = () => {
        setUpdateForm({ alamat: '', kelurahan: '', noHp: '', catatan: '' });
        setIsModalOpen(true);
    };

    const handleConfirmSubmit = async () => {
        setIsSubmitting(true);
        try {
            const dataBaru: Record<string, string> = {};
            if (updateForm.alamat.trim())    dataBaru.alamat_ktp = updateForm.alamat.trim();
            if (updateForm.kelurahan.trim()) dataBaru.kelurahan  = updateForm.kelurahan.trim();
            if (updateForm.noHp.trim())      dataBaru.no_hp      = updateForm.noHp.trim().replace(/\D/g, '');

            if (Object.keys(dataBaru).length === 0) {
                setToast({ message: 'Minimal satu data harus diubah', type: 'error' });
                setIsConfirmOpen(false);
                return;
            }

            if (!updateForm.catatan.trim()) {
                setToast({ message: 'Catatan / Alasan Perubahan wajib diisi', type: 'error' });
                setIsConfirmOpen(false);
                return;
            }

            const { data: result } = await apiClient.post('/relawan/profile/update', { 
                data_baru: dataBaru, 
                catatan: updateForm.catatan 
            });

            if (result.success) {
                setToast({ message: result.message, type: 'success' });
                setIsConfirmOpen(false);
                setIsModalOpen(false);
            } else {
                setToast({ message: result.message || 'Gagal mengirim pengajuan', type: 'error' });
            }
        } catch (e: any) {
            setToast({ message: parseErrorMessage(e, 'Tidak dapat terhubung ke server'), type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <RelawanMenu />

            <div className="px-4 py-5 space-y-3">
                {/* Welcome Card */}
                <Card className="shadow-md bg-gradient-to-r from-green-500 to-green-600">
                    <div className="p-2 text-white">
                        <h2 className="text-xl font-bold mb-1">Selamat Datang!</h2>
                        <p className="text-green-50">{isLoading ? '...' : (profil?.nama_lengkap || '-')}</p>
                    </div>
                </Card>

                {/* Profile Card */}
                <Card className="shadow-md">
                    <div className="p-2">
                        <h2 className="text-lg font-semibold text-gray-800 mb-2">Informasi Pribadi</h2>

                        {isLoading ? (
                            <div className="flex items-center justify-center py-5">
                                <Loader2 size={24} className="animate-spin text-gray-400" />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {[
                                    { label: 'Nama Lengkap', value: profil?.nama_lengkap },
                                    { label: 'NIK', value: profil?.nik },
                                    { label: 'Jenis Kelamin', value: profil?.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan' },
                                    { label: 'Alamat KTP', value: profil?.alamat_ktp },
                                    { label: 'Kelurahan', value: profil?.kelurahan },
                                    { label: 'No. HP', value: formatPhoneDisplay(profil?.no_hp) },
                                ].map(item => (
                                    <div key={item.label}>
                                        <label className="block text-sm font-medium text-gray-500 mb-0.5">{item.label}</label>
                                        <p className="text-gray-800 font-medium">{item.value || '-'}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        <Button
                            onClick={handleOpenModal}
                            className="w-full mt-4 bg-green-600 text-white hover:bg-green-700 py-2.5 rounded-lg font-medium"
                        >
                            Ajukan Pembaruan Data
                        </Button>
                        {/* Info pengajuan */}
                        <div className="mt-5 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                            <p className="text-xs text-blue-700 leading-relaxed">
                                <span className="font-semibold">Informasi:</span> Perubahan data hanya dapat dilakukan pada Informasi Pribadi tertentu (Alamat, Kelurahan, No. HP) dan memerlukan persetujuan dari Admin OPD atau Super Admin. Pengajuan yang dikirim akan berstatus <span className="font-semibold">Menunggu Review</span> hingga diproses.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Modal Ajukan Pembaruan */}
            {isModalOpen && (
                <>
                    <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setIsModalOpen(false)} />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between p-5 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-800">Ajukan Pembaruan Data</h2>
                                <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="p-5 space-y-4">
                                {/* Peringatan */}
                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-xs text-yellow-800 leading-relaxed">
                                        <span className="font-semibold">Perhatian:</span> Pengajuan ini hanya untuk perubahan <span className="font-semibold">Informasi Kontak & Domisili</span>. Data tidak akan langsung berubah — perubahan akan berlaku setelah disetujui oleh Admin.
                                    </p>
                                </div>

                                <p className="text-sm text-gray-500">Isi data yang ingin diubah. Kosongkan field yang tidak ingin diubah.</p>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Baru</label>
                                    <textarea
                                        value={updateForm.alamat}
                                        onChange={(e) => setUpdateForm(p => ({ ...p, alamat: e.target.value }))}
                                        placeholder={profil?.alamat_ktp || 'Alamat tempat tinggal baru'}
                                        rows={3}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 resize-none text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kelurahan Baru</label>
                                    <input
                                        type="text"
                                        value={updateForm.kelurahan}
                                        onChange={(e) => setUpdateForm(p => ({ ...p, kelurahan: e.target.value }))}
                                        placeholder={profil?.kelurahan || 'Kelurahan baru'}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">No. HP Baru</label>
                                    <input
                                        type="tel"
                                        value={updateForm.noHp}
                                        onChange={(e) => setUpdateForm(p => ({ ...p, noHp: e.target.value }))}
                                        placeholder={profil?.no_hp || 'Contoh: 0812xxxxxxxx'}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Catatan / Alasan Perubahan <span className="text-red-500">*</span></label>
                                    <textarea
                                        value={updateForm.catatan}
                                        onChange={(e) => setUpdateForm(p => ({ ...p, catatan: e.target.value }))}
                                        placeholder="Tuliskan alasan mengapa data perlu diubah..."
                                        rows={3}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 resize-none text-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 p-5 border-t border-gray-200">
                                <Button onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300 py-2.5 rounded-lg font-medium">
                                    Batal
                                </Button>
                                <Button onClick={() => setIsConfirmOpen(true)} className="flex-1 bg-green-600 text-white hover:bg-green-700 py-2.5 rounded-lg font-medium">
                                    Ajukan
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Dialog Konfirmasi */}
            {isConfirmOpen && (
                <>
                    <div className="fixed inset-0 bg-black/40 z-[60]" />
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center">
                            <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-7 h-7 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Konfirmasi Pengajuan</h3>
                            <p className="text-sm text-gray-600 mb-1">Pengajuan akan dikirim ke Admin untuk diproses.</p>
                            <p className="text-xs text-gray-500 mb-6">Data Anda belum berubah sampai pengajuan disetujui.</p>
                            <div className="flex gap-3">
                                <Button onClick={() => setIsConfirmOpen(false)} className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300 py-2.5 rounded-lg font-medium">
                                    Batal
                                </Button>
                                <Button onClick={handleConfirmSubmit} disabled={isSubmitting} className="flex-1 bg-green-600 text-white hover:bg-green-700 py-2.5 rounded-lg font-medium disabled:opacity-50">
                                    {isSubmitting ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Ya, Ajukan'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default ProfilRelawan;
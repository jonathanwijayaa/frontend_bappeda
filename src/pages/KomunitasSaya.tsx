//KomunitasSaya.tsx
import { useState, useEffect, useCallback } from 'react';
import Card from '../components/ui/Card';
import RelawanMenu from '../components/RelawanMenu';
import Toast, { ToastType } from '../components/ui/Toast';
import apiClient from '../lib/axios';
import { Loader2 } from 'lucide-react';

interface PenugasanData {
    penugasan_id: number;
    nama_opd: string;
    nama_kader: string | null;
    jabatan: string | null;
    detail_jabatan: string | null;
    status_keaktifan: string;
    nomor_sk: string | null;
}

const KomunitasSaya = () => {
    const [penugasanList, setPenugasanList] = useState<PenugasanData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    const fetchPenugasan = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data: result } = await apiClient.get('/relawan/penugasan');
            if (result.success) {
                setPenugasanList(result.data);
            } else {
                setToast({ message: 'Gagal memuat data penugasan', type: 'error' });
            }
        } catch {
            setToast({ message: 'Tidak dapat terhubung ke server', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchPenugasan(); }, [fetchPenugasan]);

    const totalAktif = penugasanList.filter(p => p.status_keaktifan === 'Aktif').length;

    return (
        <div className="min-h-screen bg-gray-50">
            <RelawanMenu />

            <div className="px-4 py-5 space-y-4">
                <h1 className="text-xl font-bold text-gray-800 text-center mb-5">Penugasan Saya</h1>
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <Card className="shadow-md">
                        <div className="p-4 text-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                </svg>
                            </div>
                            <p className="text-2xl font-bold text-gray-800">{penugasanList.length}</p>
                            <p className="text-xs text-gray-600 mt-1">Total Penugasan</p>
                        </div>
                    </Card>
                    <Card className="shadow-md">
                        <div className="p-4 text-center">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <p className="text-2xl font-bold text-gray-800">{totalAktif}</p>
                            <p className="text-xs text-gray-600 mt-1">Aktif</p>
                        </div>
                    </Card>
                </div>

                {/* Penugasan List */}
                <Card className="shadow-md">
                    <div className="p-5">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Penugasan Saya</h2>

                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 size={24} className="animate-spin text-gray-400" />
                                <span className="ml-2 text-gray-500 text-sm">Memuat data...</span>
                            </div>
                        ) : penugasanList.length > 0 ? (
                            <div className="space-y-3">
                                {penugasanList.map((p) => (
                                    <div key={p.penugasan_id} className="border border-gray-200 rounded-lg p-4 bg-white">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-800 text-sm">
                                                    {p.nama_kader || 'Tanpa Kader'}
                                                </h3>
                                                <p className="text-xs text-gray-500 mt-0.5">{p.nama_opd}</p>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${p.status_keaktifan === 'Aktif'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {p.status_keaktifan}
                                            </span>
                                        </div>
                                        <div className="space-y-1.5 mt-3 border-t border-gray-100 pt-3">
                                            {p.jabatan && (
                                                <div className="flex text-xs">
                                                    <span className="text-gray-500 w-24 flex-shrink-0">Jabatan:</span>
                                                    <span className="text-gray-800 font-medium">{p.jabatan}</span>
                                                </div>
                                            )}
                                            {p.detail_jabatan && (
                                                <div className="flex text-xs">
                                                    <span className="text-gray-500 w-24 flex-shrink-0">Detail:</span>
                                                    <span className="text-gray-800">{p.detail_jabatan}</span>
                                                </div>
                                            )}
                                            {p.nomor_sk && (
                                                <div className="flex text-xs">
                                                    <span className="text-gray-500 w-24 flex-shrink-0">No. SK:</span>
                                                    <span className="text-gray-800">{p.nomor_sk}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-gray-500 text-sm">Belum ada penugasan terdaftar</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default KomunitasSaya;
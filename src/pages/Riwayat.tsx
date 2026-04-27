//Riwaya.tsx
import { useState, useMemo } from 'react';
import RelawanMenu from '../components/RelawanMenu';
import Toast, { ToastType } from '../components/ui/Toast';
import { Loader2 } from 'lucide-react';
import { PengajuanItem } from '../types';
import { useRiwayatPengajuan } from '../hooks/riwayat/useRiwayatPengajuan';

const STATUS_CONFIG = {
    'Menunggu Review': { label: 'Menunggu Review', dot: 'bg-yellow-400', text: 'text-yellow-700' },
    'Diterima':        { label: 'Diterima',        dot: 'bg-green-500',  text: 'text-green-700' },
    'Ditolak':         { label: 'Ditolak',          dot: 'bg-red-500',    text: 'text-red-600' },
};

const FIELD_LABELS: Record<string, string> = {
    nama_lengkap: 'Nama Lengkap',
    alamat_ktp:   'Alamat KTP',
    kelurahan:    'Kelurahan',
    no_hp:        'No. HP',
    email:        'Email',
};

const Riwayat = () => {
    // ── Server State ──────────────────────────────────────────
    const { data: pengajuanList = [], isLoading } = useRiwayatPengajuan();

    // ── UI State ──────────────────────────────────────────────
    const [activeTab, setActiveTab]       = useState<'diproses' | 'selesai'>('diproses');
    const [selectedItem, setSelectedItem] = useState<PengajuanItem | null>(null);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    const diprosesItems  = useMemo(() => pengajuanList.filter(p => p.status === 'Menunggu Review'), [pengajuanList]);
    const selesaiItems   = useMemo(() => pengajuanList.filter(p => p.status !== 'Menunggu Review'), [pengajuanList]);
    const currentItems   = activeTab === 'diproses' ? diprosesItems : selesaiItems;

    const getStatusBadge = (status: PengajuanItem['status']) => {
        const cfg = STATUS_CONFIG[status];
        return (
            <span className={`flex items-center gap-1.5 text-sm font-medium ${cfg.text}`}>
                <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
            </span>
        );
    };

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

    const renderPerubahan = (item: PengajuanItem) => {
        if (!item.data_baru) return null;
        const entries = Object.entries(item.data_baru);
        if (entries.length === 0) return null;
        return (
            <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Data yang Diajukan</h3>
                <div className="space-y-2">
                    {entries.map(([key, value]) => (
                        <div key={key} className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs font-semibold text-gray-500 mb-1.5">
                                {FIELD_LABELS[key] || key}
                            </p>
                            {item.data_lama?.[key] && (
                                <div className="flex gap-2 text-xs mb-1">
                                    <span className="text-red-500 font-medium flex-shrink-0">Dari:</span>
                                    <span className="text-gray-600">{item.data_lama[key]}</span>
                                </div>
                            )}
                            <div className="flex gap-2 text-xs">
                                <span className="text-green-600 font-medium flex-shrink-0">Menjadi:</span>
                                <span className="text-gray-800 font-medium">{String(value)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <RelawanMenu />

            <div className="px-4 py-5">
                <h1 className="text-2xl font-bold text-gray-800 text-center mb-5">Riwayat Pengajuan</h1>

                {/* Info banner */}
                <div className="mb-5 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-xs text-blue-700 leading-relaxed">
                        <span className="font-semibold">ℹ️</span> Pengajuan perubahan data memerlukan persetujuan Admin.
                        Status: <span className="font-semibold text-yellow-700">Menunggu Review</span> →{' '}
                        <span className="font-semibold text-green-700">Diterima</span> atau{' '}
                        <span className="font-semibold text-red-600">Ditolak</span>.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex justify-center gap-8 mb-6">
                    {[
                        { key: 'diproses', label: 'Diproses', count: diprosesItems.length },
                        { key: 'selesai',  label: 'Selesai',  count: selesaiItems.length },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={`pb-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                                activeTab === tab.key
                                    ? 'text-gray-800 border-b-2 border-gray-800'
                                    : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span className="bg-gray-200 text-gray-700 text-xs px-1.5 py-0.5 rounded-full">
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 size={24} className="animate-spin text-gray-400" />
                        <span className="ml-2 text-gray-500 text-sm">Memuat riwayat...</span>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {currentItems.length > 0 ? currentItems.map(item => (
                            <button
                                key={item.pengajuan_id}
                                onClick={() => setSelectedItem(item)}
                                className="w-full flex items-center justify-between py-3 px-2 hover:bg-gray-100 rounded-lg transition-colors text-left"
                            >
                                <div>
                                    <p className="text-sm font-medium text-gray-800">{item.jenis_perubahan}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{formatDate(item.tanggal_pengajuan)}</p>
                                </div>
                                {getStatusBadge(item.status)}
                            </button>
                        )) : (
                            <div className="text-center py-12">
                                <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-gray-500 text-sm">Belum ada riwayat pengajuan</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedItem && (
                <>
                    <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelectedItem(null)} />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between p-5 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-800">Detail Pengajuan</h2>
                                <button onClick={() => setSelectedItem(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-500">Tanggal Pengajuan</p>
                                        <p className="text-sm font-medium text-gray-800">{formatDate(selectedItem.tanggal_pengajuan)}</p>
                                    </div>
                                    {getStatusBadge(selectedItem.status)}
                                </div>

                                {selectedItem.tanggal_verifikasi && (
                                    <div>
                                        <p className="text-xs text-gray-500">Tanggal Diproses</p>
                                        <p className="text-sm font-medium text-gray-800">{formatDate(selectedItem.tanggal_verifikasi)}</p>
                                    </div>
                                )}

                                {renderPerubahan(selectedItem)}

                                {selectedItem.catatan_relawan && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Catatan Anda</h3>
                                        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{selectedItem.catatan_relawan}</p>
                                    </div>
                                )}

                                {selectedItem.catatan_verifikator && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-blue-700 mb-2">Catatan dari Admin</h3>
                                        <p className="text-sm text-blue-800 bg-blue-50 border border-blue-100 rounded-lg p-3">{selectedItem.catatan_verifikator}</p>
                                    </div>
                                )}

                                {selectedItem.status === 'Menunggu Review' && (
                                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <p className="text-xs text-yellow-800">⏳ Pengajuan Anda sedang menunggu review dari Admin.</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-5 border-t border-gray-200">
                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="w-full bg-gray-200 text-gray-700 hover:bg-gray-300 py-2.5 rounded-lg font-medium transition-colors"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default Riwayat;
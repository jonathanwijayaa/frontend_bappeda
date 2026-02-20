import { useState } from 'react';
import RelawanMenu from '../components/RelawanMenu';

interface PerubahanDetail {
    field: string;
    dari: string;
    menjadi: string;
}

interface RiwayatItem {
    id: number;
    tanggal: string;
    status: 'Review' | 'Ditolak' | 'Diterima';
    catatan: string;
    catatanVerifikator?: string;
    perubahan: PerubahanDetail[];
}

const mockRiwayat: RiwayatItem[] = [
    {
        id: 1,
        tanggal: '5 Desember 2024, 07:43',
        status: 'Review',
        catatan: 'Mohon diperbarui karena pindah domisili.',
        perubahan: [
            { field: 'Alamat', dari: 'Jl. Malioboro No. 10, Yogyakarta', menjadi: 'Jl. Kaliurang KM 12, Sleman' },
            { field: 'No. HP', dari: '081234567890', menjadi: '089876543210' },
        ],
    },
    {
        id: 2,
        tanggal: '12 November 2024, 07:00',
        status: 'Ditolak',
        catatan: 'Perubahan nama kesalahan ketik.',
        catatanVerifikator: 'Perubahan ditolak.',
        perubahan: [
            { field: 'Nama Lengkap', dari: 'Budi Santoso', menjadi: 'Budi Santosa' },
        ],
    },
    {
        id: 3,
        tanggal: '11 September 2024, 07:00',
        status: 'Diterima',
        catatan: 'Update nomor HP baru.',
        catatanVerifikator: 'Data telah diverifikasi dan diperbarui. Terima kasih atas laporannya.',
        perubahan: [
            { field: 'No. HP', dari: '081111222333', menjadi: '081234567890' },
            { field: 'Alamat', dari: 'Jl. Solo No. 5, Yogyakarta', menjadi: 'Jl. Malioboro No. 10, Yogyakarta' },
        ],
    },
];

const Riwayat = () => {
    const [activeTab, setActiveTab] = useState<'diproses' | 'selesai'>('diproses');
    const [selectedItem, setSelectedItem] = useState<RiwayatItem | null>(null);

    const diprosesItems = mockRiwayat.filter(item => item.status === 'Review');
    const selesaiItems = mockRiwayat.filter(item => item.status === 'Ditolak' || item.status === 'Diterima');

    const getStatusBadge = (status: RiwayatItem['status']) => {
        switch (status) {
            case 'Review':
                return (
                    <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                        <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full"></span>
                        Review
                    </span>
                );
            case 'Ditolak':
                return <span className="text-sm font-medium text-red-600">Ditolak</span>;
            case 'Diterima':
                return <span className="text-sm font-medium text-green-600">Diterima</span>;
        }
    };

    const currentItems = activeTab === 'diproses' ? diprosesItems : selesaiItems;

    return (
        <div className="min-h-screen bg-gray-50">
            <RelawanMenu title="Icon App" />

            <div className="px-4 py-5">
                {/* Page Title */}
                <h1 className="text-2xl font-bold text-gray-800 text-center mb-5">Riwayat</h1>

                {/* Tabs */}
                <div className="flex justify-center gap-8 mb-6">
                    <button
                        onClick={() => setActiveTab('diproses')}
                        className={`pb-2 text-sm font-medium transition-colors ${activeTab === 'diproses'
                            ? 'text-gray-800 border-b-2 border-gray-800'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        Diproses
                    </button>
                    <button
                        onClick={() => setActiveTab('selesai')}
                        className={`pb-2 text-sm font-medium transition-colors ${activeTab === 'selesai'
                            ? 'text-gray-800 border-b-2 border-gray-800'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        Selesai
                    </button>
                </div>

                {/* List */}
                <div className="space-y-1">
                    {currentItems.length > 0 ? (
                        currentItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setSelectedItem(item)}
                                className="w-full flex items-center justify-between py-3 px-1 hover:bg-gray-100 rounded-lg transition-colors text-left"
                            >
                                <div>
                                    <p className="text-sm font-medium text-gray-800">Ajukan Perubahan Data</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{item.tanggal}</p>
                                </div>
                                {getStatusBadge(item.status)}
                            </button>
                        ))
                    ) : (
                        <div className="text-center py-12">
                            <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-gray-500 text-sm">Belum ada riwayat</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            {selectedItem && (
                <>
                    {/* Overlay */}
                    <div
                        className="fixed inset-0 bg-black/30 z-40"
                        onClick={() => setSelectedItem(null)}
                    />

                    {/* Modal Content */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-5 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-800">Detail Pengajuan</h2>
                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-5 space-y-4">
                                {/* Tanggal & Status */}
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-500">{selectedItem.tanggal}</p>
                                    {getStatusBadge(selectedItem.status)}
                                </div>

                                {/* Perubahan yang diajukan */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Perubahan yang Diajukan</h3>
                                    <div className="space-y-3">
                                        {selectedItem.perubahan.map((p, idx) => (
                                            <div key={idx} className="bg-gray-50 rounded-lg p-3">
                                                <p className="text-xs font-semibold text-gray-600 mb-2">{p.field}</p>
                                                <div className="space-y-1.5">
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-xs text-red-500 font-medium mt-0.5 flex-shrink-0">Dari:</span>
                                                        <p className="text-sm text-gray-700">{p.dari}</p>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-xs text-green-600 font-medium mt-0.5 flex-shrink-0">Menjadi:</span>
                                                        <p className="text-sm text-gray-800 font-medium">{p.menjadi}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Catatan Relawan */}
                                {selectedItem.catatan && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Catatan Relawan</h3>
                                        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{selectedItem.catatan}</p>
                                    </div>
                                )}

                                {/* Catatan Verifikator */}
                                {selectedItem.catatanVerifikator && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-blue-700 mb-2">Catatan Verifikator</h3>
                                        <p className="text-sm text-blue-800 bg-blue-50 border border-blue-100 rounded-lg p-3">{selectedItem.catatanVerifikator}</p>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
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
        </div>
    );
};

export default Riwayat;

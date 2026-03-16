import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { FileDown, Upload, ChevronLeft, ChevronRight, Loader2, ExternalLink } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { SearchInput } from '../components/ui/Input';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import UploadPDFModal from '../components/ui/UploadPDFModal';
import Toast, { ToastType } from '../components/ui/Toast';
import { exportToPDF } from '../utils/exportToPDF';
import { apiFetch } from '../utils/api';

// Interface sesuai response backend getAllSK
interface SKData {
    sk_id: number;
    nomor_sk: string;
    judul_sk: string | null;
    tanggal_terbit: string | null;
    batas_aktif: string | null;
    status: string;
    file_path: string;
    nama_opd: string;
    jumlah_relawan: number;
}

// Interface sesuai response backend getSKById
interface SKDetail extends SKData {
    daftar_relawan: {
        penugasan_id: number;
        nik: string;
        nama_lengkap: string;
        no_hp: string | null;
        nama_kader: string | null;
        status_keaktifan: string;
    }[];
}

const SuratKeputusan: React.FC = () => {
    const [skList, setSkList] = useState<SKData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
    const [selectedSK, setSelectedSK] = useState<SKDetail | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const itemsPerPage = 5;

    // ── Fetch ────────────────────────────────────
    const fetchSK = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await apiFetch('/admin/sk');
            const result = await res.json();
            if (result.success) {
                setSkList(result.data);
            } else {
                setToast({ message: result.message || 'Gagal memuat data SK', type: 'error' });
            }
        } catch {
            setToast({ message: 'Tidak dapat terhubung ke server', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchSK(); }, [fetchSK]);

    // ── Pagination ───────────────────────────────
    const filteredData = useMemo(() =>
        skList.filter(sk =>
            sk.nomor_sk.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (sk.judul_sk || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            sk.nama_opd.toLowerCase().includes(searchTerm.toLowerCase())
        ), [skList, searchTerm]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    // ── Columns ──────────────────────────────────
    const columns = [
        { header: 'NOMOR SK', accessor: 'nomor_sk' as keyof SKData },
        { header: 'JUDUL SK', accessor: 'judul_sk' as keyof SKData },
        { header: 'OPD', accessor: 'nama_opd' as keyof SKData },
        {
            header: 'TANGGAL TERBIT',
            render: (row: SKData) => (
                <span>{row.tanggal_terbit ? new Date(row.tanggal_terbit).toLocaleDateString('id-ID') : '-'}</span>
            )
        },
        {
            header: 'BATAS AKTIF',
            render: (row: SKData) => (
                <span>{row.batas_aktif ? new Date(row.batas_aktif).toLocaleDateString('id-ID') : '-'}</span>
            )
        },
        {
            header: 'STATUS',
            render: (row: SKData) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {row.status}
                </span>
            )
        },
        {
            header: 'JUMLAH RELAWAN',
            render: (row: SKData) => (
                <span className="font-medium">{row.jumlah_relawan}</span>
            )
        },
    ];

    // ── Handlers ─────────────────────────────────
    const handleDetailClick = async (sk: SKData) => {
        setIsLoadingDetail(true);
        setIsDetailModalOpen(true);
        try {
            const res = await apiFetch(`/admin/sk/${sk.sk_id}`);
            const result = await res.json();
            if (result.success) {
                setSelectedSK(result.data);
            } else {
                setToast({ message: 'Gagal memuat detail SK', type: 'error' });
                setIsDetailModalOpen(false);
            }
        } catch {
            setToast({ message: 'Tidak dapat terhubung ke server', type: 'error' });
            setIsDetailModalOpen(false);
        } finally {
            setIsLoadingDetail(false);
        }
    };

    const handlePDFUploadConfirm = async (file: File, metadata: any) => {
        try {
            // Bangun FormData sesuai backend (POST /api/admin/sk menggunakan multer)
            const formData = new FormData();
            formData.append('file', file);
            formData.append('nomor_sk', metadata.nomorSK);
            formData.append('judul_sk', metadata.judulSK);
            formData.append('tanggal_terbit', metadata.tanggalTerbit);
            formData.append('batas_aktif', metadata.batasAktif || '');
            // namaOPD dari modal dipakai sebagai opd_id lookup - untuk sementara kirim nama OPD
            // dan gunakan opd_id dari list yang sudah ada jika ada, fallback ke 1
            const matchedOpd = skList.find(sk => sk.nama_opd === metadata.namaOPD);
            formData.append('opd_id', matchedOpd ? String((matchedOpd as any).opd_id) : '1');

            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/sk`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: formData
            });
            const result = await res.json();
            if (result.success) {
                setToast({ message: 'SK berhasil diunggah!', type: 'success' });
                setIsUploadModalOpen(false);
                fetchSK();
            } else {
                setToast({ message: result.message || 'Gagal mengunggah SK', type: 'error' });
            }
        } catch {
            setToast({ message: 'Tidak dapat terhubung ke server', type: 'error' });
        }

    };

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            exportToPDF({
                title: 'Daftar Surat Keputusan',
                columns: [
                    { header: 'NOMOR SK', dataKey: 'nomor_sk' },
                    { header: 'JUDUL SK', dataKey: 'judul_sk' },
                    { header: 'OPD', dataKey: 'nama_opd' },
                    { header: 'STATUS', dataKey: 'status' },
                    { header: 'JML RELAWAN', dataKey: 'jumlah_relawan' },
                ],
                data: filteredData,
                filename: `surat-keputusan-${new Date().toISOString().split('T')[0]}.pdf`
            });
            setToast({ message: 'Data berhasil diekspor ke PDF', type: 'success' });
        } catch {
            setToast({ message: 'Gagal mengekspor data ke PDF', type: 'error' });
        } finally {
            setIsExporting(false);
        }
    };

    const actions = (row: SKData) => (
        <Button variant="secondary" size="sm" onClick={() => handleDetailClick(row)}>Detail</Button>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex gap-3">
                    <Button variant="primary" onClick={() => setIsUploadModalOpen(true)}>
                        <Upload size={18} />
                        Upload SK (PDF)
                    </Button>
                </div>
                <SearchInput
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="w-80"
                />
            </div>

            {/* Table */}
            <Card>
                <div className="mb-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">Daftar Surat Keputusan</h2>
                    <Button variant="secondary" size="sm" onClick={handleExportPDF} disabled={isExporting}>
                        {isExporting ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
                        {isExporting ? 'Mengekspor...' : 'Ekspor PDF'}
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 size={28} className="animate-spin text-gray-400" />
                        <span className="ml-3 text-gray-500">Memuat data SK...</span>
                    </div>
                ) : (
                    <Table columns={columns} data={currentData} actions={actions} minRows={5} />
                )}

                {/* Pagination */}
                {!isLoading && filteredData.length > 0 && (
                    <div className="mt-4 flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                            Menampilkan {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredData.length)} dari {filteredData.length} SK
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="disabled:opacity-50 disabled:cursor-not-allowed">
                                <ChevronLeft size={16} /> Sebelumnya
                            </Button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <Button key={page} variant={currentPage === page ? "primary" : "outline"} size="sm" onClick={() => setCurrentPage(page)} className="min-w-[40px]">
                                    {page}
                                </Button>
                            ))}
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="disabled:opacity-50 disabled:cursor-not-allowed">
                                Selanjutnya <ChevronRight size={16} />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Detail SK Modal */}
            <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Detail Surat Keputusan" maxWidth="2xl">
                {isLoadingDetail ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 size={24} className="animate-spin text-gray-400" />
                        <span className="ml-3 text-gray-500">Memuat detail...</span>
                    </div>
                ) : selectedSK && (
                    <div className="space-y-6">
                        {/* Info SK */}
                        <div className="space-y-3">
                            {[
                                { label: 'Nomor SK', value: selectedSK.nomor_sk },
                                { label: 'Judul SK', value: selectedSK.judul_sk || '-' },
                                { label: 'OPD', value: selectedSK.nama_opd },
                                { label: 'Tanggal Terbit', value: selectedSK.tanggal_terbit ? new Date(selectedSK.tanggal_terbit).toLocaleDateString('id-ID') : '-' },
                                { label: 'Batas Aktif', value: selectedSK.batas_aktif ? new Date(selectedSK.batas_aktif).toLocaleDateString('id-ID') : '-' },
                                { label: 'Status', value: selectedSK.status },
                            ].map(item => (
                                <div key={item.label} className="grid grid-cols-3 gap-4 items-center border-b border-gray-100 pb-2">
                                    <span className="text-sm font-medium text-gray-600">{item.label}</span>
                                    <span className="col-span-2 text-sm text-gray-800">{item.value}</span>
                                </div>
                            ))}

                            {/* Link file PDF */}
                            <div className="grid grid-cols-3 gap-4 items-center border-b border-gray-100 pb-2">
                                <span className="text-sm font-medium text-gray-600">File SK</span>
                                <a
                                    href={selectedSK.file_path}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="col-span-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                    <ExternalLink size={14} />
                                    Lihat Dokumen PDF
                                </a>
                            </div>
                        </div>

                        {/* Daftar Relawan */}
                        <div>
                            <h3 className="text-base font-semibold text-gray-800 mb-3">
                                Daftar Relawan ({selectedSK.daftar_relawan?.length || 0})
                            </h3>
                            {selectedSK.daftar_relawan && selectedSK.daftar_relawan.length > 0 ? (
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left font-medium text-gray-600">NIK</th>
                                                <th className="px-4 py-2 text-left font-medium text-gray-600">Nama</th>
                                                <th className="px-4 py-2 text-left font-medium text-gray-600">Kader</th>
                                                <th className="px-4 py-2 text-left font-medium text-gray-600">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {selectedSK.daftar_relawan.map(r => (
                                                <tr key={r.penugasan_id}>
                                                    <td className="px-4 py-2 text-gray-700">{r.nik}</td>
                                                    <td className="px-4 py-2 text-gray-700">{r.nama_lengkap}</td>
                                                    <td className="px-4 py-2 text-gray-500">{r.nama_kader || '-'}</td>
                                                    <td className="px-4 py-2">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.status_keaktifan === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                                            {r.status_keaktifan}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic">Belum ada relawan yang ditugaskan pada SK ini</p>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Upload PDF Modal */}
            <UploadPDFModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onConfirm={handlePDFUploadConfirm}
                title="Upload Surat Keputusan (PDF)"
            />

            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default SuratKeputusan;

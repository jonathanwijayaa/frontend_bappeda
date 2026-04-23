//SuratKeputusan.tsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { FileDown, Upload, Loader2, Eye, Trash2, AlertCircle, ExternalLink } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { SearchInput } from '../components/ui/Input';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import UploadPDFModal from '../components/ui/UploadPDFModal';
import Toast, { ToastType } from '../components/ui/Toast';
import Pagination from '../components/ui/Pagination';
import { exportToPDF } from '../utils/exportToPDF';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { SKData, SKDetail, ErrorHint } from '../types';


const SuratKeputusan: React.FC = () => {
    const { isSuperAdmin, isOPD, user } = useAuth();
    const [skList, setSkList] = useState<SKData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
    const [selectedSK, setSelectedSK] = useState<SKDetail | null>(null);
    const [pdfBase64, setPdfBase64] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const [errorHint, setErrorHint] = useState<ErrorHint | null>(null);
    const itemsPerPage = 5;

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

    const filteredData = useMemo(() =>
        skList.filter(sk =>
            sk.nomor_sk.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (sk.judul_sk || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            sk.nama_opd.toLowerCase().includes(searchTerm.toLowerCase())
        ), [skList, searchTerm]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

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

    const handlePreviewPDF = async (sk: SKData) => {
        try {
            const res = await apiFetch(`/admin/sk/${sk.sk_id}/pdf`);
            const result = await res.json();
            if (result.success) {
                setPdfBase64(result.data.file_path);
                setIsPreviewModalOpen(true);
            } else {
                setToast({ message: 'Gagal memuat PDF', type: 'error' });
            }
        } catch {
            setToast({ message: 'Tidak dapat terhubung ke server', type: 'error' });
        }
    };

    const handlePDFUploadConfirm = async (file: File, metadata: any) => {
        setErrorHint(null);

        // Validasi ukuran file (2MB)
        if (file.size > 2 * 1024 * 1024) {
            setToast({ message: 'Ukuran file terlalu besar. Maksimal 2MB.', type: 'error' });
            return;
        }

        // Validasi tipe file
        if (file.type !== 'application/pdf') {
            setToast({ message: 'Hanya file PDF yang diperbolehkan.', type: 'error' });
            return;
        }

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('nomor_sk', metadata.nomorSK);
            formData.append('judul_sk', metadata.judulSK);
            formData.append('tanggal_terbit', metadata.tanggalTerbit);
            formData.append('batas_aktif', metadata.batasAktif || '');
            formData.append('opd_id', metadata.opd_id || '1');

            // Jika ada daftar relawan dari Excel/JSON
            if (metadata.daftar_relawan) {
                formData.append('daftar_relawan', JSON.stringify(metadata.daftar_relawan));
            }

            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/sk`, {
                method: 'POST',
                headers: { 
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });
            const result = await res.json();
            
            if (result.success) {
                setToast({ 
                    message: `SK berhasil diunggah! ${result.data.total_relawan_ditugaskan || 0} relawan ditugaskan.`, 
                    type: 'success' 
                });
                setIsUploadModalOpen(false);
                fetchSK();
            } else {
                setToast({ message: result.message || 'Gagal mengunggah SK', type: 'error' });
                
                // Tampilkan hint jika ada
                if (result.hint) {
                    setErrorHint(result.hint);
                }
                
                // Jika ada detail relawan yang gagal
                if (result.data?.relawan_gagal) {
                    console.error('Relawan yang gagal:', result.data.relawan_gagal);
                }
            }
        } catch {
            setToast({ message: 'Tidak dapat terhubung ke server', type: 'error' });
        }
    };

    const handleDeleteSK = async (sk_id: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus SK ini?')) return;

        try {
            const res = await apiFetch(`/admin/sk/${sk_id}`, {
                method: 'DELETE'
            });
            const result = await res.json();
            if (result.success) {
                setToast({ message: 'SK berhasil dihapus', type: 'success' });
                fetchSK();
                setIsDetailModalOpen(false);
            } else {
                setToast({ message: result.message || 'Gagal menghapus SK', type: 'error' });
                if (result.hint) {
                    setErrorHint(result.hint);
                }
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

    const actions = (row: SKData) => (
        <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => handleDetailClick(row)}>Detail</Button>
            {row.has_file && (
                <Button variant="outline" size="sm" onClick={() => handlePreviewPDF(row)}>
                    <Eye size={14} />
                </Button>
            )}
            {isSuperAdmin && (
                <Button variant="secondary" size="sm" onClick={() => handleDeleteSK(row.sk_id)}>
                    <Trash2 size={14} />
                </Button>
            )}
        </div>
    );

    return (
        <div className="space-y-6">
            {/* INFO BOX - Panduan Upload SK */}
            <Card className="bg-blue-50 border-blue-200">
                <div className="flex items-start gap-3">
                    <div className="text-blue-600 mt-0.5">
                        <AlertCircle size={20} />
                    </div>
                    <div className="text-sm text-blue-800 flex-1">
                        <p className="font-semibold mb-2"> Panduan Upload Surat Keputusan:</p>
                        <ol className="list-decimal list-inside space-y-1 text-blue-700">
                            <li>Pastikan <strong>OPD</strong> sudah terdaftar → <a href="/manajemen-opd" className="underline font-medium hover:text-blue-900">Manajemen OPD</a></li>
                            <li>Pastikan <strong>Kader</strong> sudah terdaftar → <a href="/daftar-kader" className="underline font-medium hover:text-blue-900">Daftar Kader</a></li>
                            <li>Pastikan <strong>Relawan</strong> sudah terdaftar → <a href="/data-relawan" className="underline font-medium hover:text-blue-900">Data Relawan</a></li>
                            <li>Upload file PDF SK (maksimal 2MB)</li>
                            <li>Relawan dapat ditugaskan di <strong>berbagai SK</strong> dengan <strong>kader berbeda</strong> dalam OPD yang sama</li>
                        </ol>
                    </div>
                </div>
            </Card>

            {/* ERROR HINT BOX - Muncul jika ada error */}
            {errorHint && (
                <Card className="bg-red-50 border-red-200">
                    <div className="flex items-start gap-3">
                        <div className="text-red-600 mt-0.5">
                            <AlertCircle size={20} />
                        </div>
                        <div className="text-sm text-red-800 flex-1">
                            <p className="font-semibold mb-2">️ {errorHint.title}</p>
                            <ol className="list-decimal list-inside space-y-1 text-red-700">
                                {errorHint.steps.map((step, idx) => (
                                    <li key={idx}>{step}</li>
                                ))}
                            </ol>
                            {errorHint.link && (
                                <a 
                                    href={errorHint.link} 
                                    className="inline-flex items-center gap-1 mt-2 text-red-600 font-medium hover:text-red-800 underline"
                                >
                                    {errorHint.link_text} <ExternalLink size={12} />
                                </a>
                            )}
                            <button 
                                onClick={() => setErrorHint(null)}
                                className="ml-4 text-red-500 hover:text-red-700"
                            >
                                ✕ Tutup
                            </button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex gap-3">
                    {(isSuperAdmin || isOPD) && (
                        <Button variant="primary" onClick={() => setIsUploadModalOpen(true)}>
                            <Upload size={18} />
                            Upload SK (PDF)
                        </Button>
                    )}
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
                ) : filteredData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <p className="text-gray-600 font-medium">Belum ada Surat Keputusan</p>
                        <p className="text-sm text-gray-400 mt-1">
                            {searchTerm
                                ? 'Tidak ada SK yang cocok dengan pencarian Anda.'
                                : 'Belum ada SK yang diunggah. Klik "Upload SK (PDF)" untuk mulai menambahkan.'}
                        </p>
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
                        <Pagination 
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={(page) => setCurrentPage(page)}
                        />
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

                            {selectedSK.has_file && (
                                <div className="grid grid-cols-3 gap-4 items-center border-b border-gray-100 pb-2">
                                    <span className="text-sm font-medium text-gray-600">File SK</span>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => handlePreviewPDF(selectedSK)}
                                        className="col-span-2 flex items-center gap-2 justify-start"
                                    >
                                        <Eye size={14} />
                                        Lihat Dokumen PDF
                                    </Button>
                                </div>
                            )}
                        </div>

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
                                                <th className="px-4 py-2 text-left font-medium text-gray-600">Jabatan</th>
                                                <th className="px-4 py-2 text-left font-medium text-gray-600">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {selectedSK.daftar_relawan.map(r => (
                                                <tr key={r.penugasan_id}>
                                                    <td className="px-4 py-2 text-gray-700">{r.nik}</td>
                                                    <td className="px-4 py-2 text-gray-700">{r.nama_lengkap}</td>
                                                    <td className="px-4 py-2 text-gray-500">{r.nama_kader || '-'}</td>
                                                    <td className="px-4 py-2 text-gray-500">{r.jabatan || '-'}</td>
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

                        {isSuperAdmin && (
                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>Tutup</Button>
                                <Button variant="secondary" onClick={() => handleDeleteSK(selectedSK.sk_id)}>
                                    <Trash2 size={14} className="mr-2" />
                                    Hapus SK
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* PDF Preview Modal */}
            <Modal isOpen={isPreviewModalOpen} onClose={() => setIsPreviewModalOpen(false)} title="Preview Surat Keputusan" maxWidth="4xl">
                {pdfBase64 ? (
                    <div className="space-y-4">
                        <iframe
                            src={pdfBase64}
                            className="w-full h-[600px] border rounded-lg"
                            title="PDF Preview"
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsPreviewModalOpen(false)}>Tutup</Button>
                            <a
                                href={pdfBase64}
                                download={`SK-${selectedSK?.nomor_sk || 'document'}.pdf`}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                <FileDown size={16} className="mr-2" />
                                Download PDF
                            </a>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-60">
                        <Loader2 size={24} className="animate-spin text-gray-400" />
                        <span className="ml-3 text-gray-500">Memuat PDF...</span>
                    </div>
                )}
            </Modal>

            {/* Upload PDF Modal */}
            <UploadPDFModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onConfirm={handlePDFUploadConfirm}
                title="Upload Surat Keputusan (PDF)"
                isOPD={isOPD} 
                //  FIXED: Tambahkan "as any" agar TypeScript tidak komplain
                userOpdData={{ 
                    id: (user as any)?.opd_id, 
                    name: (user as any)?.nama_opd 
                }} 
            />

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default SuratKeputusan;
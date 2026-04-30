//SuratKeputusan.tsx
import React, { useState, useMemo } from 'react';
import { FileDown, Upload, Loader2, Eye, AlertCircle, ExternalLink } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { SearchInput } from '../components/ui/Input';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import UploadPDFModal from '../components/ui/UploadPDFModal';
import Toast, { ToastType } from '../components/ui/Toast';
import Pagination from '../components/ui/Pagination';
import { exportToPDF } from '../utils/exportToPDF';
import { parseErrorMessage } from '../utils/parseErrorMessage';
import { useAuth } from '../context/AuthContext';
import { SKData, SKDetail, ErrorHint } from '../types';
import { useSkList, useSkDetail, useSkPdf } from '../hooks/sk/useSkList';
import { useCreateSk, useToggleSkStatus } from '../hooks/sk/useSkMutations';

const SuratKeputusan: React.FC = () => {
    const { isSuperAdmin, isOPD, user } = useAuth();

    // ── Server State ──────────────────────────────────────────
    const { data: skList = [], isLoading } = useSkList();
    const createSk      = useCreateSk();
    const toggleSkStatus = useToggleSkStatus();

    // ── UI State ──────────────────────────────────────────────
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
    const [selectedSkId, setSelectedSkId] = useState<number>(0);
    const [previewSkId, setPreviewSkId] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const [errorHint, setErrorHint] = useState<ErrorHint | null>(null);
    const [isConfirmSkOpen, setIsConfirmSkOpen] = useState<boolean>(false);
    const [selectedSkForToggle, setSelectedSkForToggle] = useState<SKData | null>(null);
    const itemsPerPage = 5;

    // ── Lazy query — hanya aktif saat modal detail terbuka ────
    const { data: selectedSK, isLoading: isLoadingDetail } = useSkDetail(selectedSkId);
    const { data: pdfBase64 } = useSkPdf(previewSkId);

    // ── Filter & Pagination ────────────────────────────────────
    const filteredData = useMemo(() =>
        skList.filter(sk =>
            sk.nomor_sk.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (sk.judul_sk || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            sk.nama_opd.toLowerCase().includes(searchTerm.toLowerCase())
        ), [skList, searchTerm]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    // ── Handlers ──────────────────────────────────────────────
    const handleDetailClick = (sk: SKData) => {
        setSelectedSkId(sk.sk_id);
        setIsDetailModalOpen(true);
    };

    const handlePreviewPDF = (sk: SKData | SKDetail) => {
        setPreviewSkId(sk.sk_id);
        setIsPreviewModalOpen(true);
    };

    const handlePDFUploadConfirm = async (file: File, metadata: any) => {
        setErrorHint(null);

        if (file.size > 2 * 1024 * 1024) {
            setToast({ message: 'Ukuran file terlalu besar. Maksimal 2MB.', type: 'error' });
            return;
        }
        if (file.type !== 'application/pdf') {
            setToast({ message: 'Hanya file PDF yang diperbolehkan.', type: 'error' });
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('nomor_sk', metadata.nomorSK);
        formData.append('judul_sk', metadata.judulSK);
        formData.append('tanggal_terbit', metadata.tanggalTerbit);
        formData.append('batas_aktif', metadata.batasAktif || '');
        formData.append('opd_id', metadata.opd_id || '1');
        // Kirim kader_ids (bisa 'ALL' atau array angka)
        if (metadata.kader_ids) {
            formData.append('kader_ids',
                metadata.kader_ids === 'ALL'
                    ? 'ALL'
                    : JSON.stringify(metadata.kader_ids)
            );
        }


        createSk.mutate(formData, {
            onSuccess: (d) => {
                setToast({
                    message: 'SK berhasil diunggah! ' + (d.data?.total_kader_terkait || 0) + ' kader & ' + (d.data?.total_relawan_terkait || 0) + ' relawan ditautkan.',
                    type: 'success',
                });
                setIsUploadModalOpen(false);
            },
            onError: (e: any) => {
                setToast({ message: parseErrorMessage(e, 'Gagal mengunggah SK'), type: 'error' });
                if (e.response?.data?.hint) setErrorHint(e.response.data.hint);
            },
        });
    };

    const handleToggleSkStatus = (sk: SKData) => {
        setSelectedSkForToggle(sk);
        setIsConfirmSkOpen(true);
    };

    const handleConfirmToggleSk = () => {
        if (!selectedSkForToggle) return;
        const newActive = selectedSkForToggle.status === 'Aktif' ? false : true;
        toggleSkStatus.mutate(
            { sk_id: selectedSkForToggle.sk_id, is_active: newActive },
            {
                onSuccess: (d) => setToast({ message: d.message || 'Status SK berhasil diubah', type: 'success' }),
                onError:   (e: any) => setToast({ message: parseErrorMessage(e, 'Gagal mengubah status SK'), type: 'error' }),
                onSettled: () => {
                    setIsConfirmSkOpen(false);
                    setSelectedSkForToggle(null);
                    setIsDetailModalOpen(false);
                    setSelectedSkId(0);
                },
            }
        );
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
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${row.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {row.status}
                </span>
            )
        },
        {
            header: 'JUMLAH RELAWAN',
            render: (row: SKData) => <span className="font-medium">{row.jumlah_relawan}</span>
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
                <Button
                    variant={row.status === 'Aktif' ? 'danger' : 'secondary'}
                    size="sm"
                    onClick={() => handleToggleSkStatus(row)}
                >
                    {row.status === 'Aktif' ? 'Nonaktif' : 'Aktifkan'}
                </Button>
            )}
        </div>
    );

    return (
        <div className="space-y-6">
            {/* INFO BOX */}
            <Card className="bg-blue-50 border-blue-200">
                <div className="flex items-start gap-3">
                    <div className="text-blue-600 mt-0.5"><AlertCircle size={20} /></div>
                    <div className="text-sm text-blue-800 flex-1">
                        <p className="font-semibold mb-2">📋 Panduan Upload Surat Keputusan:</p>
                        <ol className="list-decimal list-inside space-y-1 text-blue-700">
                            <li>
                                {isSuperAdmin
                                    ? <>Pastikan <strong>OPD</strong> sudah terdaftar → <a href="/manajemen-opd" className="underline font-medium hover:text-blue-900">Manajemen OPD</a></>
                                    : <>Pastikan <strong>OPD</strong> Anda sudah terdaftar dari BAPPEDA</>
                                }
                            </li>
                            <li>Pastikan <strong>Kader</strong> sudah terdaftar → <a href="/daftar-kader" className="underline font-medium hover:text-blue-900">Daftar Kader</a></li>
                            <li>Pastikan <strong>Relawan</strong> sudah terdaftar → <a href="/data-relawan" className="underline font-medium hover:text-blue-900">Data Relawan</a></li>
                            <li>Upload file PDF SK (maksimal 2MB)</li>
                            <li>Relawan dapat ditugaskan di <strong>berbagai SK</strong> dalam OPD yang sama</li>
                        </ol>
                    </div>
                </div>
            </Card>

            {/* ERROR HINT BOX */}
            {errorHint && (
                <Card className="bg-red-50 border-red-200">
                    <div className="flex items-start gap-3">
                        <div className="text-red-600 mt-0.5"><AlertCircle size={20} /></div>
                        <div className="text-sm text-red-800 flex-1">
                            <p className="font-semibold mb-2">⚠️ {errorHint.title}</p>
                            <ol className="list-decimal list-inside space-y-1 text-red-700">
                                {errorHint.steps.map((step, idx) => <li key={idx}>{step}</li>)}
                            </ol>
                            {errorHint.link && (
                                <a href={errorHint.link} className="inline-flex items-center gap-1 mt-2 text-red-600 font-medium hover:text-red-800 underline">
                                    {errorHint.link_text} <ExternalLink size={12} />
                                </a>
                            )}
                            <button onClick={() => setErrorHint(null)} className="ml-4 text-red-500 hover:text-red-700">✕ Tutup</button>
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

                {!isLoading && filteredData.length > 0 && (
                    <div className="mt-4 flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                            Menampilkan {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredData.length)} dari {filteredData.length} SK
                        </div>
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                )}
            </Card>

            {/* Detail SK Modal */}
            <Modal isOpen={isDetailModalOpen} onClose={() => { setIsDetailModalOpen(false); setSelectedSkId(0); }} title="Detail Surat Keputusan" maxWidth="2xl">
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
                                    <Button variant="outline" size="sm" onClick={() => handlePreviewPDF(selectedSK)} className="col-span-2 flex items-center gap-2 justify-start">
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
                                                {['NIK', 'Nama', 'Kader', 'Jabatan', 'Status'].map(h => (
                                                    <th key={h} className="px-4 py-2 text-left font-medium text-gray-600">{h}</th>
                                                ))}
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

                        {isSuperAdmin && selectedSK && (
                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button variant="outline" onClick={() => { setIsDetailModalOpen(false); setSelectedSkId(0); }}>Tutup</Button>
                                <Button
                                    variant={selectedSK.status === 'Aktif' ? 'danger' : 'secondary'}
                                    onClick={() => handleToggleSkStatus(selectedSK)}
                                    disabled={toggleSkStatus.isPending}
                                >
                                    {toggleSkStatus.isPending
                                        ? <><Loader2 size={14} className="animate-spin mr-1" />Menyimpan...</>
                                        : selectedSK.status === 'Aktif' ? 'Nonaktifkan SK' : 'Aktifkan SK'
                                    }
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* PDF Preview Modal */}
            <Modal isOpen={isPreviewModalOpen} onClose={() => { setIsPreviewModalOpen(false); setPreviewSkId(0); }} title="Preview Surat Keputusan" maxWidth="4xl">
                {pdfBase64 ? (
                    <div className="space-y-4">
                        <iframe src={pdfBase64} className="w-full h-[600px] border rounded-lg" title="PDF Preview" />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => { setIsPreviewModalOpen(false); setPreviewSkId(0); }}>Tutup</Button>
                            <a
                                href={pdfBase64}
                                download={`SK-document.pdf`}
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
                userOpdData={{
                    id: (user as any)?.opd_id,
                    name: (user as any)?.nama_opd,
                }}
            />

            {/* Confirmation Modal — Toggle Status SK */}
            <Modal
                isOpen={isConfirmSkOpen}
                onClose={() => { setIsConfirmSkOpen(false); setSelectedSkForToggle(null); }}
                title="Konfirmasi"
                subtitle={selectedSkForToggle?.status === 'Aktif' ? 'Nonaktifkan SK ini?' : 'Aktifkan SK ini?'}
                maxWidth="md"
                showCloseButton={false}
            >
                {selectedSkForToggle && (
                    <div className="space-y-6">
                        <div className="text-center py-4">
                            <p className="text-lg text-gray-700">
                                Anda akan {selectedSkForToggle.status === 'Aktif' ? 'menonaktifkan' : 'mengaktifkan'}{' '}
                                <span className="font-semibold">{selectedSkForToggle.nomor_sk}</span>
                            </p>
                        </div>
                        <div className="flex justify-center gap-4 pt-6">
                            <Button
                                type="button"
                                onClick={() => { setIsConfirmSkOpen(false); setSelectedSkForToggle(null); }}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-8"
                            >
                                Batal
                            </Button>
                            <Button
                                type="button"
                                onClick={handleConfirmToggleSk}
                                disabled={toggleSkStatus.isPending}
                                className="bg-red-600 hover:bg-red-700 text-white px-8"
                            >
                                {toggleSkStatus.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Lanjutkan'}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default SuratKeputusan;
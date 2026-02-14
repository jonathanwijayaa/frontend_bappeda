import React, { useState, useMemo, useEffect } from 'react';
import { FileDown, Upload, ChevronLeft, ChevronRight, Loader2, ExternalLink } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { SearchInput } from '../components/ui/Input';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import UploadPDFModal from '../components/ui/UploadPDFModal';
import Toast, { ToastType } from '../components/ui/Toast';
import { SKData } from '../types/sk.types';
import { mockSKData } from '../data/sk.data';
import { mockRelawanData } from '../data/relawan.data';
import { exportToPDF } from '../utils/exportToPDF';

const SuratKeputusan: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
    const [selectedSK, setSelectedSK] = useState<SKData | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const [highlightedSKId, setHighlightedSKId] = useState<string | null>(null);
    const itemsPerPage = 5;

    // Pagination logic
    const filteredData = useMemo(() => {
        return mockSKData.filter(sk =>
            sk.nomorSK.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sk.judulSK.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sk.namaOPD.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentData = filteredData.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // Find which page contains a specific SK
    const findPageForSK = (skId: string): number => {
        const index = filteredData.findIndex(sk => sk.id === skId);
        if (index === -1) return 1;
        return Math.floor(index / itemsPerPage) + 1;
    };

    // Handle URL highlight parameter
    useEffect(() => {
        const highlightParam = searchParams.get('highlight');
        if (highlightParam) {
            setHighlightedSKId(highlightParam);
            const targetPage = findPageForSK(highlightParam);
            setCurrentPage(targetPage);

            // Scroll to highlighted row after render
            setTimeout(() => {
                const element = document.querySelector(`[data-sk-id="${highlightParam}"]`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);

            // Clear highlight after 3 seconds
            const timer = setTimeout(() => {
                setHighlightedSKId(null);
                setSearchParams({}, { replace: true });
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [searchParams, filteredData, itemsPerPage, setSearchParams]);

    const columns = [
        { header: 'NOMOR SK', accessor: 'nomorSK' as keyof SKData },
        { header: 'JUDUL SK', accessor: 'judulSK' as keyof SKData },
        { header: 'TANGGAL TERBIT', accessor: 'tanggalTerbit' as keyof SKData },
        { header: 'NAMA OPD', accessor: 'namaOPD' as keyof SKData },
        {
            header: 'NAMA KADER',
            render: (row: SKData) => (
                <span>{row.namaKader || '-'}</span>
            )
        },
        {
            header: 'JUMLAH RELAWAN',
            render: (row: SKData) => (
                <span>{row.jumlahRelawan} orang</span>
            )
        },
    ];

    const handleDetailClick = (sk: SKData) => {
        setSelectedSK(sk);
        setIsDetailModalOpen(true);
    };

    const handleViewDocument = (sk: SKData) => {
        // In a real app, this would open the PDF document
        console.log('Opening document:', sk.filePath);
        setToast({ message: `Membuka dokumen ${sk.nomorSK}`, type: 'success' });
    };

    const handlePDFUploadConfirm = (file: File, metadata: any) => {
        console.log('PDF file confirmed:', file);
        console.log('SK metadata:', metadata);
        // Here you would typically upload the file and save the metadata to your state/database
        // For now, just show a success message
        setToast({ message: `Berhasil menambahkan SK: ${metadata.judulSK}`, type: 'success' });
        setIsUploadModalOpen(false);
    };

    const actions = (row: SKData) => (
        <>
            <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDetailClick(row)}
                className="flex-1 whitespace-nowrap"
            >
                Lihat Detail
            </Button>
            <Button
                variant="secondary"
                size="sm"
                onClick={() => handleViewDocument(row)}
                className="flex-1 whitespace-nowrap"
            >
                <ExternalLink size={14} />
                Lihat SK
            </Button>
        </>
    );

    const handleExportPDF = async () => {
        try {
            setIsExporting(true);

            const exportData = filteredData.map(sk => ({
                nomorSK: sk.nomorSK,
                judulSK: sk.judulSK,
                tanggalTerbit: sk.tanggalTerbit,
                namaOPD: sk.namaOPD,
                jumlahRelawan: `${sk.jumlahRelawan} orang`,
                status: sk.status
            }));

            exportToPDF({
                title: 'Daftar Surat Keputusan',
                columns: [
                    { header: 'NOMOR SK', dataKey: 'nomorSK' },
                    { header: 'JUDUL SK', dataKey: 'judulSK' },
                    { header: 'TANGGAL TERBIT', dataKey: 'tanggalTerbit' },
                    { header: 'NAMA OPD', dataKey: 'namaOPD' },
                    { header: 'JUMLAH RELAWAN', dataKey: 'jumlahRelawan' },
                    { header: 'STATUS', dataKey: 'status' }
                ],
                data: exportData,
                filename: `daftar-sk-${new Date().toISOString().split('T')[0]}.pdf`
            });

            setToast({ message: 'Data berhasil diekspor ke PDF', type: 'success' });
        } catch (error) {
            console.error('Export error:', error);
            setToast({ message: 'Gagal mengekspor data ke PDF', type: 'error' });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex justify-between items-center">
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setIsUploadModalOpen(true)}>
                        <Upload size={18} />
                        Unggah File SK
                    </Button>
                </div>
                <SearchInput
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-80"
                />
            </div>

            {/* Table */}
            <Card>
                <div className="mb-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">Daftar Surat Keputusan</h2>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleExportPDF}
                        disabled={isExporting}
                    >
                        {isExporting ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <FileDown size={16} />
                        )}
                        {isExporting ? 'Mengekspor...' : 'Ekspor'}
                    </Button>
                </div>

                <Table
                    columns={columns}
                    data={currentData}
                    actions={actions}
                    minRows={5}
                    highlightedRowId={highlightedSKId}
                    rowIdAccessor="id"
                />

                {/* Pagination */}
                <div className="mt-4 flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                        Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredData.length)} dari {filteredData.length} Surat Keputusan
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
            </Card>

            {/* Detail Modal */}
            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title="Detail Surat Keputusan"
                subtitle="Halaman untuk melihat detail Surat Keputusan"
                maxWidth="2xl"
            >
                {selectedSK && (
                    <div className="space-y-6">
                        {/* Nomor SK */}
                        <div className="grid grid-cols-3 gap-4 items-center">
                            <label className="text-lg font-medium text-gray-900">Nomor SK</label>
                            <input
                                type="text"
                                value={selectedSK.nomorSK}
                                className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 italic"
                                disabled
                            />
                        </div>

                        {/* Judul SK */}
                        <div className="grid grid-cols-3 gap-4 items-center">
                            <label className="text-lg font-medium text-gray-900">Judul SK</label>
                            <input
                                type="text"
                                value={selectedSK.judulSK}
                                className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 italic"
                                disabled
                            />
                        </div>

                        {/* Tanggal Terbit */}
                        <div className="grid grid-cols-3 gap-4 items-center">
                            <label className="text-lg font-medium text-gray-900">Tanggal Terbit</label>
                            <input
                                type="text"
                                value={selectedSK.tanggalTerbit}
                                className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 italic"
                                disabled
                            />
                        </div>

                        {/* Batas Aktif */}
                        <div className="grid grid-cols-3 gap-4 items-center">
                            <label className="text-lg font-medium text-gray-900">Batas Aktif</label>
                            <input
                                type="text"
                                value={selectedSK.batasAktif}
                                className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 italic"
                                disabled
                            />
                        </div>

                        {/* Nama OPD */}
                        <div className="grid grid-cols-3 gap-4 items-center">
                            <label className="text-lg font-medium text-gray-900">Nama OPD</label>
                            <input
                                type="text"
                                value={selectedSK.namaOPD}
                                className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 italic"
                                disabled
                            />
                        </div>

                        {/* Nama Kader (if applicable) */}
                        {selectedSK.namaKader && (
                            <div className="grid grid-cols-3 gap-4 items-center">
                                <label className="text-lg font-medium text-gray-900">Nama Kader</label>
                                <input
                                    type="text"
                                    value={selectedSK.namaKader}
                                    className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 italic"
                                    disabled
                                />
                            </div>
                        )}

                        {/* Jumlah Relawan */}
                        <div className="grid grid-cols-3 gap-4 items-center">
                            <label className="text-lg font-medium text-gray-900">Jumlah Relawan</label>
                            <input
                                type="text"
                                value={`${selectedSK.jumlahRelawan} orang`}
                                className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 italic"
                                disabled
                            />
                        </div>

                        {/* Daftar Relawan */}
                        <div className="grid grid-cols-3 gap-4 items-start">
                            <label className="text-lg font-medium text-gray-900">Daftar Relawan</label>
                            <div className="col-span-2">
                                {(() => {
                                    const relawanList = mockRelawanData.filter(relawan =>
                                        relawan.assignments?.some(assignment => assignment.skId === selectedSK.id)
                                    );

                                    if (relawanList.length === 0) {
                                        return <p className="text-sm text-gray-500 italic">Tidak ada relawan terdaftar</p>;
                                    }

                                    return (
                                        <div className="border border-gray-300 rounded-lg overflow-hidden">
                                            <table className="w-full">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">NIK</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nama Relawan</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {relawanList.map((relawan, index) => (
                                                        <tr key={index} className="hover:bg-gray-50">
                                                            <td className="px-4 py-2 text-sm text-gray-900">{relawan.nik}</td>
                                                            <td className="px-4 py-2 text-sm text-gray-900">{relawan.namaLengkap}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Action Buttons
                        <div className="flex justify-between pt-6">
                            <Button
                                type="button"
                                onClick={() => setIsDetailModalOpen(false)}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-8"
                            >
                                Tutup
                            </Button>
                            <Button
                                type="button"
                                onClick={() => selectedSK && handleViewDocument(selectedSK)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                            >
                                <ExternalLink size={16} className="mr-2" />
                                Lihat Dokumen
                            </Button>
                        </div> */}
                    </div>
                )}
            </Modal>

            {/* Upload PDF Modal */}
            <UploadPDFModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onConfirm={handlePDFUploadConfirm}
                title="Unggah File Surat Keputusan (PDF)"
            />

            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default SuratKeputusan;


import React, { useState, useMemo } from 'react';
import { Plus, FileDown, Upload, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { SearchInput } from '../components/ui/Input';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import UploadExcelModal from '../components/ui/UploadExcelModal';
import Toast, { ToastType } from '../components/ui/Toast';
import { OPDData } from '../types/opd.types';
import { mockOPDData } from '../data/opd.data';
import { mockSKData } from '../data/sk.data';
import { exportToPDF } from '../utils/exportToPDF';

const ManajemenOPD: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
    const [selectedOPD, setSelectedOPD] = useState<OPDData | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const itemsPerPage = 5;

    const [formData, setFormData] = useState({
        namaOpd: '',
        status: '',
        alamat: '',
        pic: '',
        kontak: ''
    });

    const [detailFormData, setDetailFormData] = useState({
        namaOpd: '',
        status: '',
        alamat: '',
        pic: '',
        kontak: ''
    });

    const hasChanges = useMemo(() => {
        if (!selectedOPD) return false;
        return (
            detailFormData.namaOpd !== selectedOPD.namaOpd ||
            detailFormData.status !== selectedOPD.status ||
            detailFormData.alamat !== selectedOPD.alamat ||
            detailFormData.pic !== selectedOPD.pic ||
            detailFormData.kontak !== selectedOPD.kontak
        );
    }, [selectedOPD, detailFormData]);

    // Pagination logic
    const filteredData = useMemo(() => {
        return mockOPDData.filter(opd =>
            opd.namaOpd.toLowerCase().includes(searchTerm.toLowerCase()) ||
            opd.kode.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentData = filteredData.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const columns = [
        { header: 'NAMA OPD', accessor: 'namaOpd' as keyof OPDData },
        { header: 'KODE', accessor: 'kode' as keyof OPDData },
        { header: 'STATUS', accessor: 'status' as keyof OPDData },
        { header: 'ALAMAT', accessor: 'alamat' as keyof OPDData },
        { header: 'PIC', accessor: 'pic' as keyof OPDData },
        { header: 'Kontak', accessor: 'kontak' as keyof OPDData },
    ];

    const handleDetailClick = (opd: OPDData) => {
        setSelectedOPD(opd);
        setDetailFormData({
            namaOpd: opd.namaOpd,
            status: opd.status,
            alamat: opd.alamat,
            pic: opd.pic,
            kontak: opd.kontak
        });
        setIsDetailModalOpen(true);
    };

    const handleToggleStatus = (opd: OPDData) => {
        setSelectedOPD(opd);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmToggleStatus = () => {
        console.log('Toggling status for OPD:', selectedOPD);
        // Handle status toggle logic
        setIsConfirmModalOpen(false);
        setSelectedOPD(null);
    };

    const actions = (row: OPDData) => (
        <>
            <Button variant="secondary" size="sm" onClick={() => handleDetailClick(row)}>Detail</Button>
            <Button
                variant="secondary"
                size="sm"
                onClick={() => handleToggleStatus(row)}
            >
                {row.status === 'Aktif' ? 'Nonaktif' : 'Aktifkan'}
            </Button>
        </>
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDetailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setDetailFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDetailSave = () => {
        console.log('Saving detail changes:', detailFormData);
        setIsDetailModalOpen(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form data:', formData);
        setIsModalOpen(false);
        setFormData({
            namaOpd: '',
            status: '',
            alamat: '',
            pic: '',
            kontak: ''
        });
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        setFormData({
            namaOpd: '',
            status: '',
            alamat: '',
            pic: '',
            kontak: ''
        });
    };

    const handleExportPDF = async () => {
        try {
            setIsExporting(true);

            // Prepare data for export
            const exportData = filteredData.map(opd => ({
                namaOpd: opd.namaOpd,
                kode: opd.kode,
                status: opd.status,
                alamat: opd.alamat,
                pic: opd.pic,
                kontak: opd.kontak
            }));

            // Export to PDF
            exportToPDF({
                title: 'Daftar OPD',
                columns: [
                    { header: 'NAMA OPD', dataKey: 'namaOpd' },
                    { header: 'KODE', dataKey: 'kode' },
                    { header: 'STATUS', dataKey: 'status' },
                    { header: 'ALAMAT', dataKey: 'alamat' },
                    { header: 'PIC', dataKey: 'pic' },
                    { header: 'KONTAK', dataKey: 'kontak' }
                ],
                data: exportData,
                filename: `daftar-opd-${new Date().toISOString().split('T')[0]}.pdf`
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
                    <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                        <Plus size={18} />
                        Ajukan OPD Baru
                    </Button>
                    <Button variant="outline" onClick={() => setIsUploadModalOpen(true)}>
                        <Upload size={18} />
                        Unggah dari Excel
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
                    <h2 className="text-xl font-semibold text-gray-900">Daftar OPD</h2>
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

                <Table columns={columns} data={currentData} actions={actions} minRows={5} />

                {/* Pagination */}
                <div className="mt-4 flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                        Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredData.length)} dari {filteredData.length} OPD
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

            {/* Add OPD Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCancel}
                title="Tambah Data"
                subtitle="Halaman untuk menambah OPD"
                maxWidth="2xl"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Nama OPD */}
                    <div className="grid grid-cols-3 gap-4 items-center">
                        <label className="text-lg font-medium text-gray-900">Nama OPD</label>
                        <input
                            type="text"
                            name="namaOpd"
                            value={formData.namaOpd}
                            onChange={handleInputChange}
                            placeholder="Nama OPD"
                            className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* Status */}
                    <div className="grid grid-cols-3 gap-4 items-center">
                        <label className="text-lg font-medium text-gray-900">Status</label>
                        <input
                            type="text"
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            placeholder="Status"
                            className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* Alamat */}
                    <div className="grid grid-cols-3 gap-4 items-center">
                        <label className="text-lg font-medium text-gray-900">Alamat</label>
                        <input
                            type="text"
                            name="alamat"
                            value={formData.alamat}
                            onChange={handleInputChange}
                            placeholder="Alamat"
                            className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* PIC */}
                    <div className="grid grid-cols-3 gap-4 items-center">
                        <label className="text-lg font-medium text-gray-900">PIC</label>
                        <input
                            type="text"
                            name="pic"
                            value={formData.pic}
                            onChange={handleInputChange}
                            placeholder="PIC"
                            className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* Kontak */}
                    <div className="grid grid-cols-3 gap-4 items-center">
                        <label className="text-lg font-medium text-gray-900">Kontak</label>
                        <input
                            type="text"
                            name="kontak"
                            value={formData.kontak}
                            onChange={handleInputChange}
                            placeholder="Kontak"
                            className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between pt-6">
                        <Button
                            type="button"
                            onClick={handleCancel}
                            className="bg-red-600 hover:bg-red-700 text-white px-8"
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            className="bg-green-600 hover:bg-green-700 text-white px-8"
                        >
                            Simpan
                        </Button>
                    </div>

                    {/* Footer Info */}
                    <div className="pt-4 border-t border-gray-200 space-y-1">
                        <div className="flex gap-2 text-sm">
                            <span className="font-medium">Tanggal Dibuat</span>
                            <span>-</span>
                        </div>
                        <div className="flex gap-2 text-sm italic text-gray-500">
                            <span>Terakhir di-update</span>
                            <span>-</span>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Detail Modal */}
            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title="Detail"
                subtitle="Halaman untuk melihat detail OPD"
                maxWidth="2xl"
            >
                {selectedOPD && (
                    <div className="space-y-6">
                        {/* Nama OPD */}
                        <div className="grid grid-cols-3 gap-4 items-center">
                            <label className="text-lg font-medium text-gray-900">Nama OPD</label>
                            <input
                                type="text"
                                name="namaOpd"
                                value={detailFormData.namaOpd}
                                onChange={handleDetailInputChange}
                                placeholder="Nama OPD"
                                className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Status */}
                        <div className="grid grid-cols-3 gap-4 items-center">
                            <label className="text-lg font-medium text-gray-900">Status</label>
                            <input
                                type="text"
                                name="status"
                                value={detailFormData.status}
                                onChange={handleDetailInputChange}
                                placeholder="Status"
                                className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Alamat */}
                        <div className="grid grid-cols-3 gap-4 items-center">
                            <label className="text-lg font-medium text-gray-900">Alamat</label>
                            <input
                                type="text"
                                name="alamat"
                                value={detailFormData.alamat}
                                onChange={handleDetailInputChange}
                                placeholder="Alamat"
                                className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* PIC */}
                        <div className="grid grid-cols-3 gap-4 items-center">
                            <label className="text-lg font-medium text-gray-900">PIC</label>
                            <input
                                type="text"
                                name="pic"
                                value={detailFormData.pic}
                                onChange={handleDetailInputChange}
                                placeholder="PIC"
                                className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Kontak */}
                        <div className="grid grid-cols-3 gap-4 items-center">
                            <label className="text-lg font-medium text-gray-900">Kontak</label>
                            <input
                                type="text"
                                name="kontak"
                                value={detailFormData.kontak}
                                onChange={handleDetailInputChange}
                                placeholder="Kontak"
                                className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Daftar SK Terkait */}
                        <div className="grid grid-cols-3 gap-4 items-start">
                            <label className="text-lg font-medium text-gray-900">Daftar SK Terkait</label>
                            <div className="col-span-2">
                                {(() => {
                                    const relatedSKs = mockSKData.filter(sk => sk.opdId === selectedOPD.id);
                                    if (relatedSKs.length === 0) {
                                        return <p className="text-sm text-gray-500 italic">Tidak ada SK terkait</p>;
                                    }
                                    return (
                                        <ul className="space-y-2">
                                            {relatedSKs.map(sk => (
                                                <li key={sk.id}>
                                                    <Link
                                                        to={`/surat-keputusan?highlight=${sk.id}`}
                                                        className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
                                                    >
                                                        {sk.nomorSK}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Action Button */}
                        <div className="flex justify-end pt-6">
                            <Button
                                type="button"
                                onClick={handleDetailSave}
                                disabled={!hasChanges}
                                className="bg-green-600 hover:bg-green-700 text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Simpan
                            </Button>
                        </div>

                        {/* Footer Info */}
                        <div className="pt-4 border-t border-gray-200 space-y-1">
                            <div className="flex gap-2 text-sm">
                                <span className="font-medium">Tanggal Dibuat</span>
                                <span>Senin, 01-01-2021 07:07:07</span>
                            </div>
                            <div className="flex gap-2 text-sm italic text-gray-500">
                                <span>Terakhir di-update</span>
                                <span>Senin, 23-11-2025 13:13:13</span>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Confirmation Modal */}
            <Modal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                title="Konfirmasi"
                subtitle={selectedOPD?.status === 'Aktif'
                    ? "Apakah Anda yakin ingin menonaktifkan OPD ini?"
                    : "Apakah Anda yakin ingin mengaktifkan OPD ini?"}
                maxWidth="md"
                showCloseButton={false}
            >
                {selectedOPD && (
                    <div className="space-y-6">
                        <div className="text-center py-4">
                            <p className="text-lg text-gray-700">
                                Anda akan {selectedOPD.status === 'Aktif' ? 'menonaktifkan' : 'mengaktifkan'} <span className="font-semibold">{selectedOPD.namaOpd}</span>
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-center gap-4 pt-6">
                            <Button
                                type="button"
                                onClick={() => setIsConfirmModalOpen(false)}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-8"
                            >
                                Batal
                            </Button>
                            <Button
                                type="button"
                                onClick={handleConfirmToggleStatus}
                                className="bg-red-600 hover:bg-red-700 text-white px-8"
                            >
                                Lanjutkan
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Upload Excel Modal */}
            <UploadExcelModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                title="Unggah Data OPD"
                templateName="Data OPD"
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

export default ManajemenOPD;

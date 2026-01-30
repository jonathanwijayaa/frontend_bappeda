import React, { useState, useMemo } from 'react';
import { Plus, FileDown, Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { SearchInput } from '../components/ui/Input';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import { OPDData } from '../types/opd.types';
import { mockOPDData } from '../data/opd.data';

const ManajemenOPD: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
    const [selectedOPD, setSelectedOPD] = useState<OPDData | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 5;

    const [formData, setFormData] = useState({
        namaOpd: '',
        status: '',
        alamat: '',
        pic: '',
        kontak: ''
    });

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
        setIsDetailModalOpen(true);
    };

    const handleToggleStatus = (opd: OPDData) => {
        setSelectedOPD(opd);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmToggleStatus = () => {
        console.log('Toggling status for OPD:', selectedOPD);
        // Handle status toggle logic here
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

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex justify-between items-center">
                <div className="flex gap-3">
                    <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                        <Plus size={18} />
                        Ajukan OPD Baru
                    </Button>
                    <Button variant="outline">
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
                    <Button variant="secondary" size="sm">
                        <FileDown size={16} />
                        Export
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
                            Previous
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
                            Next
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
                                value={selectedOPD.namaOpd}
                                placeholder="Nama OPD"
                                className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 italic"
                                disabled
                            />
                        </div>

                        {/* Status */}
                        <div className="grid grid-cols-3 gap-4 items-center">
                            <label className="text-lg font-medium text-gray-900">Status</label>
                            <input
                                type="text"
                                value={selectedOPD.status}
                                placeholder="Status"
                                className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 italic"
                                disabled
                            />
                        </div>

                        {/* Alamat */}
                        <div className="grid grid-cols-3 gap-4 items-center">
                            <label className="text-lg font-medium text-gray-900">Alamat</label>
                            <input
                                type="text"
                                value={selectedOPD.alamat}
                                placeholder="Alamat"
                                className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 italic"
                                disabled
                            />
                        </div>

                        {/* PIC */}
                        <div className="grid grid-cols-3 gap-4 items-center">
                            <label className="text-lg font-medium text-gray-900">PIC</label>
                            <input
                                type="text"
                                value={selectedOPD.pic}
                                placeholder="PIC"
                                className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 italic"
                                disabled
                            />
                        </div>

                        {/* Kontak */}
                        <div className="grid grid-cols-3 gap-4 items-center">
                            <label className="text-lg font-medium text-gray-900">Kontak</label>
                            <input
                                type="text"
                                value={selectedOPD.kontak}
                                placeholder="Kontak"
                                className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 italic"
                                disabled
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-between pt-6">
                            <Button
                                type="button"
                                onClick={() => setIsDetailModalOpen(false)}
                                className="bg-red-600 hover:bg-red-700 text-white px-8"
                            >
                                Batal
                            </Button>
                            <Button
                                type="button"
                                className="bg-green-600 hover:bg-green-700 text-white px-8"
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
        </div>
    );
};

export default ManajemenOPD;

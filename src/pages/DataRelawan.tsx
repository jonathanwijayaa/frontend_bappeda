import React, { useState, useMemo } from 'react';
import { Plus, Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { SearchInput } from '../components/ui/Input';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import Select from '../components/ui/Select';
import UploadExcelModal from '../components/ui/UploadExcelModal';
import { PengajuanData, RelawanData } from '../types/relawan.types';
import { mockPengajuanData, mockRelawanData } from '../data/relawan.data';

const DataRelawan: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
    const [selectedRelawan, setSelectedRelawan] = useState<RelawanData | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 5;

    const [formData, setFormData] = useState({
        namaRelawan: '',
        nik: '',
        jenisKelamin: 'Laki-Laki',
        alamat: '',
        noHp: '',
        opd: '',
        komunitas: '',
        peran: '',
        statusKeaktifan: 'Aktif'
    });

    const pengajuanData: PengajuanData[] = mockPengajuanData;

    // Pagination logic for relawan data
    const filteredRelawanData = useMemo(() => {
        return mockRelawanData.filter(relawan =>
            relawan.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
            relawan.nik.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    const totalPages = Math.ceil(filteredRelawanData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentRelawanData = filteredRelawanData.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const pengajuanColumns = [
        { header: 'NIK', accessor: 'nik' as keyof PengajuanData },
        { header: 'NAMA LENGKAP', accessor: 'namaLengkap' as keyof PengajuanData },
        { header: 'TANGGAL PENGAJUAN', accessor: 'tanggalPengajuan' as keyof PengajuanData },
        {
            header: 'STATUS',
            render: (row: PengajuanData) => (
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
                    {row.status}
                </div>
            )
        },
    ];

    const relawanColumns = [
        { header: 'NIK', accessor: 'nik' as keyof RelawanData },
        { header: 'NAMA LENGKAP', accessor: 'namaLengkap' as keyof RelawanData },
        { header: 'JENIS KELAMIN', accessor: 'jenisKelamin' as keyof RelawanData },
        { header: 'NO. TELEPON', accessor: 'noTelepon' as keyof RelawanData },
    ];

    const handleDetailClick = (relawan: RelawanData) => {
        setSelectedRelawan(relawan);
        setIsDetailModalOpen(true);
    };

    const pengajuanActions = (row: PengajuanData) => (
        <Button variant="secondary" size="sm">Review</Button>
    );

    const relawanActions = (row: RelawanData) => (
        <Button variant="secondary" size="sm" onClick={() => handleDetailClick(row)}>Detail</Button>
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
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
            namaRelawan: '',
            nik: '',
            jenisKelamin: 'Laki-Laki',
            alamat: '',
            noHp: '',
            opd: '',
            komunitas: '',
            peran: '',
            statusKeaktifan: 'Aktif'
        });
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        setFormData({
            namaRelawan: '',
            nik: '',
            jenisKelamin: 'Laki-Laki',
            alamat: '',
            noHp: '',
            opd: '',
            komunitas: '',
            peran: '',
            statusKeaktifan: 'Aktif'
        });
    };

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex justify-between items-center">
                <div className="flex gap-3">
                    <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                        <Plus size={18} />
                        Ajukan Relawan Baru
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

            {/* Pengajuan Perubahan Data */}
            <Card title="Pengajuan Perubahan Data (Perlu Review)">
                <Table columns={pengajuanColumns} data={pengajuanData} actions={pengajuanActions} />
            </Card>

            {/* Daftar Relawan */}
            <Card title="Daftar Relawan">
                <Table columns={relawanColumns} data={currentRelawanData} actions={relawanActions} minRows={5} />

                {/* Pagination */}
                <div className="mt-4 flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                        Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredRelawanData.length)} dari {filteredRelawanData.length} Relawan
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

            {/* Add Relawan Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCancel}
                title="Tambah Relawan Baru"
                subtitle="Halaman untuk menambahkan relawan baru"
                maxWidth="2xl"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Nama Relawan */}
                    <div className="grid grid-cols-4 gap-4 items-center">
                        <label className="text-lg font-medium text-gray-900">Nama Relawan</label>
                        <input
                            type="text"
                            name="namaRelawan"
                            value={formData.namaRelawan}
                            onChange={handleInputChange}
                            placeholder="Nama Relawan"
                            className="col-span-3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* NIK */}
                    <div className="grid grid-cols-4 gap-4 items-center">
                        <label className="text-lg font-medium text-gray-900">NIK</label>
                        <input
                            type="text"
                            name="nik"
                            value={formData.nik}
                            onChange={handleInputChange}
                            placeholder="NIK Relawan"
                            className="col-span-3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* Jenis Kelamin */}
                    <div className="grid grid-cols-4 gap-4 items-center">
                        <label className="text-lg font-medium text-gray-900">Jenis Kelamin</label>
                        <div className="col-span-3 flex gap-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="jenisKelamin"
                                    value="Laki-Laki"
                                    checked={formData.jenisKelamin === 'Laki-Laki'}
                                    onChange={handleInputChange}
                                    className="w-4 h-4 text-blue-500"
                                />
                                <span className="text-gray-700">Laki-Laki</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="jenisKelamin"
                                    value="Perempuan"
                                    checked={formData.jenisKelamin === 'Perempuan'}
                                    onChange={handleInputChange}
                                    className="w-4 h-4 text-blue-500"
                                />
                                <span className="text-gray-700">Perempuan</span>
                            </label>
                        </div>
                    </div>

                    {/* Alamat */}
                    <div className="grid grid-cols-4 gap-4 items-center">
                        <label className="text-lg font-medium text-gray-900">Alamat</label>
                        <input
                            type="text"
                            name="alamat"
                            value={formData.alamat}
                            onChange={handleInputChange}
                            placeholder="Alamat Relawan"
                            className="col-span-3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* No. HP */}
                    <div className="grid grid-cols-4 gap-4 items-center">
                        <label className="text-lg font-medium text-gray-900">No. HP</label>
                        <input
                            type="text"
                            name="noHp"
                            value={formData.noHp}
                            onChange={handleInputChange}
                            placeholder="No HP Relawan"
                            className="col-span-3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* Daftar Penugasan Section */}
                    <div className="pt-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daftar Penugasan:</h3>

                        {/* OPD */}
                        <div className="grid grid-cols-4 gap-4 items-center mb-4">
                            <label className="text-lg font-medium text-gray-900 pl-8">OPD</label>
                            <Select
                                name="opd"
                                value={formData.opd}
                                onChange={handleSelectChange}
                                placeholder="Pilih OPD"
                                className="col-span-3"
                                options={[
                                    { value: 'opd1', label: 'OPD 1' },
                                    { value: 'opd2', label: 'OPD 2' },
                                    { value: 'opd3', label: 'OPD 3' },
                                ]}
                            />
                        </div>

                        {/* Komunitas (Kader) */}
                        <div className="grid grid-cols-4 gap-4 items-center mb-4">
                            <label className="text-lg font-medium text-gray-900 pl-8">Kader</label>
                            <Select
                                name="komunitas"
                                value={formData.komunitas}
                                onChange={handleSelectChange}
                                placeholder="Pilih Kader"
                                className="col-span-3"
                                options={[
                                    { value: 'kader1', label: 'Kader 1' },
                                    { value: 'kader2', label: 'Kader 2' },
                                    { value: 'kader3', label: 'Kader 3' },
                                ]}
                            />
                        </div>

                        {/* Peran */}
                        <div className="grid grid-cols-4 gap-4 items-center mb-4">
                            <label className="text-lg font-medium text-gray-900 pl-8">Peran</label>
                            <Select
                                name="peran"
                                value={formData.peran}
                                onChange={handleSelectChange}
                                placeholder="Pilih Peran"
                                className="col-span-3"
                                options={[
                                    { value: 'koordinator', label: 'Koordinator' },
                                    { value: 'anggota', label: 'Anggota' },
                                    { value: 'pengurus', label: 'Pengurus' },
                                ]}
                            />
                        </div>

                        {/* Tambah Data Penugasan Button */}
                        <div className="flex justify-center mt-4">
                            <Button type="button" variant="primary" size="sm">
                                Tambah Data Penugasan
                            </Button>
                        </div>
                    </div>

                    {/* Status Keaktifan */}
                    <div className="grid grid-cols-4 gap-4 items-center pt-4">
                        <label className="text-lg font-medium text-gray-900">Status Keaktifan</label>
                        <div className="col-span-3 flex gap-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="statusKeaktifan"
                                    value="Aktif"
                                    checked={formData.statusKeaktifan === 'Aktif'}
                                    onChange={handleInputChange}
                                    className="w-4 h-4 text-blue-500"
                                />
                                <span className="text-gray-700">Aktif</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="statusKeaktifan"
                                    value="Nonaktif"
                                    checked={formData.statusKeaktifan === 'Nonaktif'}
                                    onChange={handleInputChange}
                                    className="w-4 h-4 text-blue-500"
                                />
                                <span className="text-gray-700">Nonaktif</span>
                            </label>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex justify-end pt-6">
                        <Button
                            type="submit"
                            className="bg-green-600 hover:bg-green-700 text-white px-12"
                        >
                            Simpan
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Detail Relawan Modal */}
            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title="Detail Relawan"
                subtitle="Halaman untuk melihat detail Relawan"
                maxWidth="2xl"
            >
                {selectedRelawan && (
                    <div className="space-y-6">
                        {/* Nama Relawan */}
                        <div className="grid grid-cols-4 gap-4 items-center">
                            <label className="text-lg font-medium text-gray-900">Nama Relawan</label>
                            <input
                                type="text"
                                value={selectedRelawan.namaLengkap}
                                placeholder="Nama Relawan"
                                className="col-span-3 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 italic"
                                disabled
                            />
                        </div>

                        {/* NIK */}
                        <div className="grid grid-cols-4 gap-4 items-center">
                            <label className="text-lg font-medium text-gray-900">NIK</label>
                            <input
                                type="text"
                                value={selectedRelawan.nik}
                                placeholder="NIK Relawan"
                                className="col-span-3 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 italic"
                                disabled
                            />
                        </div>

                        {/* Jenis Kelamin */}
                        <div className="grid grid-cols-4 gap-4 items-center">
                            <label className="text-lg font-medium text-gray-900">Jenis Kelamin</label>
                            <div className="col-span-3 flex gap-6">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        checked={selectedRelawan.jenisKelamin === 'Laki-Laki'}
                                        className="w-4 h-4 text-blue-500"
                                        disabled
                                    />
                                    <span className="text-gray-700">Laki-Laki</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        checked={selectedRelawan.jenisKelamin === 'Perempuan'}
                                        className="w-4 h-4 text-blue-500"
                                        disabled
                                    />
                                    <span className="text-gray-700">Perempuan</span>
                                </label>
                            </div>
                        </div>

                        {/* Alamat */}
                        <div className="grid grid-cols-4 gap-4 items-center">
                            <label className="text-lg font-medium text-gray-900">Alamat</label>
                            <input
                                type="text"
                                value="Jl. Contoh Alamat No. 123"
                                placeholder="Alamat Relawan"
                                className="col-span-3 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 italic"
                                disabled
                            />
                        </div>

                        {/* No. HP */}
                        <div className="grid grid-cols-4 gap-4 items-center">
                            <label className="text-lg font-medium text-gray-900">No. HP</label>
                            <input
                                type="text"
                                value={selectedRelawan.noTelepon}
                                placeholder="No HP Relawan"
                                className="col-span-3 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 italic"
                                disabled
                            />
                        </div>

                        {/* Daftar Penugasan Section */}
                        <div className="border-t border-gray-200 pt-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daftar Penugasan:</h3>

                            {/* OPD */}
                            <div className="grid grid-cols-4 gap-4 items-center mb-4">
                                <label className="text-lg font-medium text-gray-900 pl-8">OPD</label>
                                <Select
                                    name="opd"
                                    value=""
                                    onChange={() => { }}
                                    placeholder="Pilih OPD"
                                    className="col-span-3"
                                    options={[
                                        { value: 'opd1', label: 'OPD 1' },
                                        { value: 'opd2', label: 'OPD 2' },
                                    ]}
                                    disabled
                                />
                            </div>

                            {/* Komunitas */}
                            <div className="grid grid-cols-4 gap-4 items-center mb-4">
                                <label className="text-lg font-medium text-gray-900 pl-8">Komunitas</label>
                                <Select
                                    name="komunitas"
                                    value=""
                                    onChange={() => { }}
                                    placeholder="Pilih Komunitas"
                                    className="col-span-3"
                                    options={[
                                        { value: 'kader1', label: 'Kader 1' },
                                        { value: 'kader2', label: 'Kader 2' },
                                    ]}
                                    disabled
                                />
                            </div>

                            {/* Peran */}
                            <div className="grid grid-cols-4 gap-4 items-center mb-4">
                                <label className="text-lg font-medium text-gray-900 pl-8">Peran</label>
                                <Select
                                    name="peran"
                                    value=""
                                    onChange={() => { }}
                                    placeholder="Pilih Peran"
                                    className="col-span-3"
                                    options={[
                                        { value: 'koordinator', label: 'Koordinator' },
                                        { value: 'anggota', label: 'Anggota' },
                                    ]}
                                    disabled
                                />
                            </div>

                            {/* Status Keaktifan */}
                            <div className="grid grid-cols-4 gap-4 items-center">
                                <label className="text-lg font-medium text-gray-900 pl-8">Status Keaktifan</label>
                                <div className="col-span-3 flex gap-6">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            checked={true}
                                            className="w-4 h-4 text-blue-500"
                                            disabled
                                        />
                                        <span className="text-gray-700">Aktif</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            checked={false}
                                            className="w-4 h-4 text-blue-500"
                                            disabled
                                        />
                                        <span className="text-gray-700">Nonaktif</span>
                                    </label>
                                </div>
                            </div>

                            {/* Tambah Data Penugasan Button */}
                            <div className="flex justify-center mt-4">
                                <Button type="button" variant="primary" size="sm">
                                    Tambah Data Penugasan
                                </Button>
                            </div>
                        </div>

                        {/* Action Button */}
                        <div className="flex justify-end pt-6">
                            <Button
                                type="button"
                                className="bg-green-600 hover:bg-green-700 text-white px-12"
                            >
                                Simpan
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Upload Excel Modal */}
            <UploadExcelModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                title="Unggah Data Relawan"
                templateName="Data Relawan"
            />
        </div>
    );
};

export default DataRelawan;

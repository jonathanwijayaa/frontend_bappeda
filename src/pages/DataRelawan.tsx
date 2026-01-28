import React, { useState } from 'react';
import { Plus, Upload } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { SearchInput } from '../components/ui/Input';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import Select from '../components/ui/Select';

interface PengajuanData {
    nik: string;
    namaLengkap: string;
    tanggalPengajuan: string;
    status: string;
}

interface RelawanData {
    nik: string;
    namaLengkap: string;
    jenisKelamin: string;
    noTelepon: string;
}

const DataRelawan: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
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

    const pengajuanData: PengajuanData[] = [
        {
            nik: '1234567890123456',
            namaLengkap: 'Jonathan Wijaya',
            tanggalPengajuan: '24-11-2025',
            status: 'Menunggu',
        },
    ];

    const relawanData: RelawanData[] = [
        {
            nik: '1234567890123456',
            namaLengkap: 'Jonathan Wijaya',
            jenisKelamin: 'Laki-Laki',
            noTelepon: '081234567890',
        },
        {
            nik: '1234567890123456',
            namaLengkap: 'Jonathan Wijaya',
            jenisKelamin: 'Laki-Laki',
            noTelepon: '081234567890',
        },
        {
            nik: '1234567890123456',
            namaLengkap: 'Jonathan Wijaya',
            jenisKelamin: 'Laki-Laki',
            noTelepon: '081234567890',
        },
        {
            nik: '1234567890123456',
            namaLengkap: 'Jonathan Wijaya',
            jenisKelamin: 'Laki-Laki',
            noTelepon: '081234567890',
        },
        {
            nik: '1234567890123456',
            namaLengkap: 'Jonathan Wijaya',
            jenisKelamin: 'Laki-Laki',
            noTelepon: '081234567890',
        },
        {
            nik: '1234567890123456',
            namaLengkap: 'Jonathan Wijaya',
            jenisKelamin: 'Laki-Laki',
            noTelepon: '081234567890',
        },
    ];

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

    const pengajuanActions = (row: PengajuanData) => (
        <Button variant="secondary" size="sm">Review</Button>
    );

    const relawanActions = (row: RelawanData) => (
        <Button variant="secondary" size="sm">Detail</Button>
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
        // Reset form
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
                <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} />
                    Ajukan Relawan Baru
                </Button>
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
                <Table columns={relawanColumns} data={relawanData} actions={relawanActions} />
            </Card>

            {/* Add Relawan Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCancel}
                title="Tambah Relawan Baru"
                subtitle="Halaman untuk menambahkan relawan baru"
                maxWidth="xl"
            >
                <div className="flex justify-end mb-4">
                    <Button variant="primary" size="sm">
                        <Upload size={16} />
                        Import dari Excel
                    </Button>
                </div>

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
        </div>
    );
};

export default DataRelawan;

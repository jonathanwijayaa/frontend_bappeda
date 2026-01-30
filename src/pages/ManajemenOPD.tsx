import React, { useState } from 'react';
import { Plus, FileDown, Upload } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { SearchInput } from '../components/ui/Input';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';

interface OPDData {
    id: number;
    namaOpd: string;
    kode: string;
    status: string;
    alamat: string;
    pic: string;
    kontak: string;
}

const ManajemenOPD: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [formData, setFormData] = useState({
        namaOpd: '',
        status: '',
        alamat: '',
        pic: '',
        kontak: ''
    });

    const opdData: OPDData[] = [
        {
            id: 1,
            namaOpd: 'OPD 1',
            kode: 'A001',
            status: 'Aktif',
            alamat: 'Jl. Sagan',
            pic: 'Jonathan Wijaya',
            kontak: '0812-3456-7890'
        },
    ];

    const columns = [
        { header: 'NAMA OPD', accessor: 'namaOpd' as keyof OPDData },
        { header: 'KODE', accessor: 'kode' as keyof OPDData },
        { header: 'STATUS', accessor: 'status' as keyof OPDData },
        { header: 'ALAMAT', accessor: 'alamat' as keyof OPDData },
        { header: 'PIC', accessor: 'pic' as keyof OPDData },
        { header: 'Kontak', accessor: 'kontak' as keyof OPDData },
    ];

    const actions = (row: OPDData) => (
        <>
            <Button variant="secondary" size="sm">Detail</Button>
            <Button variant="secondary" size="sm">Nonaktif</Button>
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
        // Handle form submission here
        console.log('Form data:', formData);
        setIsModalOpen(false);
        // Reset form
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
        // Reset form
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
            <Card title="Daftar OPD">
                <div className="mb-4 flex justify-end">
                    <Button variant="secondary" size="sm">
                        <FileDown size={16} />
                        Export
                    </Button>
                </div>
                <Table columns={columns} data={opdData} actions={actions} />
                <div className="mt-4 text-sm text-gray-500">
                    Menampilkan 1-8 dari 8 OPD
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
        </div>
    );
};

export default ManajemenOPD;

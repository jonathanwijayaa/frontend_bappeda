import React, { useState, useMemo } from 'react';
import { Plus, Upload, ChevronLeft, ChevronRight, X, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { SearchInput } from '../components/ui/Input';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import Select from '../components/ui/Select';
import UploadExcelModal from '../components/ui/UploadExcelModal';
import Toast, { ToastType } from '../components/ui/Toast';
import { PengajuanData, RelawanData, Assignment } from '../types/relawan.types';
import { mockPengajuanData, mockRelawanData } from '../data/relawan.data';

const DataRelawan: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
    const [selectedRelawan, setSelectedRelawan] = useState<RelawanData | null>(null);
    const [selectedPengajuan, setSelectedPengajuan] = useState<PengajuanData | null>(null);
    const [verificationNote, setVerificationNote] = useState<string>('');
    const [isDataChecked, setIsDataChecked] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const itemsPerPage = 5;

    // Detail form data for editing
    const [detailFormData, setDetailFormData] = useState({
        namaRelawan: '',
        nik: '',
        alamat: '',
        kelurahan: '',
        kader: '',
        jabatan: '',
        kedinasan: '',
        assignments: [] as Assignment[]
    });

    // Track if there are any changes
    const hasChanges = useMemo(() => {
        if (!selectedRelawan) return false;

        return (
            detailFormData.namaRelawan !== selectedRelawan.namaLengkap ||
            detailFormData.nik !== selectedRelawan.nik ||
            detailFormData.alamat !== selectedRelawan.alamat ||
            detailFormData.kelurahan !== selectedRelawan.kelurahan ||
            detailFormData.kader !== selectedRelawan.kader ||
            detailFormData.jabatan !== selectedRelawan.jabatan ||
            detailFormData.kedinasan !== selectedRelawan.kedinasan ||
            JSON.stringify(detailFormData.assignments) !== JSON.stringify(selectedRelawan.assignments || [])
        );
    }, [selectedRelawan, detailFormData]);

    const [formData, setFormData] = useState({
        namaRelawan: '',
        nik: '',
        alamat: '',
        kelurahan: '',
        kader: '',
        jabatan: '',
        kedinasan: '',
        assignments: [
            {
                id: Date.now().toString(),
                opd: '',
                kader: '',
                peran: '',
                statusKeaktifan: 'Aktif' as 'Aktif' | 'Nonaktif',
                nomorSK: '',
                skId: ''
            }
        ]
    });

    const pengajuanData: PengajuanData[] = mockPengajuanData;

    // Pagination logic
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
        { header: 'NAMA', accessor: 'namaLengkap' as keyof RelawanData },
        { header: 'NIK', accessor: 'nik' as keyof RelawanData },
        { header: 'ALAMAT', accessor: 'alamat' as keyof RelawanData },
        { header: 'KELURAHAN', accessor: 'kelurahan' as keyof RelawanData },
        { header: 'kader', accessor: 'kader' as keyof RelawanData },
        { header: 'JABATAN', accessor: 'jabatan' as keyof RelawanData },
        { header: 'kedinasan', accessor: 'kedinasan' as keyof RelawanData },
    ];

    const handleDetailClick = (relawan: RelawanData) => {
        setSelectedRelawan(relawan);
        setDetailFormData({
            namaRelawan: relawan.namaLengkap,
            nik: relawan.nik,
            alamat: relawan.alamat,
            kelurahan: relawan.kelurahan,
            kader: relawan.kader,
            jabatan: relawan.jabatan,
            kedinasan: relawan.kedinasan,
            assignments: relawan.assignments || []
        });
        setIsDetailModalOpen(true);
    };

    const handleReviewClick = (pengajuan: PengajuanData) => {
        setSelectedPengajuan(pengajuan);
        setIsReviewModalOpen(true);
        setVerificationNote('');
        setIsDataChecked(false);
    };

    const handleApprove = () => {
        console.log('Approved:', selectedPengajuan);
        console.log('Verification Note:', verificationNote);
        setIsReviewModalOpen(false);
    };

    const handleReject = () => {
        console.log('Rejected:', selectedPengajuan);
        console.log('Verification Note:', verificationNote);
        setIsReviewModalOpen(false);
    };

    const handleExcelUploadConfirm = (data: any[]) => {
        console.log('Excel data confirmed:', data);
        // Here you would typically add the data to your state/database
        // For now, just show a success message
        setToast({ message: `Berhasil menambahkan ${data.length} data relawan`, type: 'success' });
        setIsUploadModalOpen(false);
    };

    const pengajuanActions = (row: PengajuanData) => (
        <Button variant="secondary" size="sm" onClick={() => handleReviewClick(row)}>Review</Button>
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

    const handleAssignmentChange = (index: number, field: keyof Assignment, value: string) => {
        setFormData(prev => ({
            ...prev,
            assignments: prev.assignments.map((assignment, i) =>
                i === index ? { ...assignment, [field]: value } : assignment
            )
        }));
    };

    const handleDetailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setDetailFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDetailAssignmentChange = (index: number, field: keyof Assignment, value: string) => {
        setDetailFormData(prev => ({
            ...prev,
            assignments: prev.assignments.map((assignment, i) =>
                i === index ? { ...assignment, [field]: value } : assignment
            )
        }));
    };

    const handleDetailAddAssignment = () => {
        setDetailFormData(prev => ({
            ...prev,
            assignments: [
                ...prev.assignments,
                {
                    id: Date.now().toString(),
                    opd: '',
                    kader: '',
                    peran: '',
                    statusKeaktifan: 'Aktif' as 'Aktif' | 'Nonaktif',
                    nomorSK: '',
                    skId: ''
                }
            ]
        }));
    };

    const handleDetailRemoveAssignment = (index: number) => {
        if (detailFormData.assignments.length > 1) {
            setDetailFormData(prev => ({
                ...prev,
                assignments: prev.assignments.filter((_, i) => i !== index)
            }));
        }
    };

    const handleAddAssignment = () => {
        setFormData(prev => ({
            ...prev,
            assignments: [
                ...prev.assignments,
                {
                    id: Date.now().toString(),
                    opd: '',
                    kader: '',
                    peran: '',
                    statusKeaktifan: 'Aktif' as 'Aktif' | 'Nonaktif',
                    nomorSK: '',
                    skId: ''
                }
            ]
        }));
    };

    const handleRemoveAssignment = (index: number) => {
        if (formData.assignments.length > 1) {
            setFormData(prev => ({
                ...prev,
                assignments: prev.assignments.filter((_, i) => i !== index)
            }));
        }
    };



    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form data:', formData);
        setIsModalOpen(false);
        // Reset form
        setFormData({
            namaRelawan: '',
            nik: '',
            alamat: '',
            kelurahan: '',
            kader: '',
            jabatan: '',
            kedinasan: '',
            assignments: [
                {
                    id: Date.now().toString(),
                    opd: '',
                    kader: '',
                    peran: '',
                    statusKeaktifan: 'Aktif',
                    nomorSK: '',
                    skId: ''
                }
            ]
        });
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        setFormData({
            namaRelawan: '',
            nik: '',
            alamat: '',
            kelurahan: '',
            kader: '',
            jabatan: '',
            kedinasan: '',
            assignments: [
                {
                    id: Date.now().toString(),
                    opd: '',
                    kader: '',
                    peran: '',
                    statusKeaktifan: 'Aktif',
                    nomorSK: '',
                    skId: ''
                }
            ]
        });
    };

    const handleDetailSave = () => {
        console.log('Saving detail changes:', detailFormData);
        // Here you would typically update the data
        setIsDetailModalOpen(false);
    };

    const renderAssignmentFields = (
        assignment: Assignment,
        index: number,
        disabled: boolean = false,
        handlers?: {
            onChange: (index: number, field: keyof Assignment, value: string) => void;
            onRemove: (index: number) => void;
            assignments: Assignment[];
        }
    ) => {
        const assignmentList = handlers?.assignments || formData.assignments;
        const handleChange = handlers?.onChange || handleAssignmentChange;
        const handleRemove = handlers?.onRemove || handleRemoveAssignment;

        return (
            <div key={assignment.id} className="border border-gray-200 rounded-lg p-4 mb-4 relative">
                {!disabled && assignmentList.length > 1 && (
                    <button
                        type="button"
                        onClick={() => handleRemove(index)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    >
                        <X size={20} />
                    </button>
                )}

                <h4 className="text-md font-semibold text-gray-900 mb-4">Penugasan {index + 1}</h4>

                {/* OPD */}
                <div className="grid grid-cols-4 gap-4 items-center mb-4">
                    <label className="text-lg font-medium text-gray-900 pl-4">OPD</label>
                    <Select
                        name="opd"
                        value={assignment.opd}
                        onChange={(e) => !disabled && handleChange(index, 'opd', e.target.value)}
                        placeholder="Pilih OPD"
                        className="col-span-3"
                        options={[
                            { value: 'Badan Penanggulangan Bencana Daerah', label: 'Badan Penanggulangan Bencana Daerah' },
                            { value: 'Dinas Kesehatan', label: 'Dinas Kesehatan' },
                            { value: 'Dinas Pemadam Kebakaran', label: 'Dinas Pemadam Kebakaran' },
                            { value: 'Dinas Pemberdayaan Perempuan, Perlindungan Anak, Pengendalian Penduduk dan Keluarga Berencana', label: 'Dinas Pemberdayaan Perempuan, Perlindungan Anak, Pengendalian Penduduk dan Keluarga Berencana' },
                            { value: 'Dinas Pendidikan, Pemuda, dan Olahraga', label: 'Dinas Pendidikan, Pemuda, dan Olahraga' },
                            { value: 'Dinas Sosial, Tenaga Kerja, dan Transmigrasi', label: 'Dinas Sosial, Tenaga Kerja, dan Transmigrasi' },
                            { value: 'Lembaga Kemasyarakatan Kelurahan', label: 'Lembaga Kemasyarakatan Kelurahan' },
                            { value: 'Satuan Polisi Pamong Praja (PP)', label: 'Satuan Polisi Pamong Praja (PP)' },
                        ]}
                        disabled={disabled}
                    />
                </div>

                {/* Kader */}
                <div className="grid grid-cols-4 gap-4 items-center mb-4">
                    <label className="text-lg font-medium text-gray-900 pl-4">Kader</label>
                    <Select
                        name="kader"
                        value={assignment.kader}
                        onChange={(e) => !disabled && handleChange(index, 'kader', e.target.value)}
                        placeholder="Pilih Kader"
                        className="col-span-3"
                        options={[
                            { value: '-', label: 'Tidak Ada (Penugasan OPD)' },
                            { value: 'Kader Pembangunan Daerah A', label: 'Kader Pembangunan Daerah A' },
                            { value: 'Kader Pemberdayaan Masyarakat B', label: 'Kader Pemberdayaan Masyarakat B' },
                            { value: 'Kader Lingkungan Hidup C', label: 'Kader Lingkungan Hidup C' },
                            { value: 'Kader Kesehatan D', label: 'Kader Kesehatan D' },
                            { value: 'Kader Ekonomi Kreatif E', label: 'Kader Ekonomi Kreatif E' },
                        ]}
                        disabled={disabled}
                    />
                </div>

                {/* Peran */}
                <div className="grid grid-cols-4 gap-4 items-center mb-4">
                    <label className="text-lg font-medium text-gray-900 pl-4">Peran</label>
                    <Select
                        name="peran"
                        value={assignment.peran}
                        onChange={(e) => !disabled && handleChange(index, 'peran', e.target.value)}
                        placeholder="Pilih Peran"
                        className="col-span-3"
                        options={[
                            { value: 'Koordinator', label: 'Koordinator' },
                            { value: 'Anggota', label: 'Anggota' },
                            { value: 'Pengurus', label: 'Pengurus' },
                        ]}
                        disabled={disabled}
                    />
                </div>

                {/* Nomor SK with link */}
                <div className="grid grid-cols-4 gap-4 items-center mb-4">
                    <label className="text-lg font-medium text-gray-900 pl-4">Nomor SK</label>
                    <div className="col-span-3 flex gap-2 items-center">
                        <input
                            type="text"
                            value={assignment.nomorSK}
                            onChange={(e) => !disabled && handleChange(index, 'nomorSK', e.target.value)}
                            placeholder="Nomor SK"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:italic"
                            disabled={disabled}
                        />
                        {assignment.skId && (
                            <Link
                                to={`/surat-keputusan?highlight=${assignment.skId}`}
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm whitespace-nowrap"
                                title="Lihat Surat Keputusan"
                            >
                                <ExternalLink size={16} />
                                Lihat SK
                            </Link>
                        )}
                    </div>
                </div>

                {/* Status Keaktifan */}
                <div className="grid grid-cols-4 gap-4 items-center">
                    <label className="text-lg font-medium text-gray-900 pl-4">Status Keaktifan</label>
                    <div className="col-span-3 flex gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                checked={assignment.statusKeaktifan === 'Aktif'}
                                onChange={() => !disabled && handleChange(index, 'statusKeaktifan', 'Aktif')}
                                className="w-4 h-4 text-blue-500"
                                disabled={disabled}
                            />
                            <span className="text-gray-700">Aktif</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                checked={assignment.statusKeaktifan === 'Nonaktif'}
                                onChange={() => !disabled && handleChange(index, 'statusKeaktifan', 'Nonaktif')}
                                className="w-4 h-4 text-blue-500"
                                disabled={disabled}
                            />
                            <span className="text-gray-700">Nonaktif</span>
                        </label>
                    </div>
                </div>
            </div>
        );
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

                    {/* Kelurahan */}
                    <div className="grid grid-cols-4 gap-4 items-center">
                        <label className="text-lg font-medium text-gray-900">Kelurahan</label>
                        <input
                            type="text"
                            name="kelurahan"
                            value={formData.kelurahan}
                            onChange={handleInputChange}
                            placeholder="Kelurahan"
                            className="col-span-3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* kader */}
                    <div className="grid grid-cols-4 gap-4 items-center">
                        <label className="text-lg font-medium text-gray-900">kader</label>
                        <input
                            type="text"
                            name="kader"
                            value={formData.kader}
                            onChange={handleInputChange}
                            placeholder="kader"
                            className="col-span-3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* Jabatan */}
                    <div className="grid grid-cols-4 gap-4 items-center">
                        <label className="text-lg font-medium text-gray-900">Jabatan</label>
                        <input
                            type="text"
                            name="jabatan"
                            value={formData.jabatan}
                            onChange={handleInputChange}
                            placeholder="Jabatan"
                            className="col-span-3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* kedinasan */}
                    <div className="grid grid-cols-4 gap-4 items-center">
                        <label className="text-lg font-medium text-gray-900">kedinasan</label>
                        <input
                            type="text"
                            name="kedinasan"
                            value={formData.kedinasan}
                            onChange={handleInputChange}
                            placeholder="kedinasan"
                            className="col-span-3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* Daftar Penugasan Section */}
                    <div className="pt-4 border-t border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daftar Penugasan:</h3>

                        {formData.assignments.map((assignment, index) =>
                            renderAssignmentFields(assignment, index, false)
                        )}

                        {/* Tambah Data Penugasan Button */}
                        <div className="flex justify-center mt-4">
                            <Button type="button" variant="primary" size="sm" onClick={handleAddAssignment}>
                                <Plus size={16} />
                                Tambah Data Penugasan
                            </Button>
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
                                name="namaRelawan"
                                value={detailFormData.namaRelawan}
                                onChange={handleDetailInputChange}
                                placeholder="Nama Relawan"
                                className="col-span-3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* NIK */}
                        <div className="grid grid-cols-4 gap-4 items-center">
                            <label className="text-lg font-medium text-gray-900">NIK</label>
                            <input
                                type="text"
                                name="nik"
                                value={detailFormData.nik}
                                onChange={handleDetailInputChange}
                                placeholder="NIK Relawan"
                                className="col-span-3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Alamat */}
                        <div className="grid grid-cols-4 gap-4 items-center">
                            <label className="text-lg font-medium text-gray-900">Alamat</label>
                            <input
                                type="text"
                                name="alamat"
                                value={detailFormData.alamat}
                                onChange={handleDetailInputChange}
                                placeholder="Alamat Relawan"
                                className="col-span-3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Kelurahan */}
                        <div className="grid grid-cols-4 gap-4 items-center">
                            <label className="text-lg font-medium text-gray-900">Kelurahan</label>
                            <input
                                type="text"
                                name="kelurahan"
                                value={detailFormData.kelurahan}
                                onChange={handleDetailInputChange}
                                placeholder="Kelurahan"
                                className="col-span-3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* kader */}
                        <div className="grid grid-cols-4 gap-4 items-center">
                            <label className="text-lg font-medium text-gray-900">kader</label>
                            <input
                                type="text"
                                name="kader"
                                value={detailFormData.kader}
                                onChange={handleDetailInputChange}
                                placeholder="kader"
                                className="col-span-3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Jabatan */}
                        <div className="grid grid-cols-4 gap-4 items-center">
                            <label className="text-lg font-medium text-gray-900">Jabatan</label>
                            <input
                                type="text"
                                name="jabatan"
                                value={detailFormData.jabatan}
                                onChange={handleDetailInputChange}
                                placeholder="Jabatan"
                                className="col-span-3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* kedinasan */}
                        <div className="grid grid-cols-4 gap-4 items-center">
                            <label className="text-lg font-medium text-gray-900">kedinasan</label>
                            <input
                                type="text"
                                name="kedinasan"
                                value={detailFormData.kedinasan}
                                onChange={handleDetailInputChange}
                                placeholder="kedinasan"
                                className="col-span-3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Daftar Penugasan Section */}
                        <div className="border-t border-gray-200 pt-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daftar Penugasan:</h3>

                            {detailFormData.assignments && detailFormData.assignments.length > 0 ? (
                                detailFormData.assignments.map((assignment, index) =>
                                    renderAssignmentFields(assignment, index, false, {
                                        onChange: handleDetailAssignmentChange,
                                        onRemove: handleDetailRemoveAssignment,
                                        assignments: detailFormData.assignments
                                    })
                                )
                            ) : (
                                <p className="text-gray-500 italic">Belum ada penugasan</p>
                            )}

                            {/* Tambah Data Penugasan Button */}
                            <div className="flex justify-center mt-4">
                                <Button type="button" variant="primary" size="sm" onClick={handleDetailAddAssignment}>
                                    <Plus size={16} />
                                    Tambah Data Penugasan
                                </Button>
                            </div>
                        </div>

                        {/* Action Button */}
                        <div className="flex justify-end pt-6">
                            <Button
                                type="button"
                                onClick={handleDetailSave}
                                disabled={!hasChanges}
                                className="bg-green-600 hover:bg-green-700 text-white px-12 disabled:opacity-50 disabled:cursor-not-allowed"
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
                onConfirm={handleExcelUploadConfirm}
                title="Unggah Data Relawan"
                templateName="Data Relawan"
                dataType="relawan"
            />

            {/* Review Pengajuan Modal */}
            <Modal
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                title="Review Pengajuan Perubahan Data"
                subtitle="Halaman untuk review pengajuan perubahan data oleh relawan"
                maxWidth="2xl"
            >
                {selectedPengajuan && (
                    <div className="space-y-6">
                        {/* Informasi Relawan */}
                        <div className="space-y-4">
                            {/* Nama Relawan */}
                            <div className="grid grid-cols-4 gap-4 items-center">
                                <label className="text-base font-medium text-gray-900">Nama Relawan</label>
                                <input
                                    type="text"
                                    value={selectedPengajuan.namaLengkap}
                                    className="col-span-3 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                                    disabled
                                />
                            </div>

                            {/* NIK */}
                            <div className="grid grid-cols-4 gap-4 items-center">
                                <label className="text-base font-medium text-gray-900">NIK</label>
                                <input
                                    type="text"
                                    value={selectedPengajuan.nik}
                                    className="col-span-3 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                                    disabled
                                />
                            </div>

                            {/* Tanggal Pengajuan */}
                            <div className="grid grid-cols-4 gap-4 items-center">
                                <label className="text-base font-medium text-gray-900">Tanggal Pengajuan</label>
                                <input
                                    type="text"
                                    value={selectedPengajuan.tanggalPengajuan}
                                    className="col-span-3 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                                    disabled
                                />
                            </div>

                            {/* Status */}
                            <div className="grid grid-cols-4 gap-4 items-center">
                                <label className="text-base font-medium text-gray-900">Status saat ini</label>
                                <div className="col-span-3 flex items-center gap-2">
                                    <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
                                    <span className="text-gray-900">{selectedPengajuan.status}</span>
                                </div>
                            </div>
                        </div>

                        {/* Perubahan Data */}
                        <div className="border-t border-gray-200 pt-4">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Perubahan Data</h3>
                            <div className="bg-gray-50 rounded-lg overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Nama Data</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Data Lama</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Data Baru</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedPengajuan.dataLama && selectedPengajuan.dataBaru &&
                                            Object.keys(selectedPengajuan.dataLama).map((key) => (
                                                <tr key={key} className="border-t border-gray-300">
                                                    <td className="px-4 py-3 text-sm text-gray-900">{key}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">{selectedPengajuan.dataLama![key]}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">{selectedPengajuan.dataBaru![key]}</td>
                                                </tr>
                                            ))
                                        }
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Catatan dari Relawan */}
                        <div className="border-t border-gray-200 pt-4">
                            <h3 className="text-lg font-bold text-gray-900 mb-3">Catatan dari Relawan</h3>
                            <textarea
                                value={selectedPengajuan.catatanRelawan || ''}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 resize-none"
                                rows={3}
                                disabled
                            />
                        </div>

                        {/* Catatan Verifikasi */}
                        <div className="border-t border-gray-200 pt-4">
                            <h3 className="text-lg font-bold text-gray-900 mb-3">Catatan Verifikasi</h3>
                            <textarea
                                value={verificationNote}
                                onChange={(e) => setVerificationNote(e.target.value)}
                                placeholder="Masukkan catatan verifikasi..."
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                rows={3}
                            />
                        </div>

                        {/* Checkbox */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="dataChecked"
                                checked={isDataChecked}
                                onChange={(e) => setIsDataChecked(e.target.checked)}
                                className="w-4 h-4 text-blue-500 rounded"
                            />
                            <label htmlFor="dataChecked" className="text-sm text-gray-700 cursor-pointer">
                                Saya telah memeriksa data
                            </label>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-between pt-4">
                            <Button
                                type="button"
                                onClick={handleReject}
                                className="bg-red-600 hover:bg-red-700 text-white px-8"
                            >
                                Tolak
                            </Button>
                            <Button
                                type="button"
                                onClick={handleApprove}
                                disabled={!isDataChecked}
                                className="bg-green-600 hover:bg-green-700 text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Setujui & Update
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

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

export default DataRelawan;

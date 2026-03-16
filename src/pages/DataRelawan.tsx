import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, Upload, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { SearchInput } from '../components/ui/Input';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import AutocompleteInput from '../components/ui/AutocompleteInput';
import UploadExcelModal from '../components/ui/UploadExcelModal';
import Toast, { ToastType } from '../components/ui/Toast';
import { RelawanData, Assignment } from '../types/relawan.types';
import { apiFetch } from '../utils/api';

// Tipe data dari backend API (mapping ke RelawanData untuk keperluan UI)
interface RelawanAPIData {
    user_id: number;
    nik: string;
    nama_lengkap: string;
    email: string | null;
    no_hp: string | null;
    is_active: boolean;
    relawan_id: number;
    jenis_kelamin: string;
    alamat_ktp: string | null;       // dari tabel relawan
    kelurahan: string | null;        // dari tabel relawan
    penugasan: string | null;        // dari tabel penugasan_relawan
    status_penugasan: string | null; // dari penugasan_relawan
    nama_opd: string | null;         // dari join ke opd
    nama_kader: string | null;   // dari join ke kader
}


// Tipe pengajuan dari backend
interface PengajuanAPIData {
    pengajuan_id: number;
    jenis_perubahan: string;
    status: string;
    tanggal_pengajuan: string;
    catatan_relawan: string | null;
    nama_lengkap: string;
    nik: string;
    relawan_id: number;
}

// Helper: mapping backend data ke UI RelawanData
const mapToRelawanData = (r: RelawanAPIData): RelawanData => ({
    nik: r.nik,
    namaLengkap: r.nama_lengkap,
    alamat: r.alamat_ktp || '-',
    kelurahan: r.kelurahan || '-',
    kader: r.nama_kader || '-',
    jabatan: r.status_penugasan || '-',
    penugasan: r.nama_opd || r.penugasan || '-',  // nama OPD dari join, atau teks penugasan dari penugasan_relawan
    jenisKelamin: r.jenis_kelamin || 'L',
    assignments: []
});

// Tipe option untuk autocomplete
interface AutoOption { label: string; value: string; }

const DataRelawan: React.FC = () => {
    const [relawanList, setRelawanList] = useState<RelawanData[]>([]);
    const [pengajuanList, setPengajuanList] = useState<PengajuanAPIData[]>([]);
    const [isLoadingRelawan, setIsLoadingRelawan] = useState(true);
    const [isLoadingPengajuan, setIsLoadingPengajuan] = useState(true);
    const [isReviewing, setIsReviewing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Autocomplete options (diambil dari API)
    const [opdOptions, setOpdOptions] = useState<AutoOption[]>([]);
    const [kaderOptions, setkaderOptions] = useState<AutoOption[]>([]);

    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
    const [selectedRelawan, setSelectedRelawan] = useState<RelawanData | null>(null);
    const [selectedPengajuan, setSelectedPengajuan] = useState<PengajuanAPIData | null>(null);
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
        penugasan: '',
        jenisKelamin: 'L' as 'L' | 'P',
        assignments: [] as Assignment[]
    });

    // Track if there are any changes (digunakan untuk enable/disable tombol Simpan di detail modal)
    const hasChanges = useMemo(() => {
        if (!selectedRelawan) return false;
        return (
            detailFormData.namaRelawan !== selectedRelawan.namaLengkap ||
            detailFormData.nik !== selectedRelawan.nik ||
            detailFormData.alamat !== selectedRelawan.alamat ||
            detailFormData.kelurahan !== selectedRelawan.kelurahan ||
            detailFormData.kader !== selectedRelawan.kader ||
            detailFormData.jabatan !== selectedRelawan.jabatan ||
            detailFormData.penugasan !== selectedRelawan.penugasan ||
            detailFormData.jenisKelamin !== (selectedRelawan.jenisKelamin || 'L') ||
            JSON.stringify(detailFormData.assignments) !== JSON.stringify(selectedRelawan.assignments || [])
        );
    }, [selectedRelawan, detailFormData]);
    void hasChanges; // Suppress unused warning - digunakan di template nanti

    const [formData, setFormData] = useState({
        namaRelawan: '',
        nik: '',
        jenisKelamin: 'L' as 'L' | 'P',
        alamat: '',
        kelurahan: '',
        kader: '',
        jabatan: '',
        penugasan: '',
        detail_penugasan: '', // ✨ Field baru ditambahkan ke state
        assignments: [
            {
                id: Date.now().toString(),
                opd: '',
                kader: '',
                peran: '',
                detail: '',
                statusKeaktifan: 'Aktif' as 'Aktif' | 'Nonaktif',
                nomorSK: '',
                skId: ''
            }
        ]
    });

    // ── Fetch Functions ─────────────────────────
    const fetchRelawan = useCallback(async () => {
        setIsLoadingRelawan(true);
        try {
            const res = await apiFetch('/admin/relawan');
            const result = await res.json();
            if (result.success) {
                setRelawanList(result.data.map(mapToRelawanData));
            } else {
                setToast({ message: result.message || 'Gagal memuat data relawan', type: 'error' });
            }
        } catch {
            setToast({ message: 'Tidak dapat terhubung ke server', type: 'error' });
        } finally {
            setIsLoadingRelawan(false);
        }
    }, []);

    const fetchPengajuan = useCallback(async () => {
        setIsLoadingPengajuan(true);
        try {
            const res = await apiFetch('/admin/relawan/pengajuan');
            const result = await res.json();
            if (result.success) {
                setPengajuanList(result.data);
            } else {
                setToast({ message: result.message || 'Gagal memuat data pengajuan', type: 'error' });
            }
        } catch {
            setToast({ message: 'Tidak dapat terhubung ke server', type: 'error' });
        } finally {
            setIsLoadingPengajuan(false);
        }
    }, []);

    // Fetch OPD & kader untuk autocomplete
    useEffect(() => {
        fetchRelawan();
        fetchPengajuan();

        // Fetch OPD options
        apiFetch('/opd').then(r => r.json()).then(result => {
            if (result.success) {
                setOpdOptions(result.data.map((o: any) => ({ label: o.nama_opd, value: o.nama_opd })));
            }
        }).catch(() => { });

        // Fetch kader options
        apiFetch('/kader').then(r => r.json()).then(result => {
            if (result.success) {
                setkaderOptions(result.data.map((k: any) => ({ label: k.nama_kader, value: k.nama_kader })));
            }
        }).catch(() => { });
    }, [fetchRelawan, fetchPengajuan]);

    // Pagination logic
    const filteredRelawanData = useMemo(() => {
        return relawanList.filter(relawan =>
            relawan.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
            relawan.nik.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [relawanList, searchTerm]);

    const totalPages = Math.ceil(filteredRelawanData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentRelawanData = filteredRelawanData.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // Map pengajuan API to UI-friendly format
    const pengajuanUIData = pengajuanList.map(p => ({
        nik: p.nik,
        namaLengkap: p.nama_lengkap,
        tanggalPengajuan: new Date(p.tanggal_pengajuan).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
        status: p.status,
        _raw: p // simpan raw untuk keperluan review
    }));

    const pengajuanColumns = [
        { header: 'NIK', accessor: 'nik' as const },
        { header: 'NAMA LENGKAP', accessor: 'namaLengkap' as const },
        { header: 'TANGGAL PENGAJUAN', accessor: 'tanggalPengajuan' as const },
        {
            header: 'STATUS',
            render: (row: any) => (
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
        { header: 'KADER', accessor: 'kader' as keyof RelawanData },
        { header: 'JABATAN', accessor: 'jabatan' as keyof RelawanData },
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
            penugasan: relawan.penugasan,
            jenisKelamin: (relawan.jenisKelamin as 'L' | 'P') || 'L',
            assignments: relawan.assignments || []
        });
        setIsDetailModalOpen(true);
    };

    const handleReviewClick = (rawPengajuan: PengajuanAPIData) => {
        setSelectedPengajuan(rawPengajuan);
        setVerificationNote('');
        setIsDataChecked(false);
        setIsReviewModalOpen(true);
    };

    const handleReview = async (status: 'Disetujui' | 'Ditolak') => {
        if (!selectedPengajuan) return;
        setIsReviewing(true);
        try {
            const res = await apiFetch(`/admin/relawan/pengajuan/${selectedPengajuan.pengajuan_id}/review`, {
                method: 'POST',
                body: JSON.stringify({ status, catatan_verifikator: verificationNote })
            });
            const result = await res.json();
            if (result.success) {
                setToast({ message: result.message, type: 'success' });
                setIsReviewModalOpen(false);
                fetchPengajuan();
            } else {
                setToast({ message: result.message || 'Gagal memproses pengajuan', type: 'error' });
            }
        } catch {
            setToast({ message: 'Tidak dapat terhubung ke server', type: 'error' });
        } finally {
            setIsReviewing(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.namaRelawan || !formData.nik) return;
        setIsSaving(true);
        try {
            const res = await apiFetch('/admin/relawan/bulk', {
                method: 'POST',
                body: JSON.stringify([{
                    namaLengkap: formData.namaRelawan,
                    nik: formData.nik,
                    jenis_kelamin: formData.jenisKelamin,
                    alamat_ktp: formData.alamat,
                    kelurahan: formData.kelurahan,
                    kader: formData.kader,
                    jabatan: formData.jabatan,
                    penugasan: formData.penugasan,
                    detail_penugasan: formData.detail_penugasan // ✨ Dikirim ke backend
                }])
            });
            // Cek HTTP status sebelum parse JSON
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                setToast({ message: errData.message || `Server error: ${res.status} ${res.statusText}`, type: 'error' });
                return;
            }
            const result = await res.json();
            if (result.success) {
                setToast({ message: result.message, type: 'success' });
                setIsModalOpen(false);
                setFormData(prev => ({ ...prev, namaRelawan: '', nik: '', jenisKelamin: 'L', alamat: '', kelurahan: '', kader: '', jabatan: '', penugasan: '', detail_penugasan: '' }));
                fetchRelawan();
            } else {
                setToast({ message: result.message || 'Gagal menambahkan relawan', type: 'error' });
            }
        } catch (err: any) {
            // Network error (bukan HTTP error) - tampilkan pesan yang informatif
            setToast({ message: `Koneksi gagal: ${err?.message || 'unknown error'}`, type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleExcelUploadConfirm = async (data: any[]) => {
        try {
            const res = await apiFetch('/admin/relawan/bulk', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (result.success) {
                setToast({ message: result.message, type: 'success' });
                fetchRelawan();
            } else {
                setToast({ message: result.message || 'Gagal import Excel', type: 'error' });
            }
        } catch {
            setToast({ message: 'Tidak dapat terhubung ke server', type: 'error' });
        } finally {
            setIsUploadModalOpen(false);
        }
    };

    const pengajuanActions = (row: any) => (
        row.status === 'Menunggu Review' ? (
            <Button variant="secondary" size="sm" onClick={() => handleReviewClick(row._raw)}>Review</Button>
        ) : null
    );

    const relawanActions = (row: RelawanData) => (
        <Button variant="secondary" size="sm" onClick={() => handleDetailClick(row)}>Detail</Button>
    );
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
                    detail: '',
                    statusKeaktifan: 'Aktif' as 'Aktif' | 'Nonaktif',
                    nomorSK: '',
                    skId: ''
                }
            ]
        }));
    };

    const handleRemoveAssignment = (index: number) => {
        setFormData(prev => ({
            ...prev,
            assignments: prev.assignments.filter((_, i) => i !== index)
        }));
    };

    const handleAssignmentChange = (index: number, field: string, value: string) => {
        setFormData(prev => {
            const newAssignments = [...prev.assignments];
            newAssignments[index] = { ...newAssignments[index], [field]: value };
            return { ...prev, assignments: newAssignments };
        });
    };

    const handleDetailAssignmentChange = (_index: number, _field: string, _value: string) => {
        // Readonly helper untuk detail - tidak akan terpanggil karena disabled=true
    };

    const renderAssignmentFields = (
        assignment: any, 
        index: number, 
        isReadOnly: boolean,
        context: 'form' | 'detail' = 'form'
    ) => {
        const handleAssignChange = context === 'form' ? handleAssignmentChange : handleDetailAssignmentChange;
        
        return (
        <div key={assignment.id} className="relative bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4 space-y-4">
            {!isReadOnly && formData.assignments.length > 1 && (
                <div className="flex justify-end -mt-2 -mr-2 mb-2">
                    <button
                        type="button"
                        onClick={() => handleRemoveAssignment(index)}
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                        title="Hapus Penugasan"
                    >
                        <X size={20} />
                    </button>
                </div>
            )}
            
            <div className="grid grid-cols-3 gap-4 items-start">
                <label className="text-lg font-medium text-gray-900 pt-2">OPD</label>
                <div className="col-span-2">
                    <AutocompleteInput
                        name={`opd-${index}`}
                        value={assignment.opd}
                        options={opdOptions}
                        onChange={(val) => handleAssignChange(index, 'opd', val)}
                        placeholder="Cari nama OPD..."
                        disabled={isReadOnly}
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 items-start">
                <label className="text-lg font-medium text-gray-900 pt-2">Kader / kader</label>
                <div className="col-span-2">
                    <AutocompleteInput
                        name={`kader-${index}`}
                        value={assignment.kader}
                        options={kaderOptions}
                        onChange={(val) => handleAssignChange(index, 'kader', val)}
                        placeholder="Cari nama Kader / kader..."
                        disabled={isReadOnly}
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-lg font-medium text-gray-900">Peran/Jabatan</label>
                <input
                    type="text"
                    value={assignment.peran}
                    onChange={(e) => handleAssignChange(index, 'peran', e.target.value)}
                    placeholder="Contoh: Ketua, Anggota, dll"
                    disabled={isReadOnly}
                    className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                />
            </div>

            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-lg font-medium text-gray-900">Penugasan</label>
                <input
                    type="text"
                    value={assignment.detail}
                    onChange={(e) => handleAssignChange(index, 'detail', e.target.value)}
                    placeholder="Detail Penugasan (Opsional)"
                    disabled={isReadOnly}
                    className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                />
            </div>

            <div className="grid grid-cols-3 gap-4 items-center mt-2">
                <label className="text-lg font-medium text-gray-900">Status Keaktifan</label>
                <div className="col-span-2 flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name={`statusKeaktifan-${index}`}
                            value="Aktif"
                            checked={assignment.statusKeaktifan === 'Aktif'}
                            onChange={(e) => handleAssignChange(index, 'statusKeaktifan', e.target.value)}
                            disabled={isReadOnly}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-gray-700">Aktif</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name={`statusKeaktifan-${index}`}
                            value="Nonaktif"
                            checked={assignment.statusKeaktifan === 'Nonaktif'}
                            onChange={(e) => handleAssignChange(index, 'statusKeaktifan', e.target.value)}
                            disabled={isReadOnly}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
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
            <div className="flex justify-between items-center">
                <div className="flex gap-3">
                    <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                        <Plus size={18} />
                        Tambah Relawan
                    </Button>
                    <Button variant="outline" onClick={() => setIsUploadModalOpen(true)}>
                        <Upload size={18} />
                        Unggah dari Excel
                    </Button>
                </div>
                <SearchInput
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="w-64"
                />
            </div>
            {/* Pengajuan Perubahan Data */}
            <Card title="Pengajuan Perubahan Data">
                {isLoadingPengajuan ? (
                    <div className="flex items-center justify-center h-32">
                        <Loader2 size={24} className="animate-spin text-gray-400" />
                        <span className="ml-3 text-gray-500">Memuat data pengajuan...</span>
                    </div>
                ) : (
                    <Table columns={pengajuanColumns} data={pengajuanUIData} actions={pengajuanActions} minRows={3} />
                )}
            </Card>

            {/* Daftar Relawan */}
            <Card>
                <div className="mb-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">Daftar Relawan</h2>                    
                </div>

                {isLoadingRelawan ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 size={28} className="animate-spin text-gray-400" />
                        <span className="ml-3 text-gray-500">Memuat data relawan...</span>
                    </div>
                ) : (
                    <Table columns={relawanColumns} data={currentRelawanData} actions={relawanActions} minRows={5} />
                )}

                {/* Pagination */}
                {!isLoadingRelawan && filteredRelawanData.length > 0 && (
                    <div className="mt-4 flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                            Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredRelawanData.length)} dari {filteredRelawanData.length} Relawan
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="disabled:opacity-50 disabled:cursor-not-allowed">
                                <ChevronLeft size={16} /> Sebelumnya
                            </Button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <Button key={page} variant={currentPage === page ? "primary" : "outline"} size="sm" onClick={() => handlePageChange(page)} className="min-w-[40px]">
                                    {page}
                                </Button>
                            ))}
                            <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="disabled:opacity-50 disabled:cursor-not-allowed">
                                Selanjutnya <ChevronRight size={16} />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Modal Tambah Relawan */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Relawan Baru" subtitle="Isi data relawan yang ingin ditambahkan" maxWidth="2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Fields input teks biasa */}
                    {[
                        { label: 'Nama Relawan', name: 'namaRelawan', required: true, placeholder: 'Nama Lengkap Relawan' },
                        { label: 'NIK', name: 'nik', required: true, placeholder: '16 digit NIK', maxLength: 16 }, // Sudah ditambahkan batasan digit di sini
                        { label: 'Alamat KTP', name: 'alamat', placeholder: 'Alamat sesuai KTP' },
                        { label: 'Kelurahan', name: 'kelurahan', placeholder: 'Kelurahan/Desa' },
                        { label: 'Jabatan', name: 'jabatan', placeholder: 'Jabatan Relawan' },
                    ].map(field => (
                        <div key={field.name} className="grid grid-cols-3 gap-4 items-center">
                            <label className="text-lg font-medium text-gray-900">
                                {field.label}{field.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            <input
                                type="text"
                                name={field.name}
                                value={(formData as any)[field.name]}
                                onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                                placeholder={field.placeholder}
                                required={field.required}
                                maxLength={field.maxLength} // Ini mengaktifkan batasan digit di input
                                className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    ))}

                    {/* Fields input otomatis Multiple Assignments dirender disini */}

                    {/* Menghilangkan field penugasan redundan teks */}
                    {/* Field Jenis Kelamin (dropdown) */}
                    <div className="grid grid-cols-3 gap-4 items-center">
                        <label className="text-lg font-medium text-gray-900">
                            Jenis Kelamin <span className="text-red-500 ml-1">*</span>
                        </label>
                        <select
                            name="jenisKelamin"
                            value={formData.jenisKelamin}
                            onChange={(e) => setFormData(prev => ({ ...prev, jenisKelamin: e.target.value as 'L' | 'P' }))}
                            required
                            className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="L">Laki-laki (L)</option>
                            <option value="P">Perempuan (P)</option>
                        </select>
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

            {/* Modal Detail Relawan */}
            <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Detail Relawan" subtitle="Informasi lengkap relawan" maxWidth="2xl">
                {selectedRelawan && (
                    <div className="space-y-6">
                        {/* Fields input teks biasa (readOnly) */}
                        {[
                            { label: 'Nama Relawan', name: 'namaRelawan', value: detailFormData.namaRelawan },
                            { label: 'NIK', name: 'nik', value: detailFormData.nik },
                            { label: 'Alamat KTP', name: 'alamat', value: detailFormData.alamat },
                            { label: 'Kelurahan', name: 'kelurahan', value: detailFormData.kelurahan },
                            { label: 'Jabatan', name: 'jabatan', value: detailFormData.jabatan },
                        ].map(field => (
                            <div key={field.name} className="grid grid-cols-3 gap-4 items-center">
                                <label className="text-lg font-medium text-gray-900">{field.label}</label>
                                <input
                                    type="text"
                                    value={field.value}
                                    onChange={(e) => setDetailFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                                    readOnly
                                    className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none"
                                />
                            </div>
                        ))}

                        {/* Field Jenis Kelamin (dropdown - disabled) */}
                        <div className="grid grid-cols-3 gap-4 items-center">
                            <label className="text-lg font-medium text-gray-900">
                                Jenis Kelamin
                            </label>
                            <select
                                name="jenisKelamin"
                                value={detailFormData.jenisKelamin}
                                onChange={(e) => setDetailFormData(prev => ({ ...prev, jenisKelamin: e.target.value as 'L' | 'P' }))}
                                disabled
                                className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none bg-gray-50 text-gray-500 cursor-not-allowed"
                            >
                                <option value="L">Laki-laki (L)</option>
                                <option value="P">Perempuan (P)</option>
                            </select>
                        </div>

                        {/* Riwayat Penugasan Render Mirip Dengan Tambah form */}
                        <div className="pt-4 border-t border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Daftar Penugasan:</h3>
                            {detailFormData.assignments && detailFormData.assignments.length > 0 ? (
                                detailFormData.assignments.map((assignment, index) =>
                                    renderAssignmentFields(assignment, index, true, 'detail')
                                )
                            ) : (
                                <div className="text-center text-gray-500 italic py-4">Belum ada penugasan terdaftar.</div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal Review Pengajuan */}
            <Modal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} title="Review Pengajuan Perubahan Data" maxWidth="2xl">
                {selectedPengajuan && (
                    <div className="space-y-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                            <p className="text-sm font-medium text-blue-800">Informasi Pengajuan</p>
                            <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
                                <span className="font-medium">NIK:</span><span>{selectedPengajuan.nik}</span>
                                <span className="font-medium">Nama:</span><span>{selectedPengajuan.nama_lengkap}</span>
                                <span className="font-medium">Jenis Perubahan:</span><span>{selectedPengajuan.jenis_perubahan}</span>
                                <span className="font-medium">Catatan Relawan:</span><span>{selectedPengajuan.catatan_relawan || '-'}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
                            <input type="checkbox" id="dataChecked" checked={isDataChecked} onChange={(e) => setIsDataChecked(e.target.checked)} className="w-4 h-4 text-blue-600" />
                            <label htmlFor="dataChecked" className="text-sm text-gray-700">
                                Saya telah memverifikasi kebenaran data yang diajukan
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Catatan Verifikator (opsional)</label>
                            <textarea
                                value={verificationNote}
                                onChange={(e) => setVerificationNote(e.target.value)}
                                placeholder="Tuliskan catatan untuk relawan..."
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                            <Button onClick={() => setIsReviewModalOpen(false)} className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-6">Batal</Button>
                            <Button onClick={() => handleReview('Ditolak')} disabled={!isDataChecked || isReviewing} className="bg-red-600 hover:bg-red-700 text-white px-6 disabled:opacity-50 disabled:cursor-not-allowed">
                                {isReviewing ? <Loader2 size={16} className="animate-spin" /> : 'Tolak'}
                            </Button>
                            <Button onClick={() => handleReview('Disetujui')} disabled={!isDataChecked || isReviewing} className="bg-green-600 hover:bg-green-700 text-white px-6 disabled:opacity-50 disabled:cursor-not-allowed">
                                {isReviewing ? <Loader2 size={16} className="animate-spin" /> : 'Setujui'}
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

            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default DataRelawan;
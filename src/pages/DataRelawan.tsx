import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, Upload, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
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
    nama_komunitas: string | null;   // dari join ke komunitas
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
    kader: r.nama_komunitas || '-',
    jabatan: r.status_penugasan || '-',
    penugasan: r.nama_opd || r.penugasan || '-',  // nama OPD dari join, atau teks penugasan dari penugasan_relawan
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
    const [komunitasOptions, setKomunitasOptions] = useState<AutoOption[]>([]);

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

    // Fetch OPD & Komunitas untuk autocomplete
    useEffect(() => {
        fetchRelawan();
        fetchPengajuan();

        // Fetch OPD options
        apiFetch('/opd').then(r => r.json()).then(result => {
            if (result.success) {
                setOpdOptions(result.data.map((o: any) => ({ label: o.nama_opd, value: o.nama_opd })));
            }
        }).catch(() => { });

        // Fetch Komunitas options
        apiFetch('/komunitas').then(r => r.json()).then(result => {
            if (result.success) {
                setKomunitasOptions(result.data.map((k: any) => ({ label: k.nama_komunitas, value: k.nama_komunitas })));
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

                    {/* Field Penugasan (OPD) - Autocomplete */}
                    <div className="grid grid-cols-3 gap-4 items-start">
                        <label className="text-lg font-medium text-gray-900 pt-2">OPD</label>
                        <div className="col-span-2">
                            <AutocompleteInput
                                name="penugasan"
                                value={formData.penugasan}
                                options={opdOptions}
                                onChange={(val) => setFormData(prev => ({ ...prev, penugasan: val }))}
                                placeholder="Cari nama OPD..."
                                warnMessage="OPD ini belum terdaftar di database. Silakan tambahkan di Manajemen OPD terlebih dahulu."
                            />
                        </div>
                    </div>

                    {/* Field Kader/Komunitas - Autocomplete */}
                    <div className="grid grid-cols-3 gap-4 items-start">
                        <label className="text-lg font-medium text-gray-900 pt-2">Kader / Komunitas</label>
                        <div className="col-span-2">
                            <AutocompleteInput
                                name="kader"
                                value={formData.kader}
                                options={komunitasOptions}
                                onChange={(val) => setFormData(prev => ({ ...prev, kader: val }))}
                                placeholder="Cari nama Kader / Komunitas..."
                                warnMessage="Kader ini belum terdaftar di database. Silakan tambahkan di Daftar Kader terlebih dahulu."
                            />
                        </div>
                    </div>

                    {/* ✨ Field Text Penugasan✨ */}
                    <div className="grid grid-cols-3 gap-4 items-center">
                        <label className="text-lg font-medium text-gray-900">Penugasan</label>
                        <input
                            type="text"
                            name="detail_penugasan"
                            value={formData.detail_penugasan}
                            onChange={(e) => setFormData(prev => ({ ...prev, detail_penugasan: e.target.value }))}
                            placeholder="Detail Penugasan"
                            className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

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

                    <div className="flex justify-between pt-6">
                        <Button type="button" onClick={() => setIsModalOpen(false)} className="bg-red-600 hover:bg-red-700 text-white px-8">Batal</Button>
                        <Button type="submit" disabled={isSaving} className="bg-green-600 hover:bg-green-700 text-white px-8 disabled:opacity-70">
                            {isSaving ? <><Loader2 size={16} className="animate-spin mr-1" />Menyimpan...</> : 'Simpan'
                            }
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal Detail Relawan */}
            <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Detail Relawan" subtitle="Informasi lengkap relawan" maxWidth="2xl">
                {selectedRelawan && (
                    <div className="space-y-6">
                        {[
                            { label: 'Nama Relawan', name: 'namaRelawan', value: detailFormData.namaRelawan },
                            { label: 'NIK', name: 'nik', value: detailFormData.nik },
                            { label: 'Alamat', name: 'alamat', value: detailFormData.alamat },
                            { label: 'Kelurahan', name: 'kelurahan', value: detailFormData.kelurahan },
                            { label: 'Kader', name: 'kader', value: detailFormData.kader },
                            { label: 'Jabatan', name: 'jabatan', value: detailFormData.jabatan },
                            { label: 'Penugasan', name: 'penugasan', value: detailFormData.penugasan },
                        ].map(field => (
                            <div key={field.name} className="grid grid-cols-3 gap-4 items-center">
                                <label className="text-lg font-medium text-gray-900">{field.label}</label>
                                <input
                                    type="text"
                                    value={field.value}
                                    onChange={(e) => setDetailFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                                    className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        ))}

                        {/* Riwayat Penugasan */}
                        {detailFormData.assignments && detailFormData.assignments.length > 0 && (
                            <div className="pt-4 border-t border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3">Riwayat Penugasan</h3>
                                <div className="space-y-2">
                                    {detailFormData.assignments.map((assignment) => (
                                        <div key={assignment.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                            <div>
                                                <p className="font-medium text-gray-800">{assignment.opd}</p>
                                                <p className="text-sm text-gray-500">Kader: {assignment.kader} · Peran: {assignment.peran} · SK: {assignment.nomorSK}</p>
                                            </div>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${assignment.statusKeaktifan === 'Aktif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                                {assignment.statusKeaktifan}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
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
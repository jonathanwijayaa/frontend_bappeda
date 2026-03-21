//DaftarKader.tsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, FileDown, Loader2, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { SearchInput } from '../components/ui/Input';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import AutocompleteInput from '../components/ui/AutocompleteInput';
import Toast, { ToastType } from '../components/ui/Toast';
import UploadExcelModal from '../components/ui/UploadExcelModal';
import { exportToPDF } from '../utils/exportToPDF';
import { apiFetch } from '../utils/api';

interface kaderData {
    kader_id: number;
    nama_kader: string;
    deskripsi: string | null;
    pic: string | null;
    nama_opd: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface OPDOption {
    opd_id: number;
    nama_opd: string;
}

// Tipe untuk AutocompleteInput
interface AutoOption {
    label: string;
    value: string;
}

const DaftarKader: React.FC = () => {
    const [kaderList, setkaderList] = useState<kaderData[]>([]);
    const [opdList, setOpdList] = useState<OPDOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
    const [selectedkader, setSelectedkader] = useState<kaderData | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const itemsPerPage = 5;

    // Form state: simpan nama OPD (untuk autocomplete) dan opd_id (untuk submit)
    const [formData, setFormData] = useState({
        opd_name: '',   // teks yang tampil di autocomplete
        opd_id: 0,      // id yang akan dikirim ke backend
        nama_kader: '',
        deskripsi: '',
        pic: '',
        nik_pic: ''
    });

    const [detailFormData, setDetailFormData] = useState({
        nama_kader: '',
        deskripsi: '',
        pic: '',
        nik_pic: ''
    });

    // Konversi opdList ke format AutocompleteInput options
    const opdOptions: AutoOption[] = useMemo(() =>
        opdList.map(o => ({ label: o.nama_opd, value: String(o.opd_id) })),
        [opdList]
    );

    const hasChanges = useMemo(() => {
        if (!selectedkader) return false;
        return (
            detailFormData.nama_kader !== (selectedkader.nama_kader || '') ||
            detailFormData.deskripsi !== (selectedkader.deskripsi || '') ||
            detailFormData.pic !== (selectedkader.pic || '') ||
            detailFormData.nik_pic !== ((selectedkader as any).nik_pic || '')
        );
    }, [selectedkader, detailFormData]);

    // ── Fetch Data ─────────────────────────────
    const fetchkader = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await apiFetch('/kader');
            const result = await res.json();
            if (result.success) {
                setkaderList(result.data);
            } else {
                setToast({ message: result.message || 'Gagal memuat data kader', type: 'error' });
            }
        } catch {
            setToast({ message: 'Tidak dapat terhubung ke server', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchOPD = useCallback(async () => {
        try {
            const res = await apiFetch('/opd');
            const result = await res.json();
            if (result.success) {
                setOpdList(result.data.map((o: any) => ({ opd_id: o.opd_id, nama_opd: o.nama_opd })));
            }
        } catch {
            console.error('Gagal mengambil daftar OPD untuk dropdown');
        }
    }, []);

    useEffect(() => {
        fetchkader();
        fetchOPD();
    }, [fetchkader, fetchOPD]);

    // ── Handler AutocompleteInput OPD ───────────
    const handleOpdChange = (namaOpd: string) => {
        // Cari opd_id yang cocok dengan nama yang diketik
        const matched = opdList.find(o => o.nama_opd.toLowerCase() === namaOpd.toLowerCase());
        setFormData(prev => ({
            ...prev,
            opd_name: namaOpd,
            opd_id: matched ? matched.opd_id : 0
        }));
    };

    // ── Pagination & Filter ─────────────────────
    const filteredData = useMemo(() =>
        kaderList.filter(k =>
            k.nama_kader.toLowerCase().includes(searchTerm.toLowerCase()) ||
            k.nama_opd.toLowerCase().includes(searchTerm.toLowerCase())
        ), [kaderList, searchTerm]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    const columns = [
        { header: 'NAMA KADER/kader', accessor: 'nama_kader' as keyof kaderData },
        {
            header: 'STATUS',
            render: (row: kaderData) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {row.is_active ? 'Aktif' : 'Tidak Aktif'}
                </span>
            )
        },
        { header: 'OPD', accessor: 'nama_opd' as keyof kaderData },
        { header: 'PIC', render: (row: kaderData) => <span>{row.pic || '-'}</span> },
        {
            header: 'DESKRIPSI', render: (row: kaderData) => (
                <span className="truncate max-w-[200px] block" title={row.deskripsi || ''}>{row.deskripsi || '-'}</span>
            )
        },
    ];

    const handleDetailClick = (kader: kaderData) => {
        setSelectedkader(kader);
        setDetailFormData({
            nama_kader: kader.nama_kader,
            deskripsi: kader.deskripsi || '',
            pic: kader.pic || '',
            nik_pic: (kader as any).nik_pic || ''
        });
        setIsDetailModalOpen(true);
    };

    const handleToggleStatus = (kader: kaderData) => {
        setSelectedkader(kader);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmToggleStatus = async () => {
        if (!selectedkader) return;
        try {
            const res = await apiFetch(`/kader/${selectedkader.kader_id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ is_active: !selectedkader.is_active })
            });
            const result = await res.json();
            if (result.success) {
                setToast({ message: result.message, type: 'success' });
                fetchkader();
            } else {
                setToast({ message: result.message || 'Gagal mengubah status', type: 'error' });
            }
        } catch {
            setToast({ message: 'Tidak dapat terhubung ke server', type: 'error' });
        } finally {
            setIsConfirmModalOpen(false);
            setSelectedkader(null);
        }
    };

    const actions = (row: kaderData) => (
        <>
            <Button variant="secondary" size="sm" onClick={() => handleDetailClick(row)}>Detail</Button>
            <Button variant="secondary" size="sm" onClick={() => handleToggleStatus(row)}>
                {row.is_active ? 'Nonaktif' : 'Aktifkan'}
            </Button>
        </>
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validasi OPD harus dipilih dari daftar yang valid
        if (!formData.opd_id) {
            setToast({ message: 'Pilih OPD yang valid dari daftar', type: 'error' });
            return;
        }
        if (!formData.nama_kader) return;

        setIsSaving(true);
        try {
            const res = await apiFetch('/kader', {
                method: 'POST',
                body: JSON.stringify({
                    opd_id: formData.opd_id,
                    nama_kader: formData.nama_kader,
                    deskripsi: formData.deskripsi || null,
                    pic: formData.pic || null,
                    nik_pic: formData.nik_pic || null
                })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                setToast({ message: errData.message || `Server error: ${res.status}`, type: 'error' });
                return;
            }

            const result = await res.json();
            if (result.success) {
                setToast({ message: result.message, type: 'success' });
                setIsModalOpen(false);
                // Reset form termasuk opd autocomplete
                setFormData({ opd_name: '', opd_id: 0, nama_kader: '', deskripsi: '', pic: '', nik_pic: '' });
                fetchkader();
            } else {
                setToast({ message: result.message || 'Gagal menambahkan kader', type: 'error' });
            }
        } catch (err: any) {
            setToast({ message: `Koneksi gagal: ${err?.message || 'unknown error'}`, type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDetailSave = async () => {
        if (!selectedkader) return;
        setIsSaving(true);
        try {
            const res = await apiFetch(`/kader/${selectedkader.kader_id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    nama_kader: detailFormData.nama_kader,
                    deskripsi: detailFormData.deskripsi || null,
                    pic: detailFormData.pic || null,
                    nik_pic: detailFormData.nik_pic || null
                })
            });
            const result = await res.json();
            if (result.success) {
                setToast({ message: result.message, type: 'success' });
                setIsDetailModalOpen(false);
                fetchkader();
            } else {
                setToast({ message: result.message || 'Gagal memperbarui data', type: 'error' });
            }
        } catch {
            setToast({ message: 'Tidak dapat terhubung ke server', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            exportToPDF({
                title: 'Daftar Kader',
                columns: [
                    { header: 'NAMA KADER', dataKey: 'nama_kader' },
                    { header: 'OPD', dataKey: 'nama_opd' },
                    { header: 'PIC', dataKey: 'pic' },
                    { header: 'DESKRIPSI', dataKey: 'deskripsi' }
                ],
                data: filteredData.map(k => ({ ...k, pic: k.pic || '-', deskripsi: k.deskripsi || '-' })),
                filename: `daftar-kader-${new Date().toISOString().split('T')[0]}.pdf`
            });
            setToast({ message: 'Data berhasil diekspor ke PDF', type: 'success' });
        } catch {
            setToast({ message: 'Gagal mengekspor data', type: 'error' });
        } finally {
            setIsExporting(false);
        }
    };

    const handleExcelUploadConfirm = async (data: any[]) => {
        try {
            const res = await apiFetch('/kader/bulk', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (result.success) {
                setToast({ message: result.message, type: 'success' });
                fetchkader();
            } else {
                setToast({ message: result.message || 'Gagal import Excel', type: 'error' });
            }
        } catch {
            setToast({ message: 'Tidak dapat terhubung ke server', type: 'error' });
        } finally {
            setIsUploadModalOpen(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex justify-between items-center">
                <div className="flex gap-3">
                    <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                        <Plus size={18} />
                        Tambah Kader Baru
                    </Button>
                    <Button variant="outline" onClick={() => setIsUploadModalOpen(true)}>
                        <Upload size={18} />
                        Unggah dari Excel
                    </Button>
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
                    <h2 className="text-xl font-semibold text-gray-900">Daftar Kader</h2>
                    <Button variant="secondary" size="sm" onClick={handleExportPDF} disabled={isExporting}>
                        {isExporting ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
                        {isExporting ? 'Mengekspor...' : 'Ekspor'}
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 size={28} className="animate-spin text-gray-400" />
                        <span className="ml-3 text-gray-500">Memuat data kader...</span>
                    </div>
                ) : (
                    <Table columns={columns} data={currentData} actions={actions} minRows={5} />
                )}

                {/* Pagination */}
                {!isLoading && filteredData.length > 0 && (
                    <div className="mt-4 flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                            Menampilkan {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredData.length)} dari {filteredData.length} Kader
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="disabled:opacity-50 disabled:cursor-not-allowed">
                                <ChevronLeft size={16} /> Sebelumnya
                            </Button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <Button key={page} variant={currentPage === page ? "primary" : "outline"} size="sm" onClick={() => setCurrentPage(page)} className="min-w-[40px]">
                                    {page}
                                </Button>
                            ))}
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="disabled:opacity-50 disabled:cursor-not-allowed">
                                Selanjutnya <ChevronRight size={16} />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Modal Tambah Kader */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Kader Baru" subtitle="Pilih OPD terlebih dahulu, lalu isi detail kader" maxWidth="2xl">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* ── Pilih OPD — AutocompleteInput ── */}
                    <div className="grid grid-cols-3 gap-4 items-start">
                        <label className="text-lg font-medium text-gray-900 pt-2">
                            Pilih OPD <span className="text-red-500">*</span>
                        </label>
                        <div className="col-span-2">
                            <AutocompleteInput
                                name="opd_name"
                                value={formData.opd_name}
                                options={opdOptions}
                                onChange={handleOpdChange}
                                placeholder="Ketik nama OPD..."
                                warnIfNotFound={true}
                                warnMessage="OPD tidak ditemukan. Pastikan nama OPD sudah benar."
                            />
                            {/* Indikator OPD berhasil dipilih */}
                            {formData.opd_id > 0 && (
                                <p className="mt-1 text-xs text-green-600 font-medium">
                                    ✓ OPD ditemukan dan siap disimpan
                                </p>
                            )}
                        </div>
                    </div>

                    {/* ── Field Lainnya ── */}
                    {[
                        { label: 'Nama Kader/kader', name: 'nama_kader', required: true, placeholder: 'Nama Kader atau kader' },
                        { label: 'PIC', name: 'pic', required: false, placeholder: 'Person in Charge (opsional)' },
                        { label: 'NIK PIC', name: 'nik_pic', required: true, placeholder: '16 digit NIK PIC', maxLength: 16 },
                        { label: 'Deskripsi', name: 'deskripsi', required: false, placeholder: 'Deskripsi singkat (opsional)' },
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
                                maxLength={(field as any).maxLength}
                                className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    ))}

                    <div className="flex justify-between pt-6">
                        <Button type="button" onClick={() => setIsModalOpen(false)} className="bg-red-600 hover:bg-red-700 text-white px-8">Batal</Button>
                        <Button type="submit" disabled={isSaving} className="bg-green-600 hover:bg-green-700 text-white px-8 disabled:opacity-70">
                            {isSaving ? <><Loader2 size={16} className="animate-spin mr-1" />Menyimpan...</> : 'Simpan'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Detail Modal */}
            <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Detail Kader" subtitle="Edit informasi kader" maxWidth="2xl">
                {selectedkader && (
                    <div className="space-y-6">
                        {/* OPD (read-only) */}
                        <div className="grid grid-cols-3 gap-4 items-center">
                            <label className="text-lg font-medium text-gray-900">OPD</label>
                            <input type="text" value={selectedkader.nama_opd} disabled className="col-span-2 px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 italic" />
                        </div>

                        {[
                            { label: 'Nama Kader/kader', name: 'nama_kader' },
                            { label: 'PIC', name: 'pic' },
                            { label: 'NIK PIC', name: 'nik_pic', required: true, maxLength: 16 },
                            { label: 'Deskripsi', name: 'deskripsi' },
                        ].map(field => (
                            <div key={field.name} className="grid grid-cols-3 gap-4 items-center">
                                <label className="text-lg font-medium text-gray-900">
                                    {field.label}{(field as any).required && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                <input
                                    type="text"
                                    value={(detailFormData as any)[field.name]}
                                    onChange={(e) => setDetailFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                                    maxLength={(field as any).maxLength}
                                    className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        ))}

                        <div className="flex justify-between pt-6 border-t border-gray-100">
                            <div className="text-sm text-gray-400 italic">
                                Dibuat: {new Date(selectedkader.created_at).toLocaleString('id-ID')}
                            </div>
                            <Button onClick={handleDetailSave} disabled={!hasChanges || isSaving} className="bg-green-600 hover:bg-green-700 text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed">
                                {isSaving ? <><Loader2 size={16} className="animate-spin mr-1" />Menyimpan...</> : 'Simpan Perubahan'}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Confirmation Modal */}
            <Modal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                title="Konfirmasi"
                subtitle={selectedkader?.is_active ? "Apakah Anda yakin ingin menonaktifkan kader ini?" : "Apakah Anda yakin ingin mengaktifkan kader ini?"}
                maxWidth="md"
                showCloseButton={false}
            >
                {selectedkader && (
                    <div className="space-y-6">
                        <div className="text-center py-4">
                            <p className="text-lg text-gray-700">
                                Anda akan {selectedkader.is_active ? 'menonaktifkan' : 'mengaktifkan'}{' '}
                                <span className="font-semibold">{selectedkader.nama_kader}</span>
                            </p>
                        </div>
                        <div className="flex justify-center gap-4 pt-6">
                            <Button type="button" onClick={() => setIsConfirmModalOpen(false)} className="bg-gray-500 hover:bg-gray-600 text-white px-8">Batal</Button>
                            <Button type="button" onClick={handleConfirmToggleStatus} className="bg-red-600 hover:bg-red-700 text-white px-8">Lanjutkan</Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Upload Excel Modal */}
            <UploadExcelModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onConfirm={handleExcelUploadConfirm}
                title="Unggah Data Kader"
                templateName="Data Kader"
                dataType="kader"
            />

            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default DaftarKader;
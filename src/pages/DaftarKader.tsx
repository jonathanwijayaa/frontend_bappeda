import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, FileDown, Loader2, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { SearchInput } from '../components/ui/Input';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import Toast, { ToastType } from '../components/ui/Toast';
import UploadExcelModal from '../components/ui/UploadExcelModal';
import { exportToPDF } from '../utils/exportToPDF';
import { apiFetch } from '../utils/api';

// Interface sesuai response backend
interface KomunitasData {
    komunitas_id: number;
    nama_komunitas: string;
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

const DaftarKader: React.FC = () => {
    const [komunitasList, setKomunitasList] = useState<KomunitasData[]>([]);
    const [opdList, setOpdList] = useState<OPDOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
    const [selectedKomunitas, setSelectedKomunitas] = useState<KomunitasData | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const itemsPerPage = 5;

    const [formData, setFormData] = useState({
        opd_id: '',
        nama_komunitas: '',
        deskripsi: '',
        pic: ''
    });

    const [detailFormData, setDetailFormData] = useState({
        nama_komunitas: '',
        deskripsi: '',
        pic: ''
    });

    const hasChanges = useMemo(() => {
        if (!selectedKomunitas) return false;
        return (
            detailFormData.nama_komunitas !== (selectedKomunitas.nama_komunitas || '') ||
            detailFormData.deskripsi !== (selectedKomunitas.deskripsi || '') ||
            detailFormData.pic !== (selectedKomunitas.pic || '')
        );
    }, [selectedKomunitas, detailFormData]);

    // ── Fetch Data ─────────────────────────────
    const fetchKomunitas = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await apiFetch('/komunitas');
            const result = await res.json();
            if (result.success) {
                setKomunitasList(result.data);
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
        fetchKomunitas();
        fetchOPD();
    }, [fetchKomunitas, fetchOPD]);

    // ── Pagination & Filter ─────────────────────
    const filteredData = useMemo(() =>
        komunitasList.filter(k =>
            k.nama_komunitas.toLowerCase().includes(searchTerm.toLowerCase()) ||
            k.nama_opd.toLowerCase().includes(searchTerm.toLowerCase())
        ), [komunitasList, searchTerm]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    const columns = [
        { header: 'NAMA KADER/KOMUNITAS', accessor: 'nama_komunitas' as keyof KomunitasData },
        {
            header: 'STATUS',
            render: (row: KomunitasData) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {row.is_active ? 'Aktif' : 'Tidak Aktif'}
                </span>
            )
        },
        { header: 'OPD', accessor: 'nama_opd' as keyof KomunitasData },
        { header: 'PIC', render: (row: KomunitasData) => <span>{row.pic || '-'}</span> },
        { header: 'DESKRIPSI', render: (row: KomunitasData) => (
            <span className="truncate max-w-[200px] block" title={row.deskripsi || ''}>{row.deskripsi || '-'}</span>
        )},
    ];

    const handleDetailClick = (kader: KomunitasData) => {
        setSelectedKomunitas(kader);
        setDetailFormData({
            nama_komunitas: kader.nama_komunitas,
            deskripsi: kader.deskripsi || '',
            pic: kader.pic || ''
        });
        setIsDetailModalOpen(true);
    };

    const handleToggleStatus = (kader: KomunitasData) => {
        setSelectedKomunitas(kader);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmToggleStatus = async () => {
        if (!selectedKomunitas) return;
        try {
            const res = await apiFetch(`/komunitas/${selectedKomunitas.komunitas_id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ is_active: !selectedKomunitas.is_active })
            });
            const result = await res.json();
            if (result.success) {
                setToast({ message: result.message, type: 'success' });
                fetchKomunitas();
            } else {
                setToast({ message: result.message || 'Gagal mengubah status', type: 'error' });
            }
        } catch {
            setToast({ message: 'Tidak dapat terhubung ke server', type: 'error' });
        } finally {
            setIsConfirmModalOpen(false);
            setSelectedKomunitas(null);
        }
    };

    const actions = (row: KomunitasData) => (
        <>
            <Button variant="secondary" size="sm" onClick={() => handleDetailClick(row)}>Detail</Button>
            <Button
                variant="secondary"
                size="sm"
                onClick={() => handleToggleStatus(row)}
            >
                {row.is_active ? 'Nonaktif' : 'Aktifkan'}
            </Button>
        </>
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.opd_id || !formData.nama_komunitas) return;
        setIsSaving(true);
        try {
            const res = await apiFetch('/komunitas', {
                method: 'POST',
                body: JSON.stringify({
                    opd_id: Number(formData.opd_id),
                    nama_komunitas: formData.nama_komunitas,
                    deskripsi: formData.deskripsi || null,
                    pic: formData.pic || null
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
                setFormData({ opd_id: '', nama_komunitas: '', deskripsi: '', pic: '' });
                fetchKomunitas();
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
        if (!selectedKomunitas) return;
        setIsSaving(true);
        try {
            const res = await apiFetch(`/komunitas/${selectedKomunitas.komunitas_id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    nama_komunitas: detailFormData.nama_komunitas,
                    deskripsi: detailFormData.deskripsi || null,
                    pic: detailFormData.pic || null
                })
            });
            const result = await res.json();
            if (result.success) {
                setToast({ message: result.message, type: 'success' });
                setIsDetailModalOpen(false);
                fetchKomunitas();
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
        try {
            setIsExporting(true);
            exportToPDF({
                title: 'Daftar Kader / Komunitas',
                columns: [
                    { header: 'NAMA KADER', dataKey: 'nama_komunitas' },
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
                const res = await apiFetch('/komunitas/bulk', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
                const result = await res.json();
                if (result.success) {
                    setToast({ message: result.message, type: 'success' });
                    fetchKomunitas();
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
                    <h2 className="text-xl font-semibold text-gray-900">Daftar Kader / Komunitas</h2>
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
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Kader / Komunitas Baru" subtitle="Pilih OPD terlebih dahulu, lalu isi detail kader" maxWidth="2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Dropdown OPD */}
                    <div className="grid grid-cols-3 gap-4 items-center">
                        <label className="text-lg font-medium text-gray-900">
                            Pilih OPD <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="opd_id"
                            value={formData.opd_id}
                            onChange={(e) => setFormData(prev => ({ ...prev, opd_id: e.target.value }))}
                            required
                            className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="">-- Pilih OPD --</option>
                            {opdList.map(opd => (
                                <option key={opd.opd_id} value={opd.opd_id}>{opd.nama_opd}</option>
                            ))}
                        </select>
                    </div>

                    {[
                        { label: 'Nama Kader/Komunitas', name: 'nama_komunitas', required: true, placeholder: 'Nama Kader atau Komunitas' },
                        { label: 'PIC', name: 'pic', required: false, placeholder: 'Person in Charge (opsional)' },
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
            <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Detail Kader / Komunitas" subtitle="Edit informasi kader" maxWidth="2xl">
                {selectedKomunitas && (
                    <div className="space-y-6">
                        {/* OPD (read-only) */}
                        <div className="grid grid-cols-3 gap-4 items-center">
                            <label className="text-lg font-medium text-gray-900">OPD</label>
                            <input type="text" value={selectedKomunitas.nama_opd} disabled className="col-span-2 px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 italic" />
                        </div>

                        {[
                            { label: 'Nama Kader/Komunitas', name: 'nama_komunitas' },
                            { label: 'PIC', name: 'pic' },
                            { label: 'Deskripsi', name: 'deskripsi' },
                        ].map(field => (
                            <div key={field.name} className="grid grid-cols-3 gap-4 items-center">
                                <label className="text-lg font-medium text-gray-900">{field.label}</label>
                                <input
                                    type="text"
                                    value={(detailFormData as any)[field.name]}
                                    onChange={(e) => setDetailFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                                    className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        ))}

                        <div className="flex justify-between pt-6 border-t border-gray-100">
                            <div className="text-sm text-gray-400 italic">
                                Dibuat: {new Date(selectedKomunitas.created_at).toLocaleString('id-ID')}
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
                subtitle={selectedKomunitas?.is_active ? "Apakah Anda yakin ingin menonaktifkan kader/komunitas ini?" : "Apakah Anda yakin ingin mengaktifkan kader/komunitas ini?"}
                maxWidth="md"
                showCloseButton={false}
            >
                {selectedKomunitas && (
                    <div className="space-y-6">
                        <div className="text-center py-4">
                            <p className="text-lg text-gray-700">
                                Anda akan {selectedKomunitas.is_active ? 'menonaktifkan' : 'mengaktifkan'}{' '}
                                <span className="font-semibold">{selectedKomunitas.nama_komunitas}</span>
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

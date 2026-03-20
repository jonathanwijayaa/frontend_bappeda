import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, FileDown, Upload, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { SearchInput } from '../components/ui/Input';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import UploadExcelModal from '../components/ui/UploadExcelModal';
import Toast, { ToastType } from '../components/ui/Toast';
import { exportToPDF } from '../utils/exportToPDF';
import { apiFetch } from '../utils/api';

// Interface sesuai response backend
interface OPDData {
    opd_id: number;
    nama_opd: string;
    alamat: string | null;
    pic: string | null;
    nik_pic: string | null;
    kontak: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

const ManajemenOPD: React.FC = () => {
    const [opdList, setOpdList] = useState<OPDData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
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
        nama_opd: '',
        alamat: '',
        pic: '',
        nik_pic: '',
        kontak: ''
    });

    const [detailFormData, setDetailFormData] = useState({
        nama_opd: '',
        alamat: '',
        pic: '',
        nik_pic: '',
        kontak: ''
    });

    const hasChanges = useMemo(() => {
        if (!selectedOPD) return false;
        return (
            detailFormData.nama_opd !== (selectedOPD.nama_opd || '') ||
            detailFormData.alamat !== (selectedOPD.alamat || '') ||
            detailFormData.pic !== (selectedOPD.pic || '') ||
            detailFormData.nik_pic !== (selectedOPD.nik_pic || '') ||
            detailFormData.kontak !== (selectedOPD.kontak || '')
        );
    }, [selectedOPD, detailFormData]);

    // ── Fetch Data ─────────────────────────────
    const fetchOPD = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await apiFetch('/opd');
            const result = await res.json();
            if (result.success) {
                setOpdList(result.data);
            } else {
                setToast({ message: result.message || 'Gagal memuat data OPD', type: 'error' });
            }
        } catch {
            setToast({ message: 'Tidak dapat terhubung ke server', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchOPD(); }, [fetchOPD]);

    // ── Pagination & Filter ─────────────────────
    const filteredData = useMemo(() =>
        opdList.filter(opd =>
            opd.nama_opd.toLowerCase().includes(searchTerm.toLowerCase())
        ), [opdList, searchTerm]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    // ── Columns ─────────────────────────────────
    const columns = [
        { header: 'NAMA OPD', accessor: 'nama_opd' as keyof OPDData },
        {
            header: 'STATUS',
            render: (row: OPDData) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {row.is_active ? 'Aktif' : 'Tidak Aktif'}
                </span>
            )
        },
        { header: 'ALAMAT', accessor: 'alamat' as keyof OPDData },
        { header: 'PIC', accessor: 'pic' as keyof OPDData },
        { header: 'KONTAK', accessor: 'kontak' as keyof OPDData },
    ];

    // ── Handlers ────────────────────────────────
    const handleDetailClick = (opd: OPDData) => {
        setSelectedOPD(opd);
        setDetailFormData({
            nama_opd: opd.nama_opd || '',
            alamat: opd.alamat || '',
            pic: opd.pic || '',
            nik_pic: opd.nik_pic || '',
            kontak: opd.kontak || ''
        });
        setIsDetailModalOpen(true);
    };

    const handleToggleStatus = (opd: OPDData) => {
        setSelectedOPD(opd);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmToggleStatus = async () => {
        if (!selectedOPD) return;
        try {
            const res = await apiFetch(`/opd/${selectedOPD.opd_id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ is_active: !selectedOPD.is_active })
            });
            const result = await res.json();
            if (result.success) {
                setToast({ message: result.message, type: 'success' });
                fetchOPD();
            } else {
                setToast({ message: result.message || 'Gagal mengubah status', type: 'error' });
            }
        } catch {
            setToast({ message: 'Tidak dapat terhubung ke server', type: 'error' });
        } finally {
            setIsConfirmModalOpen(false);
            setSelectedOPD(null);
        }
    };

    const handleDetailSave = async () => {
        if (!selectedOPD || !detailFormData.nama_opd) return;
        setIsSaving(true);
        try {
            const res = await apiFetch(`/opd/${selectedOPD.opd_id}`, {
                method: 'PUT',
                body: JSON.stringify(detailFormData)
            });
            const result = await res.json();
            if (result.success) {
                setToast({ message: 'Data OPD berhasil diperbarui', type: 'success' });
                setIsDetailModalOpen(false);
                fetchOPD();
            } else {
                setToast({ message: result.message || 'Gagal menyimpan perubahan', type: 'error' });
            }
        } catch {
            setToast({ message: 'Tidak dapat terhubung ke server', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nama_opd) return;
        setIsSaving(true);
        try {
            const res = await apiFetch('/opd', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            const result = await res.json();
            if (result.success) {
                setToast({ message: 'OPD baru berhasil ditambahkan', type: 'success' });
                setIsModalOpen(false);
                setFormData({ nama_opd: '', alamat: '', pic: '', nik_pic: '', kontak: '' });
                fetchOPD();
            } else {
                setToast({ message: result.message || 'Gagal menambahkan OPD', type: 'error' });
            }
        } catch {
            setToast({ message: 'Tidak dapat terhubung ke server', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDetailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setDetailFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            exportToPDF({
                title: 'Data Manajemen OPD',
                columns: [
                    { header: 'NAMA OPD', dataKey: 'nama_opd' },
                    { header: 'STATUS', dataKey: 'is_active' },
                    { header: 'ALAMAT', dataKey: 'alamat' },
                    { header: 'PIC', dataKey: 'pic' },
                    { header: 'KONTAK', dataKey: 'kontak' }
                ],
                data: filteredData.map(opd => ({ ...opd, is_active: opd.is_active ? 'Aktif' : 'Tidak Aktif' })),
                filename: `manajemen-opd-${new Date().toISOString().split('T')[0]}.pdf`
            });
            setToast({ message: 'Data berhasil diekspor ke PDF', type: 'success' });
        } catch {
            setToast({ message: 'Gagal mengekspor data ke PDF', type: 'error' });
        } finally {
            setIsExporting(false);
        }
    };

    const handleExcelUploadConfirm = async (data: any[]) => {
        try {
            const res = await apiFetch('/opd/bulk', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (result.success) {
                setToast({ message: result.message, type: 'success' });
                fetchOPD();
            } else {
                setToast({ message: result.message || 'Gagal import Excel', type: 'error' });
            }
        } catch {
            setToast({ message: 'Tidak dapat terhubung ke server', type: 'error' });
        } finally {
            setIsUploadModalOpen(false);
        }
    };

    const actions = (row: OPDData) => (
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

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex justify-between items-center">
                <div className="flex gap-3">
                    <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                        <Plus size={18} />
                        Tambah OPD
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
                    <h2 className="text-xl font-semibold text-gray-900">Daftar OPD</h2>
                    <Button variant="secondary" size="sm" onClick={handleExportPDF} disabled={isExporting}>
                        {isExporting ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
                        {isExporting ? 'Mengekspor...' : 'Ekspor PDF'}
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 size={28} className="animate-spin text-gray-400" />
                        <span className="ml-3 text-gray-500">Memuat data OPD...</span>
                    </div>
                ) : (
                    <Table columns={columns} data={currentData} actions={actions} minRows={5} />
                )}

                {/* Pagination */}
                {!isLoading && filteredData.length > 0 && (
                    <div className="mt-4 flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                            Menampilkan {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredData.length)} dari {filteredData.length} OPD
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

            {/* Add OPD Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah OPD Baru" subtitle="Isi data OPD yang ingin ditambahkan" maxWidth="2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {[
                        { label: 'Nama OPD', name: 'nama_opd', required: true, placeholder: 'Nama Dinas / OPD' },
                        { label: 'Alamat', name: 'alamat', placeholder: 'Alamat OPD' },
                        { label: 'PIC', name: 'pic', placeholder: 'Penanggung jawab' },
                        { label: 'NIK PIC', name: 'nik_pic', required: true, placeholder: '16 digit NIK PIC', maxLength: 16 },
                        { label: 'Kontak', name: 'kontak', placeholder: 'Nomor telepon / email' },
                    ].map(field => (
                        <div key={field.name} className="grid grid-cols-3 gap-4 items-center">
                            <label className="text-lg font-medium text-gray-900">
                                {field.label}{field.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            <input
                                type="text"
                                name={field.name}
                                value={(formData as any)[field.name]}
                                onChange={handleInputChange}
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
            <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Detail OPD" subtitle="Edit data OPD" maxWidth="2xl">
                {selectedOPD && (
                    <div className="space-y-6">
                        {[
                            { label: 'Nama OPD', name: 'nama_opd', required: true },
                            { label: 'Alamat', name: 'alamat' },
                            { label: 'PIC', name: 'pic' },
                            { label: 'NIK PIC', name: 'nik_pic', required: true, maxLength: 16 },
                            { label: 'Kontak', name: 'kontak' },
                        ].map(field => (
                            <div key={field.name} className="grid grid-cols-3 gap-4 items-center">
                                <label className="text-lg font-medium text-gray-900">
                                    {field.label}{field.required && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                <input
                                    type="text"
                                    name={field.name}
                                    value={(detailFormData as any)[field.name]}
                                    onChange={handleDetailInputChange}
                                    maxLength={(field as any).maxLength}
                                    className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        ))}
                        <div className="flex justify-end pt-6">
                            <Button type="button" onClick={handleDetailSave} disabled={!hasChanges || isSaving} className="bg-green-600 hover:bg-green-700 text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed">
                                {isSaving ? <><Loader2 size={16} className="animate-spin mr-1" />Menyimpan...</> : 'Simpan'}
                            </Button>
                        </div>
                        <div className="pt-4 border-t border-gray-200 space-y-1">
                            <div className="flex gap-2 text-sm">
                                <span className="font-medium">Tanggal Dibuat</span>
                                <span>{new Date(selectedOPD.created_at).toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex gap-2 text-sm italic text-gray-500">
                                <span>Terakhir di-update</span>
                                <span>{new Date(selectedOPD.updated_at).toLocaleString('id-ID')}</span>
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
                subtitle={selectedOPD?.is_active ? "Apakah Anda yakin ingin menonaktifkan OPD ini?" : "Apakah Anda yakin ingin mengaktifkan OPD ini?"}
                maxWidth="md"
                showCloseButton={false}
            >
                {selectedOPD && (
                    <div className="space-y-6">
                        <div className="text-center py-4">
                            <p className="text-lg text-gray-700">
                                Anda akan {selectedOPD.is_active ? 'menonaktifkan' : 'mengaktifkan'}{' '}
                                <span className="font-semibold">{selectedOPD.nama_opd}</span>
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
                title="Unggah Data OPD"
                templateName="Data OPD"
                dataType="opd"
            />

            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default ManajemenOPD;

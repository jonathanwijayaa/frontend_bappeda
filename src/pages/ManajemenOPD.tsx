//ManejemenOPD.tsx
import React, { useState, useMemo } from 'react';
import { Plus, FileDown, Upload, Loader2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { SearchInput } from '../components/ui/Input';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import UploadExcelModal from '../components/ui/UploadExcelModal';
import Toast, { ToastType } from '../components/ui/Toast';
import Pagination from '../components/ui/Pagination';
import { exportToPDF } from '../utils/exportToPDF';
import { parseErrorMessage } from '../utils/parseErrorMessage';
import { OPDData } from '../types';
import { useOpdList } from '../hooks/opd/useOpdList';
import {
    useCreateOpd,
    useUpdateOpd,
    useToggleOpdStatus,
    useBulkOpd,
} from '../hooks/opd/useOpdMutations';

const ManajemenOPD: React.FC = () => {
    // ── Server State (TanStack Query) ─────────────────────────
    const { data: opdList = [], isLoading } = useOpdList();
    const createOpd    = useCreateOpd();
    const updateOpd    = useUpdateOpd();
    const toggleStatus = useToggleOpdStatus();
    const bulkOpd      = useBulkOpd();

    // ── UI State (useState) ───────────────────────────────────
    const [searchTerm, setSearchTerm]               = useState<string>('');
    const [isModalOpen, setIsModalOpen]             = useState<boolean>(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
    const [selectedOPD, setSelectedOPD]             = useState<OPDData | null>(null);
    const [currentPage, setCurrentPage]             = useState<number>(1);
    const [isExporting, setIsExporting]             = useState<boolean>(false);
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
            detailFormData.alamat   !== (selectedOPD.alamat   || '') ||
            detailFormData.pic      !== (selectedOPD.pic      || '') ||
            detailFormData.nik_pic  !== (selectedOPD.nik_pic  || '') ||
            detailFormData.kontak   !== (selectedOPD.kontak   || '')
        );
    }, [selectedOPD, detailFormData]);

    // ── Filter & Pagination ────────────────────────────────────
    const filteredData = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        return opdList.filter(opd =>
            opd.nama_opd?.toLowerCase().includes(lowerSearch) ||
            opd.alamat?.toLowerCase().includes(lowerSearch) ||
            opd.pic?.toLowerCase().includes(lowerSearch) ||
            opd.nik_pic?.toLowerCase().includes(lowerSearch) ||
            opd.kontak?.toLowerCase().includes(lowerSearch)
        );
    }, [opdList, searchTerm]);

    const totalPages  = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex  = (currentPage - 1) * itemsPerPage;
    const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    // ── Columns ────────────────────────────────────────────────
    const columns = [
        { header: 'NAMA OPD', accessor: 'nama_opd' as keyof OPDData, width: '22%' },
        {
            header: 'STATUS',
            width: '10%',
            noTruncate: true,
            render: (row: OPDData) => (
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${row.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {row.is_active ? 'Aktif' : 'Tidak Aktif'}
                </span>
            )
        },
        { header: 'ALAMAT',  accessor: 'alamat'  as keyof OPDData, width: '28%' },
        { header: 'PIC',     accessor: 'pic'     as keyof OPDData, width: '15%' },
        { header: 'KONTAK',  accessor: 'kontak'  as keyof OPDData, width: '15%' },
    ];

    // ── Handlers ──────────────────────────────────────────────
    const handleDetailClick = (opd: OPDData) => {
        setSelectedOPD(opd);
        setDetailFormData({
            nama_opd: opd.nama_opd || '',
            alamat:   opd.alamat   || '',
            pic:      opd.pic      || '',
            nik_pic:  opd.nik_pic  || '',
            kontak:   opd.kontak   || ''
        });
        setIsDetailModalOpen(true);
    };

    const handleToggleStatus = (opd: OPDData) => {
        setSelectedOPD(opd);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmToggleStatus = async () => {
        if (!selectedOPD) return;
        toggleStatus.mutate(
            { opd_id: selectedOPD.opd_id, is_active: !selectedOPD.is_active },
            {
                onSuccess: (d) => setToast({ message: d.message, type: 'success' }),
                onError:   (e: any) => setToast({ message: parseErrorMessage(e, 'Gagal mengubah status'), type: 'error' }),
                onSettled: () => { setIsConfirmModalOpen(false); setSelectedOPD(null); },
            }
        );
    };

    const handleDetailSave = () => {
        if (!selectedOPD) return;
        if (!detailFormData.nama_opd.trim()) {
            setToast({ message: 'Nama OPD tidak boleh kosong', type: 'error' });
            return;
        }
        if (detailFormData.nik_pic && !/^\d{16}$/.test(detailFormData.nik_pic)) {
            setToast({ message: 'NIK PIC harus terdiri dari tepat 16 digit angka', type: 'error' });
            return;
        }
        updateOpd.mutate(
            { opd_id: selectedOPD.opd_id, payload: detailFormData },
            {
                onSuccess: () => {
                    setToast({ message: 'Data OPD berhasil diperbarui', type: 'success' });
                    setIsDetailModalOpen(false);
                },
                onError: (e: any) => setToast({ message: parseErrorMessage(e, 'Gagal menyimpan perubahan'), type: 'error' }),
            }
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nama_opd.trim()) {
            setToast({ message: 'Nama OPD tidak boleh kosong', type: 'error' });
            return;
        }
        if (formData.nik_pic && !/^\d{16}$/.test(formData.nik_pic)) {
            setToast({ message: 'NIK PIC harus terdiri dari tepat 16 digit angka', type: 'error' });
            return;
        }
        createOpd.mutate(formData, {
            onSuccess: () => {
                setToast({ message: 'OPD baru berhasil ditambahkan', type: 'success' });
                setIsModalOpen(false);
                setFormData({ nama_opd: '', alamat: '', pic: '', nik_pic: '', kontak: '' });
            },
            onError: (e: any) => setToast({ message: parseErrorMessage(e, 'Gagal menambahkan OPD'), type: 'error' }),
        });
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
                    { header: 'STATUS',   dataKey: 'is_active' },
                    { header: 'ALAMAT',   dataKey: 'alamat' },
                    { header: 'PIC',      dataKey: 'pic' },
                    { header: 'KONTAK',   dataKey: 'kontak' }
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

    const handleExcelUploadConfirm = (data: any[]) => {
        bulkOpd.mutate(data, {
            onSuccess: (d) => {
                setToast({ message: d.message, type: 'success' });
                setIsUploadModalOpen(false);
            },
            onError: (e: any) => setToast({ message: parseErrorMessage(e, 'Gagal import Excel dari Excel'), type: 'error' }),
        });
    };

    const actions = (row: OPDData) => (
        <>
            <Button variant="secondary" size="sm" onClick={() => handleDetailClick(row)}>Detail</Button>
            <Button
                variant={row.is_active ? 'danger' : 'secondary'}
                size="sm"
                onClick={() => handleToggleStatus(row)}
            >
                {row.is_active ? 'Nonaktif' : 'Aktifkan'}
            </Button>
        </>
    );

    const isSaving = createOpd.isPending || updateOpd.isPending || toggleStatus.isPending;

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
                ) : filteredData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <p className="text-gray-600 font-medium">Belum ada OPD</p>
                        <p className="text-sm text-gray-400 mt-1">
                            {searchTerm
                                ? 'Tidak ada OPD yang cocok dengan pencarian Anda.'
                                : 'Belum ada OPD yang terdaftar. Klik "Tambah OPD" untuk memulai.'}
                        </p>
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
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={(page) => setCurrentPage(page)}
                        />
                    </div>
                )}
            </Card>

            {/* Add OPD Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah OPD Baru" subtitle="Isi data OPD yang ingin ditambahkan" maxWidth="2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {[
                        { label: 'Nama OPD',  name: 'nama_opd', required: true, placeholder: 'Nama Dinas / OPD' },
                        { label: 'Alamat',    name: 'alamat',   placeholder: 'Alamat OPD' },
                        { label: 'PIC',       name: 'pic',      placeholder: 'Penanggung jawab' },
                        { label: 'NIK PIC',   name: 'nik_pic',  required: true, placeholder: '16 digit NIK PIC', maxLength: 16 },
                        { label: 'Kontak',    name: 'kontak',   placeholder: 'Nomor telepon / email' },
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
                            { label: 'Alamat',   name: 'alamat' },
                            { label: 'PIC',      name: 'pic' },
                            { label: 'NIK PIC',  name: 'nik_pic', required: true, maxLength: 16 },
                            { label: 'Kontak',   name: 'kontak' },
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
                            <Button type="button" onClick={handleConfirmToggleStatus} disabled={toggleStatus.isPending} className="bg-red-600 hover:bg-red-700 text-white px-8">
                                {toggleStatus.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Lanjutkan'}
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

//DaftarKader.tsx — Role-aware: Super Admin & OPD
import React, { useState, useMemo } from 'react';
import { Plus, FileDown, Loader2, Upload } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { SearchInput } from '../components/ui/Input';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import AutocompleteInput from '../components/ui/AutocompleteInput';
import Toast, { ToastType } from '../components/ui/Toast';
import UploadExcelModal from '../components/ui/UploadExcelModal';
import Pagination from '../components/ui/Pagination';
import { exportToPDF } from '../utils/exportToPDF';
import { useAuth } from '../context/AuthContext';
import { parseErrorMessage } from '../utils/parseErrorMessage';
import { formatPhoneDisplay } from '../utils/formatPhone';
import { KaderData, AutoOption } from '../types';
import { useKaderList } from '../hooks/kader/useKaderList';
import { useOpdList } from '../hooks/opd/useOpdList';
import { useCreateKader, useUpdateKader, useToggleKaderStatus, useBulkKader } from '../hooks/kader/useKaderMutations';
import { toTitleCase } from '../utils/formatText';

const DaftarKader: React.FC = () => {
    const { isSuperAdmin, isOPD, user } = useAuth();

    // ── Server State (TanStack Query) ─────────────────────────
    const { data: kaderList = [], isLoading } = useKaderList(!!isSuperAdmin);
    const { data: opdListData = [] }           = useOpdList(!!isSuperAdmin);
    const createKader  = useCreateKader(!!isSuperAdmin);
    const updateKader  = useUpdateKader(!!isSuperAdmin);
    const toggleStatus = useToggleKaderStatus(!!isSuperAdmin);
    const bulkKader    = useBulkKader(!!isSuperAdmin);

    // ── UI State ──────────────────────────────────────────────
    const [searchTerm, setSearchTerm]               = useState('');
    const [isModalOpen, setIsModalOpen]             = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedKader, setSelectedKader]         = useState<KaderData | null>(null);
    const [currentPage, setCurrentPage]             = useState(1);
    const [isExporting, setIsExporting]             = useState(false);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const itemsPerPage = 5;

    const [formData, setFormData] = useState({
        opd_name: '',
        opd_id: 0,
        nama_kader: '',
        deskripsi: '',
        nama_pic: '',
        nik_pic: '',
        alamat_pic: '',
        kelurahan_pic: '',
        no_hp_pic: ''
    });

    const [detailFormData, setDetailFormData] = useState({
        nama_kader: '',
        deskripsi: ''
    });

    const [isAssignPicModalOpen, setIsAssignPicModalOpen] = useState(false);
    const [assignPicForm, setAssignPicForm] = useState({
        nik_pic: '',
        nama_pic: '',
        no_hp_pic: '',
        alamat_pic: '',
        kelurahan_pic: ''
    });

    const opdOptions: AutoOption[] = useMemo(
        () => opdListData.map(o => ({ label: o.nama_opd, value: String(o.opd_id) })),
        [opdListData]
    );

    const hasChanges = useMemo(() => {
        if (!selectedKader) return false;
        return (
            detailFormData.nama_kader !== (selectedKader.nama_kader || '') ||
            detailFormData.deskripsi  !== (selectedKader.deskripsi  || '')
        );
    }, [selectedKader, detailFormData]);


    // ── Filter & Pagination ────────────────────────────────────────
    const filteredData = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        return kaderList.filter(k =>
            k.nama_kader?.toLowerCase().includes(lowerSearch) ||
            (k.nama_opd || '').toLowerCase().includes(lowerSearch) ||
            (k.pic_nama || '').toLowerCase().includes(lowerSearch) ||
            (k.pic_nik || '').toLowerCase().includes(lowerSearch) ||
            (k.pic_no_hp || '').toLowerCase().includes(lowerSearch) ||
            (k.deskripsi || '').toLowerCase().includes(lowerSearch)
        );
    }, [kaderList, searchTerm]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    // ── Columns ────────────────────────────────────────────────────
    const columns = [
        { header: 'NAMA KADER', accessor: 'nama_kader' as keyof KaderData, width: '18%' },
        {
            header: 'STATUS',
            width: '10%',
            noTruncate: true,
            render: (row: KaderData) => (
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${row.status_keaktifan ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {row.status_keaktifan ? 'Aktif' : 'Tidak Aktif'}
                </span>
            )
        },
        // Kolom OPD hanya tampil untuk super_admin (OPD sudah tahu OPD-nya sendiri)
        ...(isSuperAdmin ? [{ header: 'OPD', accessor: 'nama_opd' as keyof KaderData, width: '18%' }] : []),
        { header: 'PIC', width: '15%', render: (row: KaderData) => <span>{row.pic_nama || '-'}</span> },
        {
            header: isOPD ? 'JUMLAH ANGGOTA' : 'DESKRIPSI',
            width: '16%',
            render: (row: KaderData) => isOPD
                ? <span>{row.jumlah_anggota ?? 0} orang</span>
                : <span className="truncate max-w-[200px] block" title={row.deskripsi || ''}>{row.deskripsi || '-'}</span>
        },
    ];

    // ── Handlers ───────────────────────────────────────────────────
    const handleOpdChange = (namaOpd: string) => {
        const matched = opdListData.find(o => o.nama_opd.toLowerCase() === namaOpd.toLowerCase());
        setFormData(prev => ({ ...prev, opd_name: namaOpd, opd_id: matched ? matched.opd_id : 0 }));
    };

    const handleDetailClick = (kader: KaderData) => {
        setSelectedKader(kader);
        setDetailFormData({
            nama_kader: kader.nama_kader,
            deskripsi: kader.deskripsi || ''
        });
        setIsDetailModalOpen(true);
    };

    const handleToggleStatus = (kader: KaderData) => {
        setSelectedKader(kader);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmToggleStatus = async () => {
        if (!selectedKader) return;
        toggleStatus.mutate(
            { kader_id: selectedKader.kader_id, status_keaktifan: !selectedKader.status_keaktifan },
            {
                onSuccess: (d) => setToast({ message: d.message, type: 'success' }),
                onError:   (e: any) => setToast({ message: parseErrorMessage(e, 'Gagal mengubah status'), type: 'error' }),
                onSettled: () => { setIsConfirmModalOpen(false); setSelectedKader(null); },
            }
        );
    };

    // Validasi dan simpan kader baru beserta data PIC awal.
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nama_kader.trim() || !formData.deskripsi.trim() || !formData.nama_pic.trim() || !formData.nik_pic.trim() || !formData.alamat_pic.trim() || !formData.kelurahan_pic.trim() || !formData.no_hp_pic.trim()) {
            setToast({ message: 'Semua field wajib diisi', type: 'error' });
            return;
        }
        if (formData.nama_kader.trim().length < 3) {
            setToast({ message: 'Nama Kader minimal 3 karakter', type: 'error' });
            return;
        }
        if (formData.nama_kader.trim().length > 100) {
            setToast({ message: 'Nama Kader terlalu panjang (maks 100 karakter)', type: 'error' });
            return;
        }
        if (!/^[a-zA-Z\s]+$/.test(formData.nama_kader)) {
            setToast({ message: 'Nama Kader tidak boleh mengandung angka atau karakter spesial', type: 'error' });
            return;
        }

        const normalizedNamaKader = formData.nama_kader.trim();
        const isDuplicate = kaderList.some(k => k.nama_kader.toLowerCase() === normalizedNamaKader.toLowerCase());
        if (isDuplicate) {
            setToast({ message: 'Nama Kader sudah terdaftar', type: 'error' });
            return;
        }

        if (formData.nama_pic && formData.nama_pic.trim().length > 0) {
            if (formData.nama_pic.trim().length < 3) {
                setToast({ message: 'Nama PIC minimal 3 karakter', type: 'error' });
                return;
            }
            if (formData.nama_pic.trim().length > 100) {
                setToast({ message: 'Nama PIC terlalu panjang (maks 100 karakter)', type: 'error' });
                return;
            }
            if (!/^[a-zA-Z\s]+$/.test(formData.nama_pic)) {
                setToast({ message: 'Nama PIC tidak boleh mengandung angka atau karakter spesial', type: 'error' });
                return;
            }
        }
        if (isSuperAdmin && !formData.opd_id) {
            setToast({ message: 'Pilih OPD yang valid dari daftar', type: 'error' });
            return;
        }
        if (formData.nik_pic && !/^\d{16}$/.test(formData.nik_pic)) {
            setToast({ message: 'NIK PIC harus tepat 16 digit angka (tanpa huruf atau spasi)', type: 'error' });
            return;
        }
        if (formData.no_hp_pic && !/^[0-9+\-\s]{10,13}$/.test(formData.no_hp_pic.trim())) {
            setToast({ message: 'Nomor HP PIC tidak valid — harus 10–13 digit angka (contoh: 08123456789)', type: 'error' });
            return;
        }

        const body: any = {
            nama_kader:    toTitleCase(normalizedNamaKader),
            deskripsi:     formData.deskripsi     || null,
            nama_pic:      formData.nama_pic      || null,
            nik_pic:       formData.nik_pic       || null,
            alamat_pic:    formData.alamat_pic    || null,
            kelurahan_pic: formData.kelurahan_pic || null,
            no_hp_pic:     formData.no_hp_pic.replace(/\D/g, '')     || null,
        };
        if (isSuperAdmin) body.opd_id = formData.opd_id;

        createKader.mutate(body, {
            onSuccess: (d) => {
                setToast({ message: d.message, type: 'success' });
                setIsModalOpen(false);
                setFormData({ opd_name: '', opd_id: 0, nama_kader: '', deskripsi: '', nama_pic: '', nik_pic: '', alamat_pic: '', kelurahan_pic: '', no_hp_pic: '' });
            },
            onError: (e: any) => setToast({ message: parseErrorMessage(e, 'Gagal menambahkan kader'), type: 'error' }),
        });
    };

    // Simpan perubahan nama kader dan deskripsi dari modal detail.
    const handleDetailSave = async () => {
        if (!selectedKader) return;
        if (!detailFormData.nama_kader.trim() || !detailFormData.deskripsi.trim()) {
            setToast({ message: 'Semua field wajib diisi', type: 'error' });
            return;
        }
        if (detailFormData.nama_kader.trim().length < 3) {
            setToast({ message: 'Nama Kader minimal 3 karakter', type: 'error' });
            return;
        }
        if (detailFormData.nama_kader.trim().length > 100) {
            setToast({ message: 'Nama Kader terlalu panjang (maks 100 karakter)', type: 'error' });
            return;
        }
        if (!/^[a-zA-Z\s]+$/.test(detailFormData.nama_kader)) {
            setToast({ message: 'Nama Kader tidak boleh mengandung angka atau karakter spesial', type: 'error' });
            return;
        }

        const normalizedNamaKader = detailFormData.nama_kader.trim();
        const isDuplicate = kaderList.some(k => 
            k.kader_id !== selectedKader.kader_id && 
            k.nama_kader.toLowerCase() === normalizedNamaKader.toLowerCase()
        );
        if (isDuplicate) {
            setToast({ message: 'Nama Kader sudah terdaftar', type: 'error' });
            return;
        }

        updateKader.mutate(
            { kader_id: selectedKader.kader_id, payload: { nama_kader: toTitleCase(normalizedNamaKader), deskripsi: detailFormData.deskripsi || null } },
            {
                onSuccess: (d) => {
                    setToast({ message: d.message || 'Data kader berhasil diperbarui', type: 'success' });
                    setIsDetailModalOpen(false);
                },
                onError: (e: any) => setToast({ message: parseErrorMessage(e, 'Gagal memperbarui data'), type: 'error' }),
            }
        );
    };

    // Ganti PIC aktif untuk kader yang dipilih melalui validasi input PIC baru.
    const handleAssignPic = async () => {
        if (!selectedKader) return;
        if (!assignPicForm.nik_pic.trim()) {
            setToast({ message: 'NIK PIC wajib diisi', type: 'error' });
            return;
        }
        if (!/^\d{16}$/.test(assignPicForm.nik_pic.trim())) {
            setToast({ message: 'NIK PIC harus tepat 16 digit angka (tanpa huruf atau spasi)', type: 'error' });
            return;
        }
        if (!assignPicForm.nama_pic.trim()) {
            setToast({ message: 'Nama PIC wajib diisi', type: 'error' });
            return;
        }
        if (!assignPicForm.no_hp_pic.trim()) {
            setToast({ message: 'Nomor HP PIC wajib diisi', type: 'error' });
            return;
        }
        if (!/^[0-9+\-\s]{10,13}$/.test(assignPicForm.no_hp_pic.trim())) {
            setToast({ message: 'Nomor HP PIC tidak valid — harus 10–13 digit angka (contoh: 08123456789)', type: 'error' });
            return;
        }
        if (!assignPicForm.alamat_pic.trim()) {
            setToast({ message: 'Alamat PIC wajib diisi', type: 'error' });
            return;
        }
        if (!assignPicForm.kelurahan_pic.trim()) {
            setToast({ message: 'Kelurahan PIC wajib diisi', type: 'error' });
            return;
        }
        if (assignPicForm.nama_pic && assignPicForm.nama_pic.trim().length > 0) {
            if (assignPicForm.nama_pic.trim().length < 3) {
                setToast({ message: 'Nama PIC minimal 3 karakter', type: 'error' });
                return;
            }
            if (assignPicForm.nama_pic.trim().length > 100) {
                setToast({ message: 'Nama PIC terlalu panjang (maks 100 karakter)', type: 'error' });
                return;
            }
            if (!/^[a-zA-Z\s]+$/.test(assignPicForm.nama_pic)) {
                setToast({ message: 'Nama PIC tidak boleh mengandung angka atau karakter spesial', type: 'error' });
                return;
            }
        }
        // Re-use updateKader dengan endpoint assign-pic
        updateKader.mutate(
            { kader_id: selectedKader.kader_id, payload: { ...assignPicForm, no_hp_pic: assignPicForm.no_hp_pic.replace(/\D/g, '') } as any },
            {
                onSuccess: (d) => {
                    setToast({ message: d.message, type: 'success' });
                    setIsAssignPicModalOpen(false);
                    setAssignPicForm({ nik_pic: '', nama_pic: '', no_hp_pic: '', alamat_pic: '', kelurahan_pic: '' });
                },
                onError: (e: any) => setToast({ message: parseErrorMessage(e, 'Gagal mengganti PIC'), type: 'error' }),
            }
        );
    };


    // Ekspor daftar kader yang sedang terfilter ke PDF.
    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            exportToPDF({
                title: 'Daftar Kader',
                columns: [
                    { header: 'NAMA KADER', dataKey: 'nama_kader' },
                    ...(isSuperAdmin ? [{ header: 'OPD', dataKey: 'nama_opd' }] : []),
                    { header: 'PIC', dataKey: 'pic_nama' },
                    { header: 'DESKRIPSI', dataKey: 'deskripsi' }
                ],
                data: filteredData.map(k => ({ ...k, pic_nama: k.pic_nama || '-', deskripsi: k.deskripsi || '-' })),
                filename: `daftar-kader-${new Date().toISOString().split('T')[0]}.pdf`
            });
            setToast({ message: 'Data berhasil diekspor ke PDF', type: 'success' });
        } catch {
            setToast({ message: 'Gagal mengekspor data', type: 'error' });
        } finally {
            setIsExporting(false);
        }
    };

    // Proses hasil unggahan Excel dan kirim ke endpoint bulk import.
    const handleExcelUploadConfirm = async (data: any[]) => {
        bulkKader.mutate(data, {
            onSuccess: (d) => {
                setToast({ message: d.message, type: 'success' });
                setIsUploadModalOpen(false);
            },
            onError: (e: any) => setToast({ message: parseErrorMessage(e, 'Gagal import Excel'), type: 'error' }),
        });
    };

    const isSaving = createKader.isPending || updateKader.isPending || toggleStatus.isPending || bulkKader.isPending;

    const actions = (row: KaderData) => (
        <>
            <Button variant="secondary" size="sm" onClick={() => handleDetailClick(row)}>Detail</Button>
            {/* Toggle status untuk super_admin dan OPD yang memiliki kader tersebut */}
            {(isSuperAdmin || (isOPD && row.opd_id === (user as any)?.opd_id)) && (
                <Button
                    variant={row.status_keaktifan ? 'danger' : 'secondary'}
                    size="sm"
                    onClick={() => handleToggleStatus(row)}
                >
                    {row.status_keaktifan ? 'Nonaktif' : 'Aktifkan'}
                </Button>
            )}
        </>
    );

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex justify-between items-center">
                <div className="flex gap-3">
                    <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                        <Plus size={18} />
                        Tambah Kader Baru
                    </Button>
                    {/* Upload Excel hanya untuk super_admin */}
                    {(isSuperAdmin || isOPD) && (
                        <Button variant="outline" onClick={() => setIsUploadModalOpen(true)}>
                            <Upload size={18} /> Unggah dari Excel
                        </Button>
                    )}
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
                        {isExporting ? 'Mengekspor...' : 'Ekspor PDF'}
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 size={28} className="animate-spin text-gray-400" />
                        <span className="ml-3 text-gray-500">Memuat data kader...</span>
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <p className="text-gray-600 font-medium">Belum ada kader</p>
                        <p className="text-sm text-gray-400 mt-1">
                            {searchTerm
                                ? 'Tidak ada kader yang cocok dengan pencarian Anda.'
                                : 'Belum ada kader yang terdaftar. Klik "Tambah Kader Baru" untuk memulai.'}
                        </p>
                    </div>
                ) : (
                    <Table columns={columns} data={currentData} actions={actions} minRows={5} />
                )}

                {!isLoading && filteredData.length > 0 && (
                    <div className="mt-4 flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                            Menampilkan {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredData.length)} dari {filteredData.length} Kader
                        </div>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={(page) => setCurrentPage(page)}
                        />
                    </div>
                )}
            </Card>

            {/* Modal Tambah Kader */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Kader Baru"
                subtitle={isSuperAdmin ? "Pilih OPD terlebih dahulu, lalu isi detail kader" : "Isi detail kader untuk instansi Anda"}
                maxWidth="2xl">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Pilih OPD — hanya untuk super_admin */}
                    {isSuperAdmin && (
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
                                {formData.opd_id > 0 && (
                                    <p className="mt-1 text-xs text-green-600 font-medium">✓ OPD ditemukan dan siap disimpan</p>
                                )}
                            </div>
                        </div>
                    )}

                    {[
                        { label: 'Nama Kader',    name: 'nama_kader',    required: true,  placeholder: 'Nama Kader atau komunitas' },
                        { label: 'Nama PIC',     name: 'nama_pic',      required: true, placeholder: 'Nama Person in Charge' },
                        { label: 'NIK PIC',      name: 'nik_pic',       required: true,  placeholder: '16 digit NIK PIC', maxLength: 16 },
                        { label: 'No. HP PIC',   name: 'no_hp_pic',     required: true, placeholder: 'Nomor HP PIC' },
                        { label: 'Alamat PIC',   name: 'alamat_pic',    required: true, placeholder: 'Alamat sesuai KTP' },
                        { label: 'Kelurahan PIC',name: 'kelurahan_pic', required: true, placeholder: 'Kelurahan/Desa' },
                        { label: 'Deskripsi',    name: 'deskripsi',     required: true, placeholder: 'Deskripsi singkat' },
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
                {selectedKader && (
                    <div className="space-y-6">
                        {/* OPD (read-only di semua role) */}
                        <div className="grid grid-cols-3 gap-4 items-center">
                            <label className="text-lg font-medium text-gray-900">OPD</label>
                            <input type="text" value={selectedKader.nama_opd} disabled
                                className="col-span-2 px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 italic" />
                        </div>

                        {/* Info Kader — editable */}
                        {[
                            { label: 'Nama Kader', name: 'nama_kader', type: 'input' },
                            { label: 'Deskripsi',  name: 'deskripsi', type: 'textarea' }
                        ].map(field => (
                            <div key={field.name} className={`grid grid-cols-3 gap-4 ${field.type === 'textarea' ? 'items-start' : 'items-center'}`}>
                                <label className={`text-lg font-medium text-gray-900 ${field.type === 'textarea' ? 'pt-2' : ''}`}>{field.label}</label>
                                {field.type === 'textarea' ? (
                                    <textarea
                                        value={(detailFormData as any)[field.name]}
                                        onChange={(e) => setDetailFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                                        rows={4}
                                        className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        value={(detailFormData as any)[field.name]}
                                        onChange={(e) => setDetailFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                                        className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                )}
                            </div>
                        ))}

                        {/* Info PIC — read-only + tombol ganti */}
                        <div className="border-t border-gray-100 pt-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <h3 className="text-base font-semibold text-gray-700">Informasi PIC Aktif</h3>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setIsAssignPicModalOpen(true);
                                        setIsDetailModalOpen(false);
                                    }}
                                >
                                    Ganti PIC
                                </Button>
                            </div>
                            <div className="grid grid-cols-3 gap-3 text-sm">
                                <span className="text-gray-500 font-medium">Nama PIC</span>
                                <span className="col-span-2 text-gray-800">{selectedKader.pic_nama || <span className="italic text-gray-400">Belum ada PIC</span>}</span>
                                <span className="text-gray-500 font-medium">NIK PIC</span>
                                <span className="col-span-2 text-gray-800">{selectedKader.pic_nik || '-'}</span>
                                <span className="text-gray-500 font-medium">No. HP PIC</span>
                                <span className="col-span-2 text-gray-800">{formatPhoneDisplay(selectedKader.pic_no_hp)}</span>
                                <span className="text-gray-500 font-medium">PIC Sejak</span>
                                <span className="col-span-2 text-gray-800">
                                    {selectedKader.pic_tanggal_mulai
                                        ? new Date(selectedKader.pic_tanggal_mulai).toLocaleDateString('id-ID')
                                        : '-'}
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-between pt-6 border-t border-gray-100">
                            <div className="text-sm text-gray-400 italic">
                                Dibuat: {new Date(selectedKader.created_at).toLocaleString('id-ID')}
                            </div>
                            <Button onClick={handleDetailSave} disabled={!hasChanges || isSaving}
                                className="bg-green-600 hover:bg-green-700 text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed">
                                {isSaving ? <><Loader2 size={16} className="animate-spin mr-1" />Menyimpan...</> : 'Simpan Perubahan'}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal Ganti PIC */}
            <Modal isOpen={isAssignPicModalOpen} onClose={() => setIsAssignPicModalOpen(false)}
                title="Ganti PIC Kader" subtitle="Masukkan NIK PIC baru. Histori PIC lama akan tersimpan." maxWidth="xl">
                <div className="space-y-4">
                    {[
                        { label: 'NIK PIC Baru',    name: 'nik_pic',       required: true,  placeholder: '16 digit NIK', maxLength: 16 },
                        { label: 'Nama PIC',        name: 'nama_pic',      required: true, placeholder: 'Nama (jika NIK belum terdaftar)' },
                        { label: 'No. HP PIC',      name: 'no_hp_pic',     required: true, placeholder: 'Nomor HP' },
                        { label: 'Alamat PIC',      name: 'alamat_pic',    required: true, placeholder: 'Alamat KTP' },
                        { label: 'Kelurahan PIC',   name: 'kelurahan_pic', required: true, placeholder: 'Kelurahan' },
                    ].map(field => (
                        <div key={field.name} className="grid grid-cols-3 gap-4 items-center">
                            <label className="text-sm font-medium text-gray-700">
                                {field.label}{field.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            <input
                                type="text"
                                value={(assignPicForm as any)[field.name]}
                                onChange={(e) => setAssignPicForm(prev => ({ ...prev, [field.name]: e.target.value }))}
                                placeholder={field.placeholder}
                                maxLength={(field as any).maxLength}
                                className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                    ))}
                    <p className="text-xs text-gray-400 italic pt-2">
                        * Jika NIK sudah terdaftar di sistem, data relawan yang ada akan langsung digunakan sebagai PIC baru.
                    </p>
                    <div className="flex justify-between pt-4">
                        <Button type="button" onClick={() => setIsAssignPicModalOpen(false)} className="bg-gray-500 hover:bg-gray-600 text-white px-6">Batal</Button>
                        <Button type="button" onClick={handleAssignPic} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white px-6">
                            {isSaving ? <><Loader2 size={16} className="animate-spin mr-1" />Menyimpan...</> : 'Simpan PIC Baru'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Confirmation Modal — untuk super_admin dan OPD */}
            {(isSuperAdmin || isOPD) && (
                <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title="Konfirmasi"
                    subtitle={selectedKader?.status_keaktifan ? "Nonaktifkan kader ini?" : "Aktifkan kader ini?"}
                    maxWidth="md" showCloseButton={false}>
                    {selectedKader && (
                        <div className="space-y-6">
                            <div className="text-center py-4">
                                <p className="text-lg text-gray-700">
                                    Anda akan {selectedKader.status_keaktifan ? 'menonaktifkan' : 'mengaktifkan'}{' '}
                                    <span className="font-semibold">{selectedKader.nama_kader}</span>
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
            )}

            {/* Upload Excel — untuk super_admin dan OPD */}
            {(isSuperAdmin || isOPD) && (
                <UploadExcelModal
                    isOpen={isUploadModalOpen}
                    onClose={() => setIsUploadModalOpen(false)}
                    onConfirm={handleExcelUploadConfirm}
                    title="Unggah Data Kader"
                    templateName="Data Kader"
                    dataType="kader"
                />
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default DaftarKader;
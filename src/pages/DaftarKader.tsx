//DaftarKader.tsx — Role-aware: Super Admin & OPD
import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface KaderData {
    kader_id: number;
    nama_kader: string;
    deskripsi: string | null;
    pic: string | null;
    nik_pic?: string | null;
    nama_opd: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    jumlah_anggota?: number; // khusus response OPD
}

interface OPDOption {
    opd_id: number;
    nama_opd: string;
}

interface AutoOption {
    label: string;
    value: string;
}

const DaftarKader: React.FC = () => {
    const { isSuperAdmin, isOPD } = useAuth();

    const [kaderList, setKaderList] = useState<KaderData[]>([]);
    const [opdList, setOpdList] = useState<OPDOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedKader, setSelectedKader] = useState<KaderData | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isExporting, setIsExporting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const itemsPerPage = 5;

    // ── Endpoint berbeda per role ──────────────────────────────────
    const API_BASE = isSuperAdmin ? '/kader' : '/opd-admin/kader';

    const [formData, setFormData] = useState({
        opd_name: '',
        opd_id: 0,
        nama_kader: '',
        deskripsi: '',
        pic: '',
        nik_pic: '',
        alamat_pic: '',
        kelurahan_pic: '',
        no_hp_pic: ''
    });

    const [detailFormData, setDetailFormData] = useState({
        nama_kader: '',
        deskripsi: '',
        pic: '',
        nik_pic: ''
    });

    const opdOptions: AutoOption[] = useMemo(
        () => opdList.map(o => ({ label: o.nama_opd, value: String(o.opd_id) })),
        [opdList]
    );

    const hasChanges = useMemo(() => {
        if (!selectedKader) return false;
        return (
            detailFormData.nama_kader !== (selectedKader.nama_kader || '') ||
            detailFormData.deskripsi !== (selectedKader.deskripsi || '') ||
            detailFormData.pic !== (selectedKader.pic || '')
        );
    }, [selectedKader, detailFormData]);

    // ── Fetch ──────────────────────────────────────────────────────
    const fetchKader = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await apiFetch(API_BASE);
            const result = await res.json();
            if (result.success) {
                setKaderList(result.data);
            } else {
                setToast({ message: result.message || 'Gagal memuat data kader', type: 'error' });
            }
        } catch {
            setToast({ message: 'Tidak dapat terhubung ke server', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [API_BASE]);

    const fetchOPD = useCallback(async () => {
        if (!isSuperAdmin) return; // OPD tidak butuh dropdown OPD
        try {
            const res = await apiFetch('/opd');
            const result = await res.json();
            if (result.success) {
                setOpdList(result.data.map((o: any) => ({ opd_id: o.opd_id, nama_opd: o.nama_opd })));
            }
        } catch {
            console.error('Gagal mengambil daftar OPD');
        }
    }, [isSuperAdmin]);

    useEffect(() => {
        fetchKader();
        fetchOPD();
    }, [fetchKader, fetchOPD]);

    // ── Filter & Pagination ────────────────────────────────────────
    const filteredData = useMemo(() =>
        kaderList.filter(k =>
            k.nama_kader.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (k.nama_opd || '').toLowerCase().includes(searchTerm.toLowerCase())
        ), [kaderList, searchTerm]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    // ── Columns ────────────────────────────────────────────────────
    const columns = [
        { header: 'NAMA KADER', accessor: 'nama_kader' as keyof KaderData },
        {
            header: 'STATUS',
            render: (row: KaderData) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {row.is_active ? 'Aktif' : 'Tidak Aktif'}
                </span>
            )
        },
        // Kolom OPD hanya tampil untuk super_admin (OPD sudah tahu OPD-nya sendiri)
        ...(isSuperAdmin ? [{ header: 'OPD', accessor: 'nama_opd' as keyof KaderData }] : []),
        { header: 'PIC', render: (row: KaderData) => <span>{row.pic || '-'}</span> },
        {
            header: isOPD ? 'JUMLAH ANGGOTA' : 'DESKRIPSI',
            render: (row: KaderData) => isOPD
                ? <span>{row.jumlah_anggota ?? 0} orang</span>
                : <span className="truncate max-w-[200px] block" title={row.deskripsi || ''}>{row.deskripsi || '-'}</span>
        },
    ];

    // ── Handlers ───────────────────────────────────────────────────
    const handleOpdChange = (namaOpd: string) => {
        const matched = opdList.find(o => o.nama_opd.toLowerCase() === namaOpd.toLowerCase());
        setFormData(prev => ({ ...prev, opd_name: namaOpd, opd_id: matched ? matched.opd_id : 0 }));
    };

    const handleDetailClick = (kader: KaderData) => {
        setSelectedKader(kader);
        setDetailFormData({
            nama_kader: kader.nama_kader,
            deskripsi: kader.deskripsi || '',
            pic: kader.pic || '',
            nik_pic: kader.nik_pic || ''
        });
        setIsDetailModalOpen(true);
    };

    const handleToggleStatus = (kader: KaderData) => {
        setSelectedKader(kader);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmToggleStatus = async () => {
        if (!selectedKader) return;
        try {
            const res = await apiFetch(`${API_BASE}/${selectedKader.kader_id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ is_active: !selectedKader.is_active })
            });
            const result = await res.json();
            if (result.success) {
                setToast({ message: result.message, type: 'success' });
                fetchKader();
            } else {
                setToast({ message: result.message || 'Gagal mengubah status', type: 'error' });
            }
        } catch {
            setToast({ message: 'Tidak dapat terhubung ke server', type: 'error' });
        } finally {
            setIsConfirmModalOpen(false);
            setSelectedKader(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nama_kader) return;

        // Super admin wajib pilih OPD; OPD tidak perlu (otomatis dari token)
        if (isSuperAdmin && !formData.opd_id) {
            setToast({ message: 'Pilih OPD yang valid dari daftar', type: 'error' });
            return;
        }

        setIsSaving(true);
        try {
            const body: any = {
                nama_kader: formData.nama_kader,
                deskripsi: formData.deskripsi || null,
                pic: formData.pic || null,
                nik_pic: formData.nik_pic || null,
                alamat_pic: formData.alamat_pic || null,
                kelurahan_pic: formData.kelurahan_pic || null,
                no_hp_pic: formData.no_hp_pic || null
            };
            if (isSuperAdmin) body.opd_id = formData.opd_id;

            const res = await apiFetch(API_BASE, {
                method: 'POST',
                body: JSON.stringify(body)
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
                setFormData({ opd_name: '', opd_id: 0, nama_kader: '', deskripsi: '', pic: '', nik_pic: '', alamat_pic: '', kelurahan_pic: '', no_hp_pic: '' });
                fetchKader();
            } else {
                setToast({ message: result.message || 'Gagal menambahkan kader', type: 'error' });
            }
        } catch (err: any) {
            setToast({ message: `Koneksi gagal: ${err?.message}`, type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDetailSave = async () => {
        if (!selectedKader) return;
        setIsSaving(true);
        try {
            // OPD pakai PATCH, super_admin pakai PUT
            const method = isOPD ? 'PATCH' : 'PUT';
            const res = await apiFetch(`${API_BASE}/${selectedKader.kader_id}`, {
                method,
                body: JSON.stringify({
                    nama_kader: detailFormData.nama_kader,
                    deskripsi: detailFormData.deskripsi || null,
                    pic: detailFormData.pic || null,
                })
            });
            const result = await res.json();
            if (result.success) {
                setToast({ message: result.message || 'Data kader berhasil diperbarui', type: 'success' });
                setIsDetailModalOpen(false);
                fetchKader();
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
                    ...(isSuperAdmin ? [{ header: 'OPD', dataKey: 'nama_opd' }] : []),
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
            const url = isSuperAdmin ? '/kader/bulk' : '/opd-admin/kader/bulk';
            const res = await apiFetch(url, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            const result = await res.json();
            if (result.success) {
                setToast({ message: result.message, type: 'success' });
                fetchKader();
            } else {
                setToast({ message: result.message || 'Gagal import Excel', type: 'error' });
            }
        } catch {
            setToast({ message: 'Tidak dapat terhubung ke server', type: 'error' });
        } finally {
            setIsUploadModalOpen(false);
        }
    };

    const actions = (row: KaderData) => (
        <>
            <Button variant="secondary" size="sm" onClick={() => handleDetailClick(row)}>Detail</Button>
            {/* Toggle status hanya untuk super_admin */}
            {isSuperAdmin && (
                <Button variant="secondary" size="sm" onClick={() => handleToggleStatus(row)}>
                    {row.is_active ? 'Nonaktif' : 'Aktifkan'}
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
                        {isExporting ? 'Mengekspor...' : 'Ekspor'}
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
                        { label: 'Nama Kader', name: 'nama_kader', required: true, placeholder: 'Nama Kader atau komunitas' },
                        { label: 'PIC', name: 'pic', required: false, placeholder: 'Nama Person in Charge (opsional)' },
                        { label: 'NIK PIC', name: 'nik_pic', required: true, placeholder: '16 digit NIK PIC', maxLength: 16 },
                        { label: 'No. HP PIC', name: 'no_hp_pic', required: false, placeholder: 'Nomor HP PIC (opsional)' },
                        { label: 'Alamat PIC', name: 'alamat_pic', required: false, placeholder: 'Alamat sesuai KTP (opsional)' },
                        { label: 'Kelurahan PIC', name: 'kelurahan_pic', required: false, placeholder: 'Kelurahan/Desa (opsional)' },
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
                {selectedKader && (
                    <div className="space-y-6">
                        {/* OPD (read-only di semua role) */}
                        <div className="grid grid-cols-3 gap-4 items-center">
                            <label className="text-lg font-medium text-gray-900">OPD</label>
                            <input type="text" value={selectedKader.nama_opd} disabled
                                className="col-span-2 px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 italic" />
                        </div>

                        {[
                            { label: 'Nama Kader', name: 'nama_kader' },
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

            {/* Confirmation Modal — hanya dipakai super_admin */}
            {isSuperAdmin && (
                <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title="Konfirmasi"
                    subtitle={selectedKader?.is_active ? "Nonaktifkan kader ini?" : "Aktifkan kader ini?"}
                    maxWidth="md" showCloseButton={false}>
                    {selectedKader && (
                        <div className="space-y-6">
                            <div className="text-center py-4">
                                <p className="text-lg text-gray-700">
                                    Anda akan {selectedKader.is_active ? 'menonaktifkan' : 'mengaktifkan'}{' '}
                                    <span className="font-semibold">{selectedKader.nama_kader}</span>
                                </p>
                            </div>
                            <div className="flex justify-center gap-4 pt-6">
                                <Button type="button" onClick={() => setIsConfirmModalOpen(false)} className="bg-gray-500 hover:bg-gray-600 text-white px-8">Batal</Button>
                                <Button type="button" onClick={handleConfirmToggleStatus} className="bg-red-600 hover:bg-red-700 text-white px-8">Lanjutkan</Button>
                            </div>
                        </div>
                    )}
                </Modal>
            )}

            {/* Upload Excel — hanya super_admin */}
            {isSuperAdmin && (
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
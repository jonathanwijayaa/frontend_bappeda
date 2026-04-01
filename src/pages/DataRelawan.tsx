//DataRelawan.tsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, Upload, Loader2, X } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { SearchInput } from '../components/ui/Input';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import AutocompleteInput from '../components/ui/AutocompleteInput';
import UploadExcelModal from '../components/ui/UploadExcelModal';
import Toast, { ToastType } from '../components/ui/Toast';
import Pagination from '../components/ui/Pagination';
import { RelawanData, Assignment } from '../types/relawan.types';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';

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
    alamat_ktp: string | null;
    kelurahan: string | null;
    penugasan: string | null;
    status_penugasan: string | null;
    nama_opd: string | null;
    nama_kader: string | null;
}

interface PengajuanAPIData {
    pengajuan_id: number;
    jenis_perubahan: string;
    status: string;
    tanggal_pengajuan: string;
    catatan_relawan: string | null;
    nama_lengkap: string;
    nik: string;
    relawan_id: number;
    data_baru?: any;
    data_lama?: any;
}

interface AutoOption { label: string; value: string; }

const mapToRelawanData = (r: RelawanAPIData): RelawanData => ({
    user_id: r.user_id,  // ← tambahkan ini (pastikan juga ada di interface RelawanData)
    nik: r.nik,
    namaLengkap: r.nama_lengkap,
    alamat: r.alamat_ktp || '-',
    no_hp: r.no_hp || '-',
    kelurahan: r.kelurahan || '-',
    kader: r.nama_kader || '-',
    jabatan: r.penugasan || '-',   // ← fix: bukan status_penugasan
    penugasan: r.nama_opd || '-',
    jenisKelamin: r.jenis_kelamin || 'L',
    assignments: []
});

const DataRelawan: React.FC = () => {
    const { isSuperAdmin, isOPD, user } = useAuth();
    const API_BASE = isSuperAdmin ? '/admin/relawan' : '/opd-admin/relawan';

    const [relawanList, setRelawanList] = useState<RelawanData[]>([]);
    const [pengajuanList, setPengajuanList] = useState<PengajuanAPIData[]>([]);
    const [isLoadingRelawan, setIsLoadingRelawan] = useState(true);
    const [isLoadingPengajuan, setIsLoadingPengajuan] = useState(true);
    const [isReviewing, setIsReviewing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [opdOptions, setOpdOptions] = useState<AutoOption[]>([]);

    // ── Kader options per assignment index (dinamis berdasarkan OPD) ──
    const [kaderOptionsByIndex, setKaderOptionsByIndex] = useState<Record<number, AutoOption[]>>({});
    const [isLoadingKaderByIndex, setIsLoadingKaderByIndex] = useState<Record<number, boolean>>({});

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
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);
    const [deletingPenugasanId, setDeletingPenugasanId] = useState<number | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{
        penugasanId: number;
        index: number;
        label: string;
    } | null>(null);


    const [detailFormData, setDetailFormData] = useState({
        namaRelawan: '',
        nik: '',
        alamat: '',
        no_hp: '',
        kelurahan: '',
        kader: '',
        jabatan: '',
        penugasan: '',
        jenisKelamin: 'L' as 'L' | 'P',
        assignments: [] as Assignment[]
    });

    const hasChanges = useMemo(() => {
        if (!selectedRelawan) return false;
        return (
            detailFormData.namaRelawan !== selectedRelawan.namaLengkap ||
            detailFormData.nik !== selectedRelawan.nik ||
            detailFormData.alamat !== selectedRelawan.alamat ||
            detailFormData.no_hp !== selectedRelawan.no_hp ||
            detailFormData.kelurahan !== selectedRelawan.kelurahan ||
            detailFormData.kader !== selectedRelawan.kader ||
            detailFormData.jabatan !== selectedRelawan.jabatan ||
            detailFormData.penugasan !== selectedRelawan.penugasan ||
            detailFormData.jenisKelamin !== (selectedRelawan.jenisKelamin || 'L') ||
            JSON.stringify(detailFormData.assignments) !== JSON.stringify(selectedRelawan.assignments || [])
        );
    }, [selectedRelawan, detailFormData]);

    const [formData, setFormData] = useState({
        namaRelawan: '',
        nik: '',
        jenisKelamin: 'L' as 'L' | 'P',
        alamat: '',
        no_hp: '',
        kelurahan: '',
        kader: '',
        jabatan: '',
        penugasan: '',
        detail_penugasan: '',
        assignments: [
            {
                id: Date.now().toString(),
                opd: '',
                opd_id: 0,
                kader: '',
                // ✅ FIXED: Hapus tanda kutip agar tipenya menjadi null/number, bukan string ''
                kader_id: null as number | null,
                peran: '',
                detail: '',
                statusKeaktifan: 'Aktif' as 'Aktif' | 'Nonaktif',
                nomorSK: '',
                skId: ''
            }
        ]
    });

    // ── Fetch kader berdasarkan opd_id untuk assignment tertentu ──
    const fetchKaderByOpdId = useCallback(async (opdId: number, assignmentIndex: number) => {
        if (!opdId) {
            setKaderOptionsByIndex(prev => ({ ...prev, [assignmentIndex]: [] }));
            return;
        }

        setIsLoadingKaderByIndex(prev => ({ ...prev, [assignmentIndex]: true }));
        try {
            // ✅ FIX: OPD pakai endpoint /opd-admin/kader (tidak perlu opd_id, backend ambil otomatis)
            //         Super Admin tetap pakai /kader?opd_id=...
            const endpoint = isOPD
                ? `/opd-admin/kader`
                : `/kader?opd_id=${opdId}`;

            const res = await apiFetch(endpoint);
            const result = await res.json();

            if (result.success) {
                const options: AutoOption[] = result.data.map((k: any) => ({
                    label: k.nama_kader,
                    value: String(k.kader_id)
                }));
                setKaderOptionsByIndex(prev => ({ ...prev, [assignmentIndex]: options }));
            } else {
                setKaderOptionsByIndex(prev => ({ ...prev, [assignmentIndex]: [] }));
            }
        } catch (err) {
            console.error('Gagal mengambil kader:', err);
            setKaderOptionsByIndex(prev => ({ ...prev, [assignmentIndex]: [] }));
        } finally {
            setIsLoadingKaderByIndex(prev => ({ ...prev, [assignmentIndex]: false }));
        }
    }, [isOPD]); // ← tambahkan isOPD ke dependency

    // ── Fetch Functions ──
    const fetchRelawan = useCallback(async (showLoader: boolean = true) => {
        if (showLoader) setIsLoadingRelawan(true);
        try {
            const res = await apiFetch(API_BASE)
            const result = await res.json();

            if (result.success) {
                // ── LOGIKA GROUPING MULTI-PENUGASAN ──
                const groupedMap = new Map<string, RelawanData>();

                result.data.forEach((row: any) => {
                    // Jika NIK belum ada di Map, buat kerangka profil utamanya
                    if (!groupedMap.has(row.nik)) {
                        groupedMap.set(row.nik, {
                            nik: row.nik,
                            namaLengkap: row.nama_lengkap,
                            alamat: row.alamat_ktp || '-',
                            no_hp: row.no_hp || '-',
                            kelurahan: row.kelurahan || '-',
                            jenisKelamin: row.jenis_kelamin || 'L',
                            kader: row.nama_kader || '-',
                            jabatan: row.jabatan || '-',
                            penugasan: row.nama_opd || row.penugasan || '-',
                            assignments: [],
                            relawan_id: row.relawan_id,  // ← TAMBAH INI
                            user_id: row.user_id,        // ← TAMBAH INI (jaga-jaga)
                        } as any);
                    }

                    // Masukkan data penugasan ke dalam array 'assignments' milik relawan tersebut
                    if (row.nama_opd || row.penugasan || row.nama_kader) {
                        groupedMap.get(row.nik)!.assignments!.push({
                            id: row.penugasan_id?.toString() || Math.random().toString(),
                            opd: row.nama_opd || '',
                            opd_id: row.opd_id || 0, // Termasuk opd_id agar komplit
                            kader: row.nama_kader || '',
                            // ✅ FIXED: Tambahkan properti ini untuk sinkronisasi state UI
                            kader_id: row.kader_id || null,
                            peran: row.jabatan || '',
                            detail: row.detail_jabatan || '',
                            penugasan: row.penugasan || '',
                            statusKeaktifan: row.status_penugasan || 'Aktif',
                            nomorSK: row.nomor_sk_manual || '',
                            skId: ''
                        } as any); // ✅ FIXED: Gunakan "as any" untuk melewati pengecekan ketat interface saat render awal
                    }
                });

                // Ubah Map kembali menjadi Array untuk dirender oleh tabel
                setRelawanList(Array.from(groupedMap.values()));
            } else {
                setToast({ message: result.message || 'Gagal memuat data relawan', type: 'error' });
            }
        } catch {
            setToast({ message: 'Tidak dapat terhubung ke server', type: 'error' });
        } finally {
            if (showLoader) setIsLoadingRelawan(false);
        }
    }, [API_BASE]);

    const fetchPengajuan = useCallback(async (showLoader: boolean = true) => {

        // ✨ FIXED: Hentikan fungsi jika yang login bukan Super Admin
        if (!isSuperAdmin) {
            if (showLoader) setIsLoadingPengajuan(false);
            return;
        }

        if (showLoader) setIsLoadingPengajuan(true);
        try {
            const res = await apiFetch(`${API_BASE}/pengajuan`);
            const result = await res.json();
            if (result.success) {
                setPengajuanList(result.data);
            } else {
                setToast({ message: result.message || 'Gagal memuat data pengajuan', type: 'error' });
            }
        } catch {
            setToast({ message: 'Tidak dapat terhubung ke server', type: 'error' });
        } finally {
            if (showLoader) setIsLoadingPengajuan(false);
        }
    }, [isSuperAdmin, API_BASE]);

    useEffect(() => {
        fetchRelawan();
        fetchPengajuan();

        // Fetch OPD options untuk autocomplete
        apiFetch('/opd').then(r => r.json()).then(result => {
            if (result.success) {
                setOpdOptions(result.data.map((o: any) => ({ label: o.nama_opd, value: String(o.opd_id) })));
            }
        }).catch(() => { });
    }, [fetchRelawan, fetchPengajuan]);

    // ── Auto-fill OPD untuk OPD user saat modal dibuka ──
    useEffect(() => {
        if (isModalOpen && isOPD && user && formData.assignments.length > 0) {
            const opdId = (user as any)?.opd_id;
            const opdName = (user as any)?.nama_opd;

            if (opdId && opdName && formData.assignments[0].opd_id === 0) {
                // ✅ FIXED: Auto-fill OPD
                setFormData(prev => ({
                    ...prev,
                    assignments: prev.assignments.map((a, index) => ({
                        ...a,
                        opd: opdName,
                        opd_id: opdId
                    }))
                }));

                // ✅ FIXED: Langsung fetch kader SETELAH setFormData (tidak tunggu useEffect lain)
                formData.assignments.forEach((_, index) => {
                    console.log(`🔍 Debug: Fetching kader for OPD ${opdId}, assignment index ${index}`);
                    fetchKaderByOpdId(opdId, index);
                });
            }
        }
    }, [isModalOpen, isOPD, user]);  // ✅ Hapus formData.assignments dari dependency

    // ── Auto-fetch kader untuk semua assignment yang ada saat OPD user masuk edit mode ──
    useEffect(() => {
        if (isEditMode && isOPD && (user as any)?.opd_id) {
            const opdId = (user as any).opd_id;
            // Fetch kader untuk setiap assignment yang sudah ada di form detail
            detailFormData.assignments.forEach((_, index) => {
                // Hanya fetch jika belum ada options untuk index ini
                if (!kaderOptionsByIndex[index]) {
                    fetchKaderByOpdId(opdId, index);
                }
            });
        }
    }, [isEditMode]); // ← hanya trigger saat isEditMode berubah

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

    const pengajuanUIData = pengajuanList.map(p => ({
        nik: p.nik,
        namaLengkap: p.nama_lengkap,
        tanggalPengajuan: new Date(p.tanggal_pengajuan).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
        status: p.status,
        _raw: p
    }));

    const pengajuanColumns = [
        { header: 'NIK', accessor: 'nik' as const },
        { header: 'NAMA LENGKAP', accessor: 'namaLengkap' as const },
        { header: 'TANGGAL PENGAJUAN', accessor: 'tanggalPengajuan' as const },
        {
            header: 'STATUS',
            render: (row: any) => {
                const isDisetujui = row.status === 'Disetujui' || row.status === 'Diterima';
                const isDitolak = row.status === 'Ditolak';
                const colorClass = isDisetujui ? 'bg-green-500' : isDitolak ? 'bg-red-500' : 'bg-yellow-400';
                return (
                    <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 ${colorClass} rounded-full`}></span>
                        {row.status}
                    </div>
                );
            }
        },
    ];

    const relawanColumns = [
        { header: 'NAMA', accessor: 'namaLengkap' as keyof RelawanData },
        { header: 'NIK', accessor: 'nik' as keyof RelawanData },
        { header: 'ALAMAT', accessor: 'alamat' as keyof RelawanData },
        { header: 'KELURAHAN', accessor: 'kelurahan' as keyof RelawanData },
    ];

    const handleDetailClick = (relawan: RelawanData) => {
        setSelectedRelawan(relawan);
        setDetailFormData({
            namaRelawan: relawan.namaLengkap || '',
            nik: relawan.nik || '',
            alamat: relawan.alamat || '-',
            no_hp: relawan.no_hp || '-',
            kelurahan: relawan.kelurahan || '-',
            kader: relawan.kader || '-',
            jabatan: relawan.jabatan || '-',
            penugasan: relawan.penugasan || '-',
            jenisKelamin: (relawan.jenisKelamin as 'L' | 'P') || 'L',
            // ✨ FIXED: Jaga-jaga jika relawan.assignments null/undefined
            assignments: Array.isArray(relawan.assignments) ? relawan.assignments : []
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
                
                // Optimistically update the status in UI list
                setPengajuanList(prev => prev.map(p => 
                    p.pengajuan_id === selectedPengajuan.pengajuan_id ? { ...p, status: status } : p
                ));
                
                setIsReviewModalOpen(false);
                
                // Fetch in background without UI loader
                fetchPengajuan(false);
                if (status === 'Disetujui') {
                    fetchRelawan(false);
                }
            } else {
                setToast({ message: result.message || 'Gagal memproses pengajuan', type: 'error' });
            }
        } catch {
            setToast({ message: 'Tidak dapat terhubung ke server', type: 'error' });
        } finally {
            setIsReviewing(false);
        }
    };

    // ✅ BENAR: Object tunggal untuk form manual
    // ✅ BENAR: Object tunggal untuk form manual
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // ✅ Validasi NIK & Nama SEKALI di root
        if (!formData.namaRelawan || !formData.nik) {
            setToast({ message: 'NIK dan Nama wajib diisi', type: 'error' });
            return;
        }

        // ✅ Validasi minimal 1 assignment
        if (formData.assignments.length === 0) {
            setToast({ message: 'Minimal 1 penugasan wajib diisi', type: 'error' });
            return;
        }

        // ✅ Validasi OPD, Kader, dan Jabatan pada assignment manual
        const hasInvalidAssignment = formData.assignments.some(
            (a) => !a.opd || !a.kader || !a.peran
        );
        if (hasInvalidAssignment) {
            setToast({ message: 'Instansi (OPD), Kader, dan Peran/Jabatan pada setiap penugasan wajib diisi.', type: 'error' });
            return;
        }

        setIsSaving(true);
        try {
            // ✅ FIXED: Menggunakan endpoint /bulk karena kita mengirim array
            const res = await apiFetch(`${API_BASE}/bulk`, {
                method: 'POST',
                // ✅ FIXED: Format data disejajarkan dengan apa yang diharapkan oleh fitur Bulk Backend
                body: JSON.stringify([{
                    nama_lengkap: formData.namaRelawan,
                    nik: formData.nik,
                    jenis_kelamin: formData.jenisKelamin,
                    alamat_ktp: formData.alamat,
                    no_hp: formData.no_hp,
                    kelurahan: formData.kelurahan,
                    assignments: formData.assignments.map(a => ({
                        opd_id: a.opd_id || null, // Backend akan otomatis baca opd_id jika ada (kita sudah perbarui ini sebelumnya)
                        opd: a.opd,
                        kader_id: a.kader_id || null,
                        kader: a.kader,
                        peran: a.peran,           // Backend pakai 'peran'
                        detail: a.detail,         // Backend pakai 'detail'
                        statusKeaktifan: a.statusKeaktifan
                    }))
                }])
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                setToast({ message: errData.message || `Server error: ${res.status}`, type: 'error' });
                return;
            }

            const result = await res.json();
            const insertedCount = result.data?.insertedCount ?? 0;
            const hasWarning = (result.data?.errors?.length ?? 0) > 0 || (result.data?.skipped?.length ?? 0) > 0;
            if (result.success && insertedCount > 0) {
                // ✅ Benar-benar berhasil: tutup modal, reset form, toast hijau
                setToast({ message: result.message, type: 'success' });
                setIsModalOpen(false);
                setFormData({
                    namaRelawan: '',
                    nik: '',
                    jenisKelamin: 'L',
                    alamat: '',
                    no_hp: '',
                    kelurahan: '',
                    kader: '',
                    jabatan: '',
                    penugasan: '',
                    detail_penugasan: '',
                    assignments: [{
                        id: Date.now().toString(),
                        opd: '',
                        opd_id: 0,
                        kader: '',
                        kader_id: null,
                        peran: '',
                        detail: '',
                        statusKeaktifan: 'Aktif',
                        nomorSK: '',
                        skId: ''
                    }]
                });
                setKaderOptionsByIndex({});
                fetchRelawan();
            } else {
                const errorMsg = result.data?.errors?.[0]
                    ?? result.data?.skipped?.[0]
                    ?? result.message
                    ?? 'Gagal menambahkan relawan';
                setToast({ message: errorMsg, type: 'error' });
            }
        } catch (err: any) {
            setToast({ message: `Koneksi gagal: ${err?.message || 'unknown error'}`, type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleExcelUploadConfirm = async (data: any[]) => {
        try {
            const res = await apiFetch(`${API_BASE}/bulk`, {
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

    // Line ~360 - Pastikan include kader_id: null
    // DataRelawan.tsx - Update handleAddAssignment (Line ~370)

    const handleAddAssignment = () => {
        const newIndex = formData.assignments.length;

        setFormData(prev => ({
            ...prev,
            assignments: [
                ...prev.assignments,
                {
                    id: Date.now().toString(),
                    opd: isOPD ? ((user as any)?.nama_opd || '') : '',
                    opd_id: isOPD ? ((user as any)?.opd_id || 0) : 0,
                    kader: '',
                    kader_id: null,
                    peran: '',
                    detail: '',
                    statusKeaktifan: 'Aktif' as 'Aktif' | 'Nonaktif',
                    nomorSK: '',
                    skId: ''
                }
            ]
        }));

        // ✅ FIXED: Auto-fetch kader untuk assignment baru jika OPD user
        if (isOPD && (user as any)?.opd_id) {
            fetchKaderByOpdId((user as any).opd_id, newIndex);
        }
    };

    const handleRemoveAssignment = (index: number) => {
        setFormData(prev => ({
            ...prev,
            assignments: prev.assignments.filter((_, i) => i !== index)
        }));
        // Hapus kader options untuk index ini
        setKaderOptionsByIndex(prev => {
            const updated = { ...prev };
            delete updated[index];
            return updated;
        });
    };

    // ── Handler OPD berubah di assignment ──
    const handleAssignmentOpdChange = (index: number, namaOpd: string) => {
        // Cari opd_id dari opdOptions
        const matched = opdOptions.find(o => o.label.toLowerCase() === namaOpd.toLowerCase());
        const opdId = matched ? Number(matched.value) : 0;

        setFormData(prev => {
            const newAssignments = [...prev.assignments];
            newAssignments[index] = {
                ...newAssignments[index],
                opd: namaOpd,
                opd_id: opdId,
                kader: '', // ✨ Reset kader saat OPD berubah
                kader_id: null
            };
            return { ...prev, assignments: newAssignments };
        });

        // Fetch kader sesuai OPD yang dipilih
        if (opdId > 0) {
            fetchKaderByOpdId(opdId, index);
        } else {
            setKaderOptionsByIndex(prev => ({ ...prev, [index]: [] }));
        }
    };

    const handleAssignmentChange = (index: number, field: string, value: string) => {
        setFormData(prev => {
            const newAssignments = [...prev.assignments];
            newAssignments[index] = { ...newAssignments[index], [field]: value };
            return { ...prev, assignments: newAssignments };
        });
    };

    // ✅ TAMBAHKAN FUNCTION INI (baru setelah handleAssignmentChange)
    const handleAssignmentKaderChange = (index: number, namaKader: string) => {
        // namaKader di sini adalah label teks dari AutocompleteInput
        const options = kaderOptionsByIndex[index] || [];
        const matched = options.find(o => o.label.toLowerCase() === namaKader.toLowerCase());
        const kaderId = matched ? Number(matched.value) : null;

        setFormData(prev => {
            const newAssignments = [...prev.assignments];
            newAssignments[index] = {
                ...newAssignments[index],
                kader: namaKader,      // Simpan teks yang diketik/dipilih
                kader_id: kaderId      // ID jika cocok
            };
            return { ...prev, assignments: newAssignments };
        });
    };

    const handleDetailAssignmentChange = (index: number, field: string, value: string) => {
        setDetailFormData(prev => {
            const newAssignments = [...prev.assignments];
            newAssignments[index] = { ...newAssignments[index], [field]: value };
            return { ...prev, assignments: newAssignments };
        });
    };

    const handleDetailAssignmentOpdChange = (index: number, namaOpd: string) => {
        const matched = opdOptions.find(o => o.label.toLowerCase() === namaOpd.toLowerCase());
        const opdId = matched ? Number(matched.value) : 0;

        setDetailFormData(prev => {
            const newAssignments = [...prev.assignments];
            newAssignments[index] = {
                ...newAssignments[index],
                opd: namaOpd,
                opd_id: opdId,
                kader: '',
                kader_id: null
            } as any;
            return { ...prev, assignments: newAssignments };
        });

        if (opdId > 0) fetchKaderByOpdId(opdId, index);
        else setKaderOptionsByIndex(prev => ({ ...prev, [index]: [] }));
    };

    const handleDetailAssignmentKaderChange = (index: number, value: string) => {
        const kaderId = value ? Number(value) : null;
        const options = kaderOptionsByIndex[index] || [];
        const matched = options.find(o => o.value === value);
        const kaderName = matched ? matched.label : '';

        setDetailFormData(prev => {
            const newAssignments = [...prev.assignments];
            newAssignments[index] = {
                ...newAssignments[index],
                kader: kaderName,
                kader_id: kaderId
            } as any;
            return { ...prev, assignments: newAssignments };
        });
    };

    const handleSaveEdit = async () => {
        if (!selectedRelawan) return;

        if (!hasChanges) {
            setToast({ message: 'Tidak ada data yang diubah', type: 'error' });
            return;
        }

        setIsSavingEdit(true);
        try {
            const relawanId = (selectedRelawan as any).relawan_id;
            const endpoint = isSuperAdmin
                ? `/admin/relawan/${relawanId}`
                : `/opd-admin/relawan/${relawanId}`;

            const res = await apiFetch(endpoint, {
                method: 'PUT',
                body: JSON.stringify({
                    nama_lengkap: detailFormData.namaRelawan,
                    alamat_ktp: detailFormData.alamat,
                    no_hp: detailFormData.no_hp,
                    kelurahan: detailFormData.kelurahan,
                    jenis_kelamin: detailFormData.jenisKelamin,
                    assignments: detailFormData.assignments.map(a => ({
                        penugasan_id: !String((a as any).id).startsWith('new-') && !isNaN(parseInt((a as any).id)) ? parseInt((a as any).id) : undefined,
                        opd_id: (a as any).opd_id || null,
                        opd: a.opd,
                        kader_id: (a as any).kader_id || null,
                        peran: a.peran,
                        detail: a.detail,
                        statusKeaktifan: a.statusKeaktifan
                    }))
                })
            });
            const result = await res.json();
            if (result.success) {
                setToast({ message: result.message, type: 'success' });
                setIsEditMode(false);
                setIsDetailModalOpen(false);
                fetchRelawan();
            } else {
                setToast({ message: result.message || 'Gagal menyimpan perubahan', type: 'error' });
            }
        } catch {
            setToast({ message: 'Tidak dapat terhubung ke server', type: 'error' });
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleDeletePenugasan = async (penugasanId: number, index: number) => {
        // Jika penugasan baru (belum tersimpan), langsung hapus dari state
        if (!penugasanId) {
            setDetailFormData(prev => ({
                ...prev,
                assignments: prev.assignments.filter((_, i) => i !== index)
            }));
            return;
        }

        // ✅ FIX: Tampilkan confirm dialog dengan info penugasan
        const assignment = detailFormData.assignments[index] as any;
        const label = [
            selectedRelawan?.namaLengkap,
            assignment.opd ? `dari ${assignment.opd}` : '',
            assignment.kader ? `(Kader: ${assignment.kader})` : '',
            assignment.peran ? `— ${assignment.peran}` : '',
        ].filter(Boolean).join(' ');

        setDeleteConfirm({ penugasanId, index, label });
    };

    // ✅ FIX: Fungsi eksekusi hapus setelah konfirmasi
    const handleConfirmDelete = async () => {
        if (!deleteConfirm) return;
        const { penugasanId, index } = deleteConfirm;
        setDeleteConfirm(null);

        setDeletingPenugasanId(penugasanId);
        try {
            const endpoint = isSuperAdmin
                ? `/admin/relawan/penugasan/${penugasanId}`
                : `/opd-admin/relawan/penugasan/${penugasanId}`;
            const res = await apiFetch(endpoint, { method: 'DELETE' });
            const result = await res.json();
            if (result.success) {
                // ✅ FIX: Update detailFormData DAN selectedRelawan sekaligus
                const updatedAssignments = detailFormData.assignments.filter((_, i) => i !== index);
                setDetailFormData(prev => ({ ...prev, assignments: updatedAssignments }));
                setSelectedRelawan(prev => prev ? { ...prev, assignments: updatedAssignments } : null);
                fetchRelawan(); // ✅ Refresh data background
                setToast({ message: 'Penugasan berhasil dihapus', type: 'success' });
            } else {
                setToast({ message: result.message || 'Gagal menghapus penugasan', type: 'error' });
            }
        } catch {
            setToast({ message: 'Tidak dapat terhubung ke server', type: 'error' });
        } finally {
            setDeletingPenugasanId(null);
        }
    };

    const handleAddDetailAssignment = () => {
        setDetailFormData(prev => ({
            ...prev,
            assignments: [
                ...prev.assignments,
                {
                    id: `new-${Date.now()}`,
                    opd: isOPD ? ((user as any)?.nama_opd || '') : '',
                    opd_id: isOPD ? ((user as any)?.opd_id || 0) : 0,
                    kader: '',
                    kader_id: null,
                    peran: '',
                    detail: '',
                    statusKeaktifan: 'Aktif' as 'Aktif' | 'Nonaktif',
                    nomorSK: '',
                    skId: ''
                } as any
            ]
        }));
        // Auto-fetch kader jika OPD
        if (isOPD && (user as any)?.opd_id) {
            const newIndex = detailFormData.assignments.length;
            fetchKaderByOpdId((user as any).opd_id, newIndex);
        }
    };

    const renderAssignmentFields = (
        assignment: any,
        index: number,
        isReadOnly: boolean,
        context: 'form' | 'detail' = 'form',
        // ← Tambah parameter baru
        handlers?: {
            onFieldChange?: (index: number, field: string, value: string) => void;
            onOpdChange?: (index: number, val: string) => void;
            onKaderChange?: (index: number, val: string) => void;
        }
    ) => {
        // Kader options: jika form → pakai yang dinamis, jika detail → pakai semua kader
        const currentKaderOptions = context === 'form'
            ? (kaderOptionsByIndex[index] || [])
            : [];

        const isKaderLoading = isLoadingKaderByIndex[index] || false;
        // ✅ FIXED: Untuk OPD user, OPD selalu dianggap selected (karena auto-filled)
        const hasOpdSelected = isOPD || assignment.opd_id > 0 || assignment.opd !== '';
        const onFieldChange = handlers?.onFieldChange ?? handleAssignmentChange;
        const onOpdChange = handlers?.onOpdChange ?? handleAssignmentOpdChange;
        const onKaderChange = handlers?.onKaderChange ?? handleAssignmentKaderChange;

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

                {/* OPD Field */}
                <div className="grid grid-cols-3 gap-4 items-start">
                    <label className="text-lg font-medium text-gray-900 pt-2">OPD</label>
                    <div className="col-span-2">
                        {/* ✨ FIXED: Tambahkan (user as any) di value */}
                        {isOPD ? (
                            <input
                                type="text"
                                disabled
                                value={assignment.opd || (user as any)?.nama_opd || 'Instansi Anda'}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 italic cursor-not-allowed"
                            />
                        ) : (
                            <AutocompleteInput
                                name={`opd-${index}`}
                                value={assignment.opd}
                                options={opdOptions}
                                onChange={(val) => onOpdChange ? onOpdChange(index, val) : onFieldChange(index, 'opd', val)}
                                placeholder="Cari nama OPD..."
                                disabled={isReadOnly}
                            />
                        )}
                        {/* Indikator OPD valid (Hanya untuk Super Admin) */}
                        {!isReadOnly && !isOPD && assignment.opd_id > 0 && (
                            <p className="mt-1 text-xs text-green-600 font-medium">✓ OPD ditemukan</p>
                        )}
                    </div>
                </div>

                {/* Kader Field — dinamis berdasarkan OPD */}
                <div className="grid grid-cols-3 gap-4 items-start">
                    <label className="text-lg font-medium text-gray-900 pt-2">Kader</label>
                    <div className="col-span-2">
                        {context === 'form' ? (
                            <>
                                <AutocompleteInput
                                    name={`kader-${index}`}
                                    value={assignment.kader}
                                    options={currentKaderOptions}
                                    onChange={(val) => onKaderChange(index, val)}
                                    placeholder={
                                        !hasOpdSelected
                                            ? 'Pilih OPD terlebih dahulu...'
                                            : isKaderLoading
                                                ? 'Memuat kader...'
                                                : currentKaderOptions.length === 0
                                                    ? 'Tidak ada kader di OPD ini'
                                                    : 'Cari nama Kader...'
                                    }
                                    disabled={isReadOnly || !hasOpdSelected || isKaderLoading}
                                    warnIfNotFound={false}
                                />
                                {/* Info jumlah kader tersedia */}
                                {!isReadOnly && hasOpdSelected && !isKaderLoading && currentKaderOptions.length > 0 && (
                                    <p className="mt-1 text-xs text-blue-500">
                                        {currentKaderOptions.length} kader tersedia di OPD ini
                                    </p>
                                )}
                                {/* Warning jika OPD tidak punya kader */}
                                {!isReadOnly && hasOpdSelected && !isKaderLoading && currentKaderOptions.length === 0 && assignment.opd_id > 0 && (
                                    <p className="mt-1 text-xs text-yellow-600">
                                        ⚠️ OPD ini belum memiliki kader
                                    </p>
                                )}
                            </>
                        ) : (
                            <AutocompleteInput
                                name={`kader-${index}`}
                                value={assignment.kader}
                                options={assignment.kader ? [{ label: assignment.kader, value: assignment.kader }] : []}
                                onChange={() => { }}
                                placeholder="Kader"
                                disabled={true}
                            />
                        )}
                    </div>
                </div>

                {/* Peran/Jabatan */}
                <div className="grid grid-cols-3 gap-4 items-center">
                    <label className="text-lg font-medium text-gray-900">Peran/Jabatan</label>
                    <select
                        value={assignment.peran}
                        onChange={(e) => onFieldChange(index, 'peran', e.target.value)}
                        disabled={isReadOnly}
                        className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                    >
                        <option value="">-- Pilih Jabatan --</option>
                        <option value="Ketua">Ketua</option>
                        <option value="Wakil">Wakil</option>
                        <option value="Sekretaris">Sekretaris</option>
                        <option value="Bendahara">Bendahara</option>
                        <option value="Seksi">Seksi</option>
                        <option value="Anggota">Anggota</option>
                        <option value="Lainnya">Lainnya</option>
                    </select>
                </div>

                {/* Detail Jabatan */}
                <div className="grid grid-cols-3 gap-4 items-center">
                    <label className="text-lg font-medium text-gray-900">Detail Jabatan</label>
                    <input
                        type="text"
                        value={assignment.detail}
                        onChange={(e) => onFieldChange(index, 'detail', e.target.value)}
                        placeholder="Detail jabatan (contoh: Anggota Umum Bidang X)"
                        disabled={isReadOnly}
                        className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                    />
                </div>

                {/* Status Keaktifan */}
                <div className="grid grid-cols-3 gap-4 items-center mt-2">
                    <label className="text-lg font-medium text-gray-900">Status Keaktifan</label>
                    <div className="col-span-2 flex items-center gap-6">
                        {['Aktif', 'Nonaktif'].map(status => (
                            <label key={status} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name={`statusKeaktifan-${index}`}
                                    value={status}
                                    checked={assignment.statusKeaktifan === status}
                                    onChange={(e) => onFieldChange(index, 'statusKeaktifan', e.target.value)}
                                    disabled={isReadOnly}
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-gray-700">{status}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        );
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
                ) : pengajuanUIData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <p className="text-gray-600 font-medium">Belum ada pengajuan</p>
                        <p className="text-sm text-gray-400 mt-1">Saat ini belum ada relawan yang mengajukan perubahan data.</p>
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
                ) : filteredRelawanData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <p className="text-gray-600 font-medium">Belum ada relawan</p>
                        <p className="text-sm text-gray-400 mt-1">
                            {searchTerm
                                ? 'Tidak ada relawan yang cocok dengan pencarian Anda.'
                                : 'Belum ada relawan yang terdaftar. Klik "Tambah Relawan" untuk memulai.'}
                        </p>
                    </div>
                ) : (
                    <Table columns={relawanColumns} data={currentRelawanData} actions={relawanActions} minRows={5} />
                )}

                {!isLoadingRelawan && filteredRelawanData.length > 0 && (
                    <div className="mt-4 flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                            Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredRelawanData.length)} dari {filteredRelawanData.length} Relawan
                        </div>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={(page) => setCurrentPage(page)}
                        />
                    </div>
                )}
            </Card>

            {/* Modal Tambah Relawan */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Relawan Baru" subtitle="Isi data relawan yang ingin ditambahkan" maxWidth="2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {[
                        { label: 'Nama Relawan', name: 'namaRelawan', required: true, placeholder: 'Nama Lengkap Relawan' },
                        { label: 'NIK', name: 'nik', required: true, placeholder: '16 digit NIK', maxLength: 16 },
                        { label: 'Alamat KTP', name: 'alamat', placeholder: 'Alamat sesuai KTP' },
                        { label: 'No. HP', name: 'no_hp', placeholder: 'Nomor HP' },
                        { label: 'Kelurahan', name: 'kelurahan', placeholder: 'Kelurahan/Desa' },
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

                    {/* Daftar Penugasan */}
                    <div className="pt-4 border-t border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daftar Penugasan:</h3>
                        {formData.assignments.map((assignment, index) =>
                            renderAssignmentFields(assignment, index, false)
                        )}
                        <div className="flex justify-center mt-4">
                            <Button type="button" variant="primary" size="sm" onClick={handleAddAssignment}>
                                <Plus size={16} />
                                Tambah Data Penugasan
                            </Button>
                        </div>
                    </div>

                    <div className="flex justify-end pt-6">
                        <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-12">
                            Simpan
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal Detail Relawan */}
            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => { setIsDetailModalOpen(false); setIsEditMode(false); }}
                title="Detail Relawan"
                subtitle={isEditMode ? 'Mode Edit — ubah data lalu klik Simpan' : 'Informasi lengkap relawan'}
                maxWidth="2xl"
            >
                {selectedRelawan && (
                    <div className="space-y-6">
                        {/* Tombol Edit / Batal di pojok atas */}
                        <div className="flex justify-end">
                            {!isEditMode ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsEditMode(true)}
                                    className="border-blue-500 text-blue-600 hover:bg-blue-50"
                                >
                                    Edit Data
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => { setIsEditMode(false); handleDetailClick(selectedRelawan); }}
                                    className="border-gray-400 text-gray-600 hover:bg-gray-50"
                                >
                                    Batal
                                </Button>
                            )}
                        </div>

                        {/* Field profil — editable saat isEditMode */}
                        {[
                            { label: 'Nama Relawan', name: 'namaRelawan' },
                            { label: 'NIK', name: 'nik' },
                            { label: 'Alamat KTP', name: 'alamat' },
                            { label: 'No. HP', name: 'no_hp' },
                            { label: 'Kelurahan', name: 'kelurahan' },
                            { label: 'Jabatan', name: 'jabatan' },
                        ].map(field => (
                            <div key={field.name} className="grid grid-cols-3 gap-4 items-center">
                                <label className="text-lg font-medium text-gray-900">{field.label}</label>
                                <input
                                    type="text"
                                    value={(detailFormData as any)[field.name]}
                                    readOnly={!isEditMode || field.name === 'nik' || field.name === 'jabatan'}
                                    onChange={(e) => setDetailFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                                    className={`col-span-2 px-4 py-2 border rounded-lg focus:outline-none
                                        ${isEditMode && field.name !== 'nik' && field.name !== 'jabatan'
                                            ? 'border-blue-300 focus:ring-2 focus:ring-blue-500 bg-white'
                                            : 'border-gray-300 bg-gray-50'}`}
                                />
                            </div>
                        ))}

                        <div className="grid grid-cols-3 gap-4 items-center">
                            <label className="text-lg font-medium text-gray-900">Jenis Kelamin</label>
                            <select
                                value={detailFormData.jenisKelamin}
                                disabled={!isEditMode}
                                onChange={(e) => setDetailFormData(prev => ({ ...prev, jenisKelamin: e.target.value as 'L' | 'P' }))}
                                className={`col-span-2 px-4 py-2 border rounded-lg focus:outline-none
                                    ${isEditMode ? 'border-blue-300 bg-white' : 'bg-gray-50 border-gray-300 text-gray-500 cursor-not-allowed'}`}
                            >
                                <option value="L">Laki-laki (L)</option>
                                <option value="P">Perempuan (P)</option>
                            </select>
                        </div>

                        {/* Daftar Penugasan */}
                        <div className="pt-4 border-t border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Daftar Penugasan:</h3>
                            {Array.isArray(detailFormData.assignments) && detailFormData.assignments.length > 0 ? (
                                detailFormData.assignments.map((assignment, index) => {
                                    const penugasanId = parseInt((assignment as any).id);
                                    const isNewAssignment = isNaN(penugasanId) || String((assignment as any).id).startsWith('new-');
                                    return (
                                        <div key={(assignment as any).id} className="relative bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4 space-y-4">
                                            {/* Tombol hapus penugasan — hanya di edit mode */}
                                            {isEditMode && (
                                                <div className="flex justify-end -mt-2 -mr-2 mb-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeletePenugasan(isNewAssignment ? 0 : penugasanId, index)}
                                                        disabled={deletingPenugasanId === penugasanId}
                                                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Hapus Penugasan"
                                                    >
                                                        {deletingPenugasanId === penugasanId
                                                            ? <Loader2 size={18} className="animate-spin" />
                                                            : <X size={18} />}
                                                    </button>
                                                </div>
                                            )}
                                            {renderAssignmentFields(
                                                assignment,
                                                index,
                                                !isEditMode,
                                                isEditMode ? 'form' : 'detail',
                                                isEditMode ? {
                                                    onFieldChange: handleDetailAssignmentChange,
                                                    onOpdChange: handleDetailAssignmentOpdChange,
                                                    onKaderChange: handleDetailAssignmentKaderChange,
                                                } : undefined
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center text-gray-500 italic py-4">Belum ada penugasan terdaftar.</div>
                            )}

                            {/* Tombol tambah penugasan — hanya di edit mode */}
                            {isEditMode && (
                                <div className="flex justify-center mt-2">
                                    <Button type="button" variant="primary" size="sm" onClick={handleAddDetailAssignment}>
                                        <Plus size={16} />
                                        Tambah Penugasan
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Footer tombol Simpan — hanya di edit mode */}
                        {isEditMode && (
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                <Button
                                    onClick={() => { setIsEditMode(false); handleDetailClick(selectedRelawan); }}
                                    className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-6"
                                >
                                    Batal
                                </Button>
                                <Button
                                    onClick={handleSaveEdit}
                                    disabled={isSavingEdit}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-10 disabled:opacity-50"
                                >
                                    {isSavingEdit ? <Loader2 size={16} className="animate-spin" /> : 'Simpan Perubahan'}
                                </Button>
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

                        {/* Menampilkan Data Baru yang diajukan jika ada */}
                        {selectedPengajuan.data_baru && (() => {
                            const dataBaru = typeof selectedPengajuan.data_baru === 'string'
                                ? JSON.parse(selectedPengajuan.data_baru)
                                : selectedPengajuan.data_baru;

                            if (Object.keys(dataBaru).length === 0) return null;

                            return (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2 mt-4">
                                    <p className="text-sm font-medium text-yellow-800">Detail Perubahan yang Diajukan</p>
                                    <div className="grid grid-cols-2 gap-2 text-sm text-yellow-700">
                                        {dataBaru.nama_lengkap && (
                                            <>
                                                <span className="font-medium">Nama Lengkap Baru:</span>
                                                <span className="font-semibold">{dataBaru.nama_lengkap}</span>
                                            </>
                                        )}
                                        {dataBaru.alamat_ktp && (
                                            <>
                                                <span className="font-medium">Alamat KTP Baru:</span>
                                                <span className="font-semibold">{dataBaru.alamat_ktp}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}


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
                            <Button onClick={() => handleReview('Ditolak')} disabled={!isDataChecked || isReviewing} className="bg-red-600 hover:bg-red-700 text-white px-6 disabled:opacity-50">
                                {isReviewing ? <Loader2 size={16} className="animate-spin" /> : 'Tolak'}
                            </Button>
                            <Button onClick={() => handleReview('Disetujui')} disabled={!isDataChecked || isReviewing} className="bg-green-600 hover:bg-green-700 text-white px-6 disabled:opacity-50">
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
            {/* Modal Konfirmasi Hapus Penugasan */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
                    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Hapus Penugasan?</h3>
                        <p className="text-sm text-gray-600">
                            Apakah Anda yakin ingin menghapus penugasan{' '}
                            <span className="font-medium text-gray-800">"{deleteConfirm.label}"</span>?
                            Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <div className="flex justify-end gap-3 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setDeleteConfirm(null)}
                                className="px-6"
                            >
                                Batal
                            </Button>
                            <Button
                                onClick={handleConfirmDelete}
                                className="bg-red-600 hover:bg-red-700 text-white px-6"
                            >
                                Ya, Hapus
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default DataRelawan;
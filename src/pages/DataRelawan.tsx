//DataRelawan.tsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Plus, Upload, Loader2, X, FileDown } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { SearchInput } from '../components/ui/Input';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import AutocompleteInput from '../components/ui/AutocompleteInput';
import UploadExcelModal from '../components/ui/UploadExcelModal';
import Toast, { ToastType } from '../components/ui/Toast';
import Pagination from '../components/ui/Pagination';
import { RelawanData, Assignment, PengajuanAPIData } from '../types/relawan.types';
import { AutoOption } from '../types/common.types';
import { useAuth } from '../context/AuthContext';
import { useRelawanList, RELAWAN_KEYS } from '../hooks/relawan/useRelawanList';
import { usePengajuanList, PENGAJUAN_KEYS } from '../hooks/relawan/usePengajuanList';
import { useOpdList } from '../hooks/opd/useOpdList';
import { useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/axios';
import { parseErrorMessage } from '../utils/parseErrorMessage';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatPhoneDisplay } from '../utils/formatPhone';


const DataRelawan: React.FC = () => {
    const { isSuperAdmin, isOPD, user } = useAuth();
    const API_BASE = isSuperAdmin ? '/admin/relawan' : '/opd-admin/relawan';
    const qc = useQueryClient();

    // ── Server State (TanStack Query) ─────────────────────────────
    const { data: relawanList = [], isLoading: isLoadingRelawan } = useRelawanList(!!isSuperAdmin);
    const { data: pengajuanList = [], isLoading: isLoadingPengajuan } = usePengajuanList(!!isSuperAdmin);
    const { data: opdListData = [] } = useOpdList();

    // OPD options untuk autocomplete
    const opdOptions = useMemo<AutoOption[]>(
        () => opdListData.map(o => ({ label: o.nama_opd, value: String(o.opd_id) })),
        [opdListData]
    );

    // Cache kader per opd_id agar setiap row assignment bisa punya sumber data sendiri
    const [kaderOptionsByOpdId, setKaderOptionsByOpdId] = useState<Record<number, AutoOption[]>>({});
    const [loadingOpdIds, setLoadingOpdIds] = useState<Record<number, boolean>>({});


    const [isReviewing, setIsReviewing] = useState(false);
    const [isSaving, setIsSaving] = useState(false); // untuk loading tombol submit tambah relawan

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

    const createEmptyAssignment = (prefix: 'new' | 'time' = 'time'): Assignment => ({
        id: prefix === 'new' ? `new-${Date.now()}` : Date.now().toString(),
        opd: isOPD ? ((user as any)?.nama_opd || '') : '',
        opd_id: isOPD ? ((user as any)?.opd_id || 0) : 0,
        kader: '',
        kader_id: null,
        peran: '',
        penugasan: '',
        detail: '',
        statusKeaktifan: 'Aktif' as 'Aktif' | 'Nonaktif',
        nomorSK: '',
        skId: ''
    });


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
        const orig = selectedRelawan;
        // Field-level comparison — tidak perlu JSON.stringify array
        if (
            detailFormData.namaRelawan !== orig.namaLengkap ||
            detailFormData.nik !== orig.nik ||
            detailFormData.alamat !== orig.alamat ||
            detailFormData.no_hp !== orig.no_hp ||
            detailFormData.kelurahan !== orig.kelurahan ||
            detailFormData.jenisKelamin !== (orig.jenisKelamin || 'L')
        ) return true;
        // Assignment length change
        const origAssign = orig.assignments ?? [];
        if (detailFormData.assignments.length !== origAssign.length) return true;
        // Deep compare per field (cheaper than JSON.stringify karena exit-early)
        return detailFormData.assignments.some((a, i) => {
            const o = origAssign[i] as any;
            return !o ||
                a.opd !== o.opd ||
                a.kader !== o.kader ||
                a.peran !== o.peran ||
                a.penugasan !== o.penugasan ||
                a.statusKeaktifan !== o.statusKeaktifan;
        });
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
        assignments: [] as Assignment[]
    });

    const fetchKaderOptionsForOpd = useCallback(async (opdId: number) => {
        if (opdId <= 0) return;
        if (kaderOptionsByOpdId[opdId]) return;
        if (loadingOpdIds[opdId]) return;

        setLoadingOpdIds(prev => ({ ...prev, [opdId]: true }));
        try {
            const endpoint = isOPD ? '/opd-admin/kader' : `/kader?opd_id=${opdId}`;
            const { data } = await apiClient.get(endpoint);
            const options: AutoOption[] = data?.success
                ? (data.data as any[]).map((k) => ({
                    label: k.nama_kader as string,
                    value: String(k.kader_id),
                }))
                : [];
            setKaderOptionsByOpdId(prev => ({ ...prev, [opdId]: options }));
        } catch {
            setKaderOptionsByOpdId(prev => ({ ...prev, [opdId]: [] }));
        } finally {
            setLoadingOpdIds(prev => ({ ...prev, [opdId]: false }));
        }
    }, [isOPD, kaderOptionsByOpdId, loadingOpdIds]);

    // Prefetch kader untuk semua OPD yang muncul di assignment aktif (form/detail)
    useEffect(() => {
        const assignments = isEditMode ? detailFormData.assignments : formData.assignments;
        const opdIds = Array.from(new Set(
            assignments
                .map(a => Number((a as any).opd_id || 0))
                .filter(id => id > 0)
        ));
        opdIds.forEach((opdId) => { void fetchKaderOptionsForOpd(opdId); });
    }, [isEditMode, detailFormData.assignments, formData.assignments, fetchKaderOptionsForOpd]);

    // kaderOptionsByIndex — mapping row assignment -> options sesuai opd_id row tsb
    const kaderOptionsByIndex = useMemo<Record<number, AutoOption[]>>(() => {
        const result: Record<number, AutoOption[]> = {};
        const assignments = isEditMode ? detailFormData.assignments : formData.assignments;
        assignments.forEach((a, i) => {
            const opdId = Number((a as any).opd_id || 0);
            result[i] = opdId > 0 ? (kaderOptionsByOpdId[opdId] || []) : [];
        });
        return result;
    }, [kaderOptionsByOpdId, formData.assignments, detailFormData.assignments, isEditMode]);

    const isLoadingKaderByIndex = useMemo<Record<number, boolean>>(() => {
        const result: Record<number, boolean> = {};
        const assignments = isEditMode ? detailFormData.assignments : formData.assignments;
        assignments.forEach((a, i) => {
            const opdId = Number((a as any).opd_id || 0);
            result[i] = opdId > 0 ? !!loadingOpdIds[opdId] : false;
        });
        return result;
    }, [loadingOpdIds, formData.assignments, detailFormData.assignments, isEditMode]);

    // ── fetchKaderByOpdId — trigger fetch per-opd_id (per row) ──
    const fetchKaderByOpdId = useCallback((opdId: number, _assignmentIndex: number) => {
        const normalizedOpdId = opdId > 0 ? opdId : (isOPD ? ((user as any)?.opd_id ?? 0) : 0);
        if (normalizedOpdId > 0) void fetchKaderOptionsForOpd(normalizedOpdId);
    }, [isOPD, user, fetchKaderOptionsForOpd]);

    // ── Invalidate cache setelah mutasi ──
    const invalidateRelawan = useCallback(() =>
        qc.invalidateQueries({ queryKey: RELAWAN_KEYS.all }),
    [qc]);
    const invalidatePengajuan = useCallback(() =>
        qc.invalidateQueries({ queryKey: PENGAJUAN_KEYS.all }),
    [qc]);


    const filteredRelawanData = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        return relawanList.filter(relawan => {
            const matchNama = relawan.namaLengkap?.toLowerCase().includes(lowerSearch) || false;
            const matchNik = relawan.nik?.toLowerCase().includes(lowerSearch) || false;
            const matchAlamat = relawan.alamat?.toLowerCase().includes(lowerSearch) || false;
            const matchKelurahan = relawan.kelurahan?.toLowerCase().includes(lowerSearch) || false;
            
            const matchAssignment = relawan.assignments?.some(a => 
                a.opd?.toLowerCase().includes(lowerSearch) ||
                a.kader?.toLowerCase().includes(lowerSearch)
            ) || false;

            return matchNama || matchNik || matchAlamat || matchKelurahan || matchAssignment;
        });
    }, [relawanList, searchTerm]);

    // ── Export PDF seluruh data relawan yang difilter ──
    const handleExportPdf = useCallback(() => {
        const doc = new jsPDF({ orientation: 'landscape' });
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Data Relawan', 14, 16);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}  |  Total: ${filteredRelawanData.length} relawan`, 14, 23);
        doc.setTextColor(0);
        autoTable(doc, {
            startY: 28,
            head: [['No', 'Nama Lengkap', 'NIK', 'Alamat KTP', 'Kelurahan', 'Jenis Kelamin', 'OPD / Penugasan', 'Kader']],
            body: filteredRelawanData.map((r, i) => [
                i + 1,
                r.namaLengkap || '-',
                r.nik || '-',
                r.alamat || '-',
                r.kelurahan || '-',
                r.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan',
                r.assignments && r.assignments.length > 0
                    ? [...new Set(r.assignments.map((a: any) => a.opd).filter(Boolean))].join(', ') || r.penugasan || '-'
                    : r.penugasan || '-',
                r.assignments && r.assignments.length > 0
                    ? [...new Set(r.assignments.map((a: any) => a.kader).filter(Boolean))].join(', ') || r.kader || '-'
                    : r.kader || '-',
            ]),
            styles: { fontSize: 8, cellPadding: 3 },
            headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [240, 253, 244] },
            columnStyles: {
                0: { cellWidth: 10, halign: 'center' },
                2: { cellWidth: 35 },
                5: { cellWidth: 22, halign: 'center' },
            },
            margin: { left: 14, right: 14 },
        });
        doc.save(`data-relawan-${new Date().toISOString().slice(0,10)}.pdf`);
    }, [filteredRelawanData]);

    const totalPages = Math.ceil(filteredRelawanData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentRelawanData = filteredRelawanData.slice(startIndex, endIndex);

    const pengajuanUIData = useMemo(() => pengajuanList.map(p => ({
        nik: p.nik,
        namaLengkap: p.nama_lengkap,
        tanggalPengajuan: new Date(p.tanggal_pengajuan).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
        status: p.status,
        _raw: p
    })), [pengajuanList]);

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
        const assignments = Array.isArray(relawan.assignments) ? relawan.assignments : [];
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
            assignments: assignments
        });

        // Prefetch kader untuk semua OPD milik relawan ini agar warning/opsi kader akurat per row
        assignments.forEach((a: any) => {
            const opdId = Number(a?.opd_id || 0);
            if (opdId > 0) void fetchKaderOptionsForOpd(opdId);
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
            const endpoint = isSuperAdmin
                ? `/admin/relawan/pengajuan/${selectedPengajuan.pengajuan_id}/review`
                : `/opd-admin/relawan/pengajuan/${selectedPengajuan.pengajuan_id}/review`;
            const { data } = await apiClient.post(endpoint, { status, catatan_verifikator: verificationNote });
            if (data.success) {
                setToast({ message: data.message, type: 'success' });
                setIsReviewModalOpen(false);
                invalidatePengajuan();
                if (status === 'Disetujui') invalidateRelawan();
            } else {
                setToast({ message: data.message || 'Gagal memproses pengajuan', type: 'error' });
            }
        } catch (e: any) {
            setToast({ message: parseErrorMessage(e, 'Tidak dapat terhubung ke server'), type: 'error' });
        } finally {
            setIsReviewing(false);
        }
    };

    //  BENAR: Object tunggal untuk form manual
    //  BENAR: Object tunggal untuk form manual
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        //  Validasi semua data pribadi
        if (!formData.namaRelawan.trim() || !formData.nik.trim() || !formData.alamat.trim() || !formData.no_hp.trim() || !formData.kelurahan.trim()) {
            setToast({ message: 'Semua data pribadi wajib diisi', type: 'error' });
            return;
        }
        if (formData.namaRelawan.trim().length < 3) {
            setToast({ message: 'Nama Lengkap minimal 3 karakter', type: 'error' });
            return;
        }
        if (!/^[a-zA-Z\s]+$/.test(formData.namaRelawan)) {
            setToast({ message: 'Nama Lengkap tidak boleh mengandung angka atau karakter spesial', type: 'error' });
            return;
        }

        //  Validasi minimal 1 assignment (Dihapus karena penugasan sekarang opsional saat tambah relawan)
        
        //  Validasi OPD, Kader, Peran, Detail, Penugasan
        const hasInvalidAssignment = formData.assignments.some(
            (a) => !a.opd || !a.kader || !a.peran || !a.penugasan || !a.detail
        );
        if (hasInvalidAssignment) {
            setToast({ message: 'Semua kolom pada setiap penugasan wajib diisi.', type: 'error' });
            return;
        }

        setIsSaving(true);
        try {
            const { data } = await apiClient.post(`${API_BASE}/bulk`, [{
                nama_lengkap: formData.namaRelawan,
                nik: formData.nik,
                jenis_kelamin: formData.jenisKelamin,
                alamat_ktp: formData.alamat,
                no_hp: formData.no_hp.replace(/\D/g, ''),
                kelurahan: formData.kelurahan,
                assignments: formData.assignments.map(a => ({
                    opd_id: a.opd_id || null,
                    opd: a.opd,
                    kader_id: a.kader_id || null,
                    kader: a.kader,
                    peran: a.peran,
                    penugasan: a.penugasan,
                    detail: a.detail,
                    statusKeaktifan: a.statusKeaktifan
                }))
            }]);
            const errors  = data?.data?.errors  ?? [];
            const skipped = data?.data?.skipped ?? data?.data?.skippedNIK ?? [];
            if (errors.length > 0 || skipped.length > 0) {
                let errorMsg = data.message || 'Gagal memproses data relawan';
                if (errors.length > 0) errorMsg = typeof errors[0] === 'string' ? errors[0] : JSON.stringify(errors[0]);
                else if (skipped.length > 0) errorMsg = data.message || 'Beberapa NIK sudah terdaftar dan dilewati';
                setToast({ message: errorMsg, type: 'error' });
            } else {
                setToast({ message: data.message || 'Data berhasil diproses', type: 'success' });
                setIsModalOpen(false);
                setFormData({
                    namaRelawan: '', nik: '', jenisKelamin: 'L', alamat: '', no_hp: '',
                    kelurahan: '', kader: '', jabatan: '', penugasan: '', detail_penugasan: '',
                    assignments: []
                });
                invalidateRelawan();
            }
        } catch (e: any) {
            setToast({ message: parseErrorMessage(e, 'Gagal menyimpan data relawan'), type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleExcelUploadConfirm = async (data: any[]) => {
        try {
            const { data: res } = await apiClient.post(`${API_BASE}/bulk`, data);
            if (res.success) {
                setToast({ message: res.message || 'Berhasil memproses Excel', type: 'success' });
                invalidateRelawan();
            } else {
                setToast({ message: res.message || 'Gagal import Excel', type: 'error' });
            }
        } catch (e: any) {
            setToast({ message: parseErrorMessage(e, 'Gagal import data dari Excel'), type: 'error' });
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
                createEmptyAssignment()
            ]
        }));

        //  FIXED: Auto-fetch kader untuk assignment baru jika OPD user
        if (isOPD && (user as any)?.opd_id) {
            fetchKaderByOpdId((user as any).opd_id, newIndex);
        }
    };

    const handleRemoveAssignment = (index: number) => {
        setFormData(prev => ({
            ...prev,
            assignments: prev.assignments.filter((_, i) => i !== index)
        }));
        // options kader per row dihitung otomatis dari cache per opd_id
    };

    // ── Handler OPD berubah di assignment ──
    const handleAssignmentOpdChange = (index: number, namaOpd: string) => {
        const matched = opdOptions.find(o => o.label.toLowerCase() === namaOpd.toLowerCase());
        const opdId = matched ? Number(matched.value) : 0;
        setFormData(prev => {
            const newAssignments = [...prev.assignments];
            newAssignments[index] = { ...newAssignments[index], opd: namaOpd, opd_id: opdId, kader: '', kader_id: null };
            return { ...prev, assignments: newAssignments };
        });
        if (opdId > 0) void fetchKaderOptionsForOpd(opdId);
    };

    const handleAssignmentChange = (index: number, field: string, value: string) => {
        setFormData(prev => {
            const newAssignments = [...prev.assignments];
            newAssignments[index] = { ...newAssignments[index], [field]: value };
            return { ...prev, assignments: newAssignments };
        });
    };

    //  TAMBAHKAN FUNCTION INI (baru setelah handleAssignmentChange)
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
            newAssignments[index] = { ...newAssignments[index], opd: namaOpd, opd_id: opdId, kader: '', kader_id: null } as any;
            return { ...prev, assignments: newAssignments };
        });
        if (opdId > 0) void fetchKaderOptionsForOpd(opdId);
    };

    const handleDetailAssignmentKaderChange = (index: number, value: string) => {
        const options = kaderOptionsByIndex[index] || [];
        const matched = options.find(o => o.label.toLowerCase() === value.toLowerCase());
        const kaderId = matched ? Number(matched.value) : null;
        const kaderName = value;

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
        if (!selectedRelawan || !hasChanges) {
            setToast({ message: 'Tidak ada data yang diubah', type: 'error' });
            return;
        }
        if (!detailFormData.namaRelawan.trim() || detailFormData.namaRelawan.trim().length < 3) {
            setToast({ message: 'Nama Lengkap minimal 3 karakter', type: 'error' });
            return;
        }
        if (!/^[a-zA-Z\s]+$/.test(detailFormData.namaRelawan)) {
            setToast({ message: 'Nama Lengkap tidak boleh mengandung angka atau karakter spesial', type: 'error' });
            return;
        }
        setIsSavingEdit(true);
        try {
            const relawanId = (selectedRelawan as any).relawan_id;
            const endpoint = isSuperAdmin ? `/admin/relawan/${relawanId}` : `/opd-admin/relawan/${relawanId}`;
            const { data } = await apiClient.put(endpoint, {
                nama_lengkap: detailFormData.namaRelawan,
                alamat_ktp: detailFormData.alamat,
                no_hp: detailFormData.no_hp.replace(/\D/g, ''),
                kelurahan: detailFormData.kelurahan,
                jenis_kelamin: detailFormData.jenisKelamin,
                assignments: detailFormData.assignments.map(a => ({
                    penugasan_id: !String((a as any).id).startsWith('new-') && !isNaN(parseInt((a as any).id)) ? parseInt((a as any).id) : undefined,
                    opd_id: (a as any).opd_id || null,
                    opd: a.opd,
                    kader_id: (a as any).kader_id || null,
                    peran: a.peran,
                    penugasan: a.penugasan,
                    detail: a.detail,
                    statusKeaktifan: a.statusKeaktifan
                }))
            });
            if (data.success) {
                setToast({ message: data.message, type: 'success' });
                setIsEditMode(false);
                setIsDetailModalOpen(false);
                invalidateRelawan();
            } else {
                setToast({ message: data.message || 'Gagal menyimpan perubahan', type: 'error' });
            }
        } catch (e: any) {
            setToast({ message: parseErrorMessage(e, 'Gagal menyimpan perubahan'), type: 'error' });
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

        //  FIX: Tampilkan confirm dialog dengan info penugasan
        const assignment = detailFormData.assignments[index] as any;
        const label = [
            selectedRelawan?.namaLengkap,
            assignment.opd ? `dari ${assignment.opd}` : '',
            assignment.kader ? `(Kader: ${assignment.kader})` : '',
            assignment.peran ? `— ${assignment.peran}` : '',
        ].filter(Boolean).join(' ');

        setDeleteConfirm({ penugasanId, index, label });
    };

    //  FIX: Fungsi eksekusi hapus setelah konfirmasi
    const handleConfirmDelete = async () => {
        if (!deleteConfirm) return;
        const { penugasanId, index } = deleteConfirm;
        setDeleteConfirm(null);
        setDeletingPenugasanId(penugasanId);
        try {
            const endpoint = isSuperAdmin
                ? `/admin/relawan/penugasan/${penugasanId}`
                : `/opd-admin/relawan/penugasan/${penugasanId}`;
            const { data } = await apiClient.delete(endpoint);
            if (data.success) {
                const updatedAssignments = detailFormData.assignments.filter((_, i) => i !== index);
                setDetailFormData(prev => ({ ...prev, assignments: updatedAssignments }));
                setSelectedRelawan(prev => prev ? { ...prev, assignments: updatedAssignments } : null);
                invalidateRelawan();
                setToast({ message: 'Penugasan berhasil dihapus', type: 'success' });
            } else {
                setToast({ message: data.message || 'Gagal menghapus penugasan', type: 'error' });
            }
        } catch (e: any) {
            setToast({ message: parseErrorMessage(e, 'Gagal menghapus penugasan'), type: 'error' });
        } finally {
            setDeletingPenugasanId(null);
        }
    };

    const handleAddDetailAssignment = () => {
        setDetailFormData(prev => ({
            ...prev,
            assignments: [
                ...prev.assignments,
                createEmptyAssignment('new') as any
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
        //  FIXED: Untuk OPD user, OPD selalu dianggap selected (karena auto-filled)
        const hasOpdSelected = isOPD || assignment.opd_id > 0 || assignment.opd !== '';
        const onFieldChange = handlers?.onFieldChange ?? handleAssignmentChange;
        const onOpdChange = handlers?.onOpdChange ?? handleAssignmentOpdChange;
        const onKaderChange = handlers?.onKaderChange ?? handleAssignmentKaderChange;

        return (
            <div key={assignment.id} className="relative bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4 space-y-4">
                {!isReadOnly && !handlers && (
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
                        {/*  FIXED: Tambahkan (user as any) di value */}
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
                                        ️ OPD ini belum memiliki kader
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
                        required
                        className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                    />
                </div>

                {/* Penugasan */}
                <div className="grid grid-cols-3 gap-4 items-center">
                    <label className="text-lg font-medium text-gray-900">Penugasan</label>
                    <input
                        type="text"
                        value={assignment.penugasan || ''}
                        onChange={(e) => onFieldChange(index, 'penugasan', e.target.value)}
                        placeholder="Nama/detail penugasan"
                        disabled={isReadOnly}
                        required
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
                    <Button variant="primary" onClick={() => {
                        setFormData({
                            namaRelawan: '', nik: '', jenisKelamin: 'L', alamat: '', no_hp: '',
                            kelurahan: '', kader: '', jabatan: '', penugasan: '', detail_penugasan: '',
                            assignments: []
                        });
                        if (isOPD && (user as any)?.opd_id) {
                            fetchKaderByOpdId((user as any).opd_id, 0);
                        }
                        setIsModalOpen(true);
                    }}>
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
                    {!isLoadingRelawan && filteredRelawanData.length > 0 && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleExportPdf}
                            className="flex items-center gap-2"
                        >
                            <FileDown size={16} />
                            Ekspor PDF
                        </Button>
                    )}
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
                        { label: 'Alamat KTP', name: 'alamat', required: true, placeholder: 'Alamat sesuai KTP' },
                        { label: 'No. HP', name: 'no_hp', required: true, placeholder: 'Nomor HP' },
                        { label: 'Kelurahan', name: 'kelurahan', required: true, placeholder: 'Kelurahan/Desa' },
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
                        <Button type="submit" disabled={isSaving} className="bg-green-600 hover:bg-green-700 text-white px-12 disabled:opacity-50">
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Simpan'}
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
                                    value={!isEditMode && field.name === 'no_hp' ? formatPhoneDisplay((detailFormData as any)[field.name]) : (detailFormData as any)[field.name]}
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
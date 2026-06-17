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
import {dummyKelurahan, dummyKemantren} from '../types/wilayah.types';
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
import { toTitleCase } from '../utils/formatText';
import { REGEX_PATTERNS } from '../utils/regex';

const DataRelawan: React.FC = () => {
    const { isSuperAdmin, isOPD, user } = useAuth();
    const API_BASE = isSuperAdmin ? '/admin/relawan' : '/opd-admin/relawan';
    const qc = useQueryClient();

    // ── Server State (TanStack Query) ─────────────────────────────
    const { data: relawanList = [], isLoading: isLoadingRelawan } = useRelawanList(!!isSuperAdmin);
    const { data: pengajuanList = [], isLoading: isLoadingPengajuan } = usePengajuanList(!!isSuperAdmin);
    const { data: opdListData = [] } = useOpdList(!!isSuperAdmin);

    const opdOptions = useMemo<AutoOption[]>(
        () => opdListData.map(o => ({ label: o.nama_opd, value: String(o.opd_id) })),
        [opdListData]
    );

    const kemantrenOptions = useMemo<AutoOption[]>(
        () => dummyKemantren.map(item => ({ label: item.nama_kemantren, value: item.id })),
        []
    );

    const [kaderOptionsByOpdId, setKaderOptionsByOpdId] = useState<Record<number, AutoOption[]>>({});
    const [loadingOpdIds, setLoadingOpdIds] = useState<Record<number, boolean>>({});

    const [isReviewing, setIsReviewing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // ── STATE PENCARIAN TERPISAH ──
    const [searchTerm, setSearchTerm] = useState<string>(''); // Pencarian Daftar Relawan (Bawah)
    const [searchPengajuan, setSearchPengajuan] = useState<string>(''); // Pencarian Pengajuan (Atas)

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
    
    const [selectedRelawan, setSelectedRelawan] = useState<RelawanData | null>(null);
    const [selectedPengajuan, setSelectedPengajuan] = useState<PengajuanAPIData | null>(null);
    const [verificationNote, setVerificationNote] = useState<string>('');
    const [isDataChecked, setIsDataChecked] = useState<boolean>(false);
    
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    
    // ── STATE PAGINATION TERPISAH UNTUK 2 TABEL ──
    const [currentPage, setCurrentPage] = useState<number>(1); // Untuk Tabel Relawan
    const [currentPengajuanPage, setCurrentPengajuanPage] = useState<number>(1); // Untuk Tabel Pengajuan
    const itemsPerPage = 5;
    const pengajuanItemsPerPage = 3;

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
        status_keaktifan: 'Aktif' as 'Aktif' | 'Tidak Aktif',
        nomorSK: '',
        skId: ''
    });

    const normalizeStatusKeaktifan = useCallback((status?: string) => {
        return status === 'Aktif' ? 'Aktif' : 'Tidak Aktif';
    }, []);

    const [detailFormData, setDetailFormData] = useState({
        namaRelawan: '', nik: '', alamat: '', no_hp: '', kemantren: '', kelurahan: '',
        kader: '', jabatan: '', penugasan: '', jenisKelamin: 'L' as 'L' | 'P',
        assignments: [] as Assignment[]
    });

    const hasChanges = useMemo(() => {
        if (!selectedRelawan) return false;
        const orig = selectedRelawan;
        if (
            detailFormData.namaRelawan !== orig.namaLengkap ||
            detailFormData.nik !== orig.nik ||
            detailFormData.alamat !== orig.alamat ||
            detailFormData.no_hp !== orig.no_hp ||
            detailFormData.kemantren !== orig.kemantren ||
            detailFormData.kelurahan !== orig.kelurahan ||
            detailFormData.jenisKelamin !== (orig.jenisKelamin || 'L')
        ) return true;
        const origAssign = orig.assignments ?? [];
        if (detailFormData.assignments.length !== origAssign.length) return true;
        return detailFormData.assignments.some((a, i) => {
            const o = origAssign[i] as any;
            return !o ||
                a.opd !== o.opd || a.kader !== o.kader || a.peran !== o.peran ||
                a.penugasan !== o.penugasan || a.status_keaktifan !== o.status_keaktifan;
        });
    }, [selectedRelawan, detailFormData]);

    const [formData, setFormData] = useState({
        namaRelawan: '', nik: '', jenisKelamin: 'L' as 'L' | 'P', alamat: '', no_hp: '',
        kemantren:'',kelurahan: '', kader: '', jabatan: '', penugasan: '', detail_penugasan: '',
        assignments: [] as Assignment[]
    });

    const kelurahanOptionsForForm = useMemo<AutoOption[]>(() => {
        const matchedKemantren = dummyKemantren.find(
            item => item.nama_kemantren.toLowerCase() === formData.kemantren.trim().toLowerCase()
        );

        if (!matchedKemantren) return [];

        return dummyKelurahan
            .filter(item => item.id_kemantren === matchedKemantren.id)
            .map(item => ({ label: item.nama_kelurahan, value: item.id_kelurahan }));
    }, [formData.kemantren]);

    const kelurahanOptionsForDetail = useMemo<AutoOption[]>(() => {
        const matchedKemantren = dummyKemantren.find(
            item => item.nama_kemantren.toLowerCase() === detailFormData.kemantren.trim().toLowerCase()
        );

        if (!matchedKemantren) return [];

        return dummyKelurahan
            .filter(item => item.id_kemantren === matchedKemantren.id)
            .map(item => ({ label: item.nama_kelurahan, value: item.id_kelurahan }));
    }, [detailFormData.kemantren]);

    // Ambil daftar kader untuk OPD tertentu dan simpan ke cache lokal.
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

    useEffect(() => {
        const assignments = isEditMode ? detailFormData.assignments : formData.assignments;
        const opdIds = Array.from(new Set(
            assignments
                .map(a => Number((a as any).opd_id || 0))
                .filter(id => id > 0)
        ));
        opdIds.forEach((opdId) => { void fetchKaderOptionsForOpd(opdId); });
    }, [isEditMode, detailFormData.assignments, formData.assignments, fetchKaderOptionsForOpd]);

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

    // Pastikan pilihan kader untuk OPD tertentu sudah tersedia saat penugasan dibuka.
    const fetchKaderByOpdId = useCallback((opdId: number, _assignmentIndex: number) => {
        const normalizedOpdId = opdId > 0 ? opdId : (isOPD ? ((user as any)?.opd_id ?? 0) : 0);
        if (normalizedOpdId > 0) void fetchKaderOptionsForOpd(normalizedOpdId);
    }, [isOPD, user, fetchKaderOptionsForOpd]);

    const invalidateRelawan = useCallback(() => qc.invalidateQueries({ queryKey: RELAWAN_KEYS.all }), [qc]);
    const invalidatePengajuan = useCallback(() => qc.invalidateQueries({ queryKey: PENGAJUAN_KEYS.all }), [qc]);

    // Gabungkan pesan error/skip dari import massal agar user mendapat detail yang jelas.
    const buildBulkIssueMessage = useCallback((res: any, fallback: string) => {
        const issues: string[] = [
            ...(Array.isArray(res?.data?.errors) ? res.data.errors : []),
            ...(Array.isArray(res?.data?.skipped) ? res.data.skipped : []),
            ...(Array.isArray(res?.data?.skippedNIK) ? res.data.skippedNIK : []),
        ].filter(Boolean).map((x: any) => (typeof x === 'string' ? x : JSON.stringify(x)));

        const baseMessage = (res?.message && !/^\d+\s+peringatan\.?$/i.test(String(res.message).trim()))
            ? res.message
            : fallback;

        if (issues.length === 0) return baseMessage;

        const preview = issues.slice(0, 3).map((m) => `- ${m}`).join('\n');
        const more = issues.length > 3 ? `\n(+${issues.length - 3} masalah lain)` : '';
        return `${baseMessage}\n${preview}${more}`;
    }, []);

    // ── FILTER DATA RELAWAN (Tabel Bawah) ──
    const filteredRelawanData = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        return relawanList.filter(relawan => {
            const matchNama = relawan.namaLengkap?.toLowerCase().includes(lowerSearch) || false;
            const matchNik = relawan.nik?.toLowerCase().includes(lowerSearch) || false;
            const matchKemantren = relawan.kemantren?.toLowerCase().includes(lowerSearch) || false;
            const matchKelurahan = relawan.kelurahan?.toLowerCase().includes(lowerSearch) || false;
            const matchAssignment = relawan.assignments?.some(a => 
                a.opd?.toLowerCase().includes(lowerSearch) || a.kader?.toLowerCase().includes(lowerSearch)
            ) || false;

            return matchNama || matchNik || matchKemantren || matchKelurahan || matchAssignment;
        });
    }, [relawanList, searchTerm]);

    const totalPages = Math.ceil(filteredRelawanData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentRelawanData = filteredRelawanData.slice(startIndex, endIndex);

    // ── FILTER & SORT DATA PENGAJUAN (Tabel Atas) ──
    const pengajuanUIData = useMemo(() => {
        const lowerSearch = searchPengajuan.toLowerCase();
        
        // Filter berdasarkan search text khusus pengajuan
        const filtered = pengajuanList.filter(p => 
            p.nik?.toLowerCase().includes(lowerSearch) || 
            p.nama_lengkap?.toLowerCase().includes(lowerSearch) ||
            p.jenis_perubahan?.toLowerCase().includes(lowerSearch)
        );

        // Sort data pengajuan: "Menunggu Review" di atas, sisanya di bawah berdasarkan tanggal terbaru
        const sortedData = [...filtered].sort((a, b) => {
            const weightA = a.status_pengajuan === 'Menunggu Review' ? 0 : 1;
            const weightB = b.status_pengajuan === 'Menunggu Review' ? 0 : 1;

            if (weightA !== weightB) {
                return weightA - weightB;
            }
            return new Date(b.tanggal_pengajuan).getTime() - new Date(a.tanggal_pengajuan).getTime();
        });

        return sortedData.map(p => ({
            nik: p.nik,
            namaLengkap: p.nama_lengkap,
            tanggalPengajuan: new Date(p.tanggal_pengajuan).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
            status_pengajuan: p.status_pengajuan,
            _raw: p
        }));
    }, [pengajuanList, searchPengajuan]);

    const totalPengajuanPages = Math.ceil(pengajuanUIData.length / pengajuanItemsPerPage);
    const startPengajuanIndex = (currentPengajuanPage - 1) * pengajuanItemsPerPage;
    const endPengajuanIndex = startPengajuanIndex + pengajuanItemsPerPage;
    const currentPengajuanData = pengajuanUIData.slice(startPengajuanIndex, endPengajuanIndex);


    // Ekspor data relawan yang sedang terfilter ke PDF.
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
            head: [['No', 'Nama Lengkap', 'NIK', 'Alamat KTP', 'Kemantren','Kelurahan', 'Jenis Kelamin', 'OPD / Penugasan', 'Kader']],
            body: filteredRelawanData.map((r, i) => [
                i + 1,
                r.namaLengkap || '-',
                r.nik || '-',
                r.alamat || '-',
                r.kemantren || '-',
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

    const pengajuanColumns = [
        { header: 'NIK', accessor: 'nik' as const },
        { header: 'NAMA LENGKAP', accessor: 'namaLengkap' as const },
        { header: 'TANGGAL PENGAJUAN', accessor: 'tanggalPengajuan' as const },
        {
            header: 'STATUS',
            render: (row: any) => {
                const isDisetujui = row.status_pengajuan === 'Disetujui' || row.status_pengajuan === 'Diterima';
                const isDitolak = row.status_pengajuan === 'Ditolak';
                const colorClass = isDisetujui ? 'bg-green-500' : isDitolak ? 'bg-red-500' : 'bg-yellow-400';
                return (
                    <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 ${colorClass} rounded-full`}></span>
                        {row.status_pengajuan}
                    </div>
                );
            }
        },
    ];

    const relawanColumns = [
        { header: 'NAMA', accessor: 'namaLengkap' as keyof RelawanData },
        { header: 'NIK', accessor: 'nik' as keyof RelawanData },
        { header: 'ALAMAT', accessor: 'alamat' as keyof RelawanData },
        { header: 'KEMANTREN', accessor: 'kemantren' as keyof RelawanData },
        { header: 'KELURAHAN', accessor: 'kelurahan' as keyof RelawanData },
    ];

    // Buka detail relawan dan salin data utama ke form edit.
    const handleDetailClick = (relawan: RelawanData) => {
        setSelectedRelawan(relawan);
        const assignments = Array.isArray(relawan.assignments) ? relawan.assignments : [];
        setDetailFormData({
            namaRelawan: relawan.namaLengkap || '',
            nik: relawan.nik || '',
            alamat: relawan.alamat || '-',
            no_hp: relawan.no_hp || '-',
            kemantren: relawan.kemantren || '-',
            kelurahan: relawan.kelurahan || '-',
            kader: relawan.kader || '-',
            jabatan: relawan.jabatan || '-',
            penugasan: relawan.penugasan || '-',
            jenisKelamin: (relawan.jenisKelamin as 'L' | 'P') || 'L',
            assignments: assignments
        });

        assignments.forEach((a: any) => {
            const opdId = Number(a?.opd_id || 0);
            if (opdId > 0) void fetchKaderOptionsForOpd(opdId);
        });
        setIsDetailModalOpen(true);
    };

    // Buka modal review untuk pengajuan perubahan data relawan.
    const handleReviewClick = (rawPengajuan: PengajuanAPIData) => {
        setSelectedPengajuan(rawPengajuan);
        setVerificationNote('');
        setIsDataChecked(false);
        setIsReviewModalOpen(true);
    };

    // Kirim keputusan review pengajuan relawan ke backend.
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
                
                setCurrentPengajuanPage(1);
            } else {
                setToast({ message: data.message || 'Gagal memproses pengajuan', type: 'error' });
            }
        } catch (e: any) {
            setToast({ message: parseErrorMessage(e, 'Tidak dapat terhubung ke server'), type: 'error' });
        } finally {
            setIsReviewing(false);
        }
    };

    // Validasi lalu simpan relawan baru beserta seluruh penugasannya.
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.namaRelawan.trim() || !formData.nik.trim() || !formData.alamat.trim() || !formData.no_hp.trim() || !formData.kemantren.trim() || !formData.kelurahan.trim()) {
            setToast({ message: 'Semua data pribadi wajib diisi', type: 'error' });
            return;
        }
        if (formData.namaRelawan.trim().length < 3) {
            setToast({ message: 'Nama Lengkap minimal 3 karakter', type: 'error' });
            return;
        }
        if (!REGEX_PATTERNS.NAMA_RELAWAN.test(formData.namaRelawan)) {
            setToast({ message: 'Nama Lengkap tidak boleh mengandung angka atau karakter spesial', type: 'error' });
            return;
        }
        if (!REGEX_PATTERNS.NIK.test(formData.nik)) {
            setToast({ message: 'NIK harus terdiri dari tepat 16 digit angka', type: 'error' });
            return;
        }

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
                nama_lengkap: toTitleCase(formData.namaRelawan.trim()),
                nik: formData.nik,
                jenis_kelamin: formData.jenisKelamin,
                alamat_ktp: formData.alamat,
                no_hp: formData.no_hp.replace(/\D/g, ''),
                kemantren: formData.kemantren,
                kelurahan: formData.kelurahan,
                assignments: formData.assignments.map(a => ({
                    opd_id: a.opd_id || null,
                    opd: a.opd,
                    kader_id: a.kader_id || null,
                    kader: a.kader,
                    peran: a.peran,
                    penugasan: a.penugasan,
                    detail: a.detail,
                    status_keaktifan: a.status_keaktifan
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
                    kemantren:'',kelurahan: '', kader: '', jabatan: '', penugasan: '', detail_penugasan: '',
                    assignments: []
                });
                invalidateRelawan();
                setCurrentPage(1); 
            }
        } catch (e: any) {
            setToast({ message: parseErrorMessage(e, 'Gagal menyimpan data relawan'), type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    // Proses data Excel untuk import massal relawan.
    const handleExcelUploadConfirm = async (data: any[]) => {
        try {
            const { data: res } = await apiClient.post(`${API_BASE}/bulk`, data);
            const issueMessage = buildBulkIssueMessage(res, 'Gagal import Excel');
            const issuesCount = [
                ...(Array.isArray(res?.data?.errors) ? res.data.errors : []),
                ...(Array.isArray(res?.data?.skipped) ? res.data.skipped : []),
                ...(Array.isArray(res?.data?.skippedNIK) ? res.data.skippedNIK : []),
            ].length;

            if (res.success) {
                setToast({
                    message: issuesCount > 0 ? issueMessage : (res.message || 'Berhasil memproses Excel'),
                    type: issuesCount > 0 ? 'warning' : 'success'
                });
                invalidateRelawan();
                setCurrentPage(1);
            } else {
                setToast({ message: issueMessage, type: 'error' });
            }
        } catch (e: any) {
            const fallbackMessage = parseErrorMessage(e, 'Gagal import data dari Excel');
            const responseData = e?.response?.data;
            const detailedMessage = buildBulkIssueMessage(responseData, fallbackMessage);
            setToast({ message: detailedMessage, type: 'error' });
        } finally {
            setIsUploadModalOpen(false);
        }
    };

    // Tambahkan baris penugasan baru pada form relawan.
    const handleAddAssignment = () => {
        const newIndex = formData.assignments.length;
        setFormData(prev => ({
            ...prev,
            assignments: [
                ...prev.assignments,
                createEmptyAssignment()
            ]
        }));
        if (isOPD && (user as any)?.opd_id) {
            fetchKaderByOpdId((user as any).opd_id, newIndex);
        }
    };

    // Hapus satu baris penugasan dari form relawan.
    const handleRemoveAssignment = (index: number) => {
        setFormData(prev => ({
            ...prev,
            assignments: prev.assignments.filter((_, i) => i !== index)
        }));
    };

    // Update OPD pada baris penugasan dan reset kader yang bergantung.
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

    // Sinkronkan perubahan field umum pada baris penugasan.
    const handleAssignmentChange = (index: number, field: string, value: string) => {
        setFormData(prev => {
            const newAssignments = [...prev.assignments];
            newAssignments[index] = { ...newAssignments[index], [field]: value };
            return { ...prev, assignments: newAssignments };
        });
    };

    // Update pilihan kader pada baris penugasan sesuai OPD yang aktif.
    const handleAssignmentKaderChange = (index: number, namaKader: string) => {
        const options = kaderOptionsByIndex[index] || [];
        const matched = options.find(o => o.label.toLowerCase() === namaKader.toLowerCase());
        const kaderId = matched ? Number(matched.value) : null;
        setFormData(prev => {
            const newAssignments = [...prev.assignments];
            newAssignments[index] = { ...newAssignments[index], kader: namaKader, kader_id: kaderId };
            return { ...prev, assignments: newAssignments };
        });
    };

    // Sinkronkan perubahan field penugasan saat mode edit detail.
    const handleDetailAssignmentChange = (index: number, field: string, value: string) => {
        setDetailFormData(prev => {
            const newAssignments = [...prev.assignments];
            newAssignments[index] = { ...newAssignments[index], [field]: value };
            return { ...prev, assignments: newAssignments };
        });
    };

    // Ubah OPD pada assignment edit dan muat ulang opsi kader terkait.
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

    // Update kader pada assignment edit berdasarkan pilihan user.
    const handleDetailAssignmentKaderChange = (index: number, value: string) => {
        const options = kaderOptionsByIndex[index] || [];
        const matched = options.find(o => o.label.toLowerCase() === value.toLowerCase());
        const kaderId = matched ? Number(matched.value) : null;
        const kaderName = value;
        setDetailFormData(prev => {
            const newAssignments = [...prev.assignments];
            newAssignments[index] = { ...newAssignments[index], kader: kaderName, kader_id: kaderId } as any;
            return { ...prev, assignments: newAssignments };
        });
    };

    // Validasi lalu simpan perubahan detail relawan dan penugasannya.
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
                nama_lengkap: toTitleCase(detailFormData.namaRelawan.trim()),
                alamat_ktp: detailFormData.alamat,
                no_hp: detailFormData.no_hp.replace(/\D/g, ''),
                kemantren: detailFormData.kemantren,
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
                    status_keaktifan: a.status_keaktifan
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

    // Siapkan konfirmasi hapus untuk penugasan yang dipilih.
    const handleDeletePenugasan = async (penugasanId: number, index: number) => {
        if (!penugasanId) {
            setDetailFormData(prev => ({
                ...prev,
                assignments: prev.assignments.filter((_, i) => i !== index)
            }));
            return;
        }
        const assignment = detailFormData.assignments[index] as any;
        const label = [
            selectedRelawan?.namaLengkap,
            assignment.opd ? `dari ${assignment.opd}` : '',
            assignment.kader ? `(Kader: ${assignment.kader})` : '',
            assignment.peran ? `— ${assignment.peran}` : '',
        ].filter(Boolean).join(' ');

        setDeleteConfirm({ penugasanId, index, label });
    };

    // Eksekusi penghapusan penugasan setelah user mengonfirmasi.
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
                setDetailFormData(prev => ({
                    ...prev,
                    assignments: prev.assignments.filter((_, i) => i !== index)
                }));
                setSelectedRelawan(prev => prev ? {
                    ...prev,
                    assignments: Array.isArray(prev.assignments) 
                        ? prev.assignments.filter((_, i) => i !== index) 
                        : []
                } : null);
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

    // Tambahkan assignment baru saat relawan sedang diedit.
    const handleAddDetailAssignment = () => {
        setDetailFormData(prev => ({
            ...prev,
            assignments: [
                ...prev.assignments,
                createEmptyAssignment('new') as any
            ]
        }));
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
        handlers?: {
            onFieldChange?: (index: number, field: string, value: string) => void;
            onOpdChange?: (index: number, val: string) => void;
            onKaderChange?: (index: number, val: string) => void;
        }
    ) => {
        const currentKaderOptions = context === 'form' ? (kaderOptionsByIndex[index] || []) : [];
        const isKaderLoading = isLoadingKaderByIndex[index] || false;
        const hasOpdSelected = isOPD || assignment.opd_id > 0 || assignment.opd !== '';
        const currentStatusKeaktifan = normalizeStatusKeaktifan(assignment.status_keaktifan);
        
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

                <div className="grid grid-cols-3 gap-4 items-start">
                    <label className="text-lg font-medium text-gray-900 pt-2">OPD</label>
                    <div className="col-span-2">
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
                        {!isReadOnly && !isOPD && assignment.opd_id > 0 && (
                            <p className="mt-1 text-xs text-green-600 font-medium">OPD ditemukan</p>
                        )}
                    </div>
                </div>

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
                                        !hasOpdSelected ? 'Pilih OPD terlebih dahulu...'
                                        : isKaderLoading ? 'Memuat kader...'
                                        : currentKaderOptions.length === 0 ? 'Tidak ada kader di OPD ini'
                                        : 'Cari nama Kader...'
                                    }
                                    disabled={isReadOnly || !hasOpdSelected || isKaderLoading}
                                    warnIfNotFound={false}
                                />
                                {!isReadOnly && hasOpdSelected && !isKaderLoading && currentKaderOptions.length > 0 && (
                                    <p className="mt-1 text-xs text-blue-500">
                                        {currentKaderOptions.length} kader tersedia di OPD ini
                                    </p>
                                )}
                                {!isReadOnly && hasOpdSelected && !isKaderLoading && currentKaderOptions.length === 0 && assignment.opd_id > 0 && (
                                    <p className="mt-1 text-xs text-yellow-600">
                                        OPD ini belum memiliki kader
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

                <div className="grid grid-cols-3 gap-4 items-center mt-2">
                    <label className="text-lg font-medium text-gray-900">Status Keaktifan</label>
                    <div className="col-span-2 flex items-center gap-6">
                        {[
                            { label: 'Aktif', value: 'Aktif' },
                            { label: 'Nonaktif', value: 'Tidak Aktif' },
                        ].map(status => (
                            <label key={status.value} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name={`status_keaktifan-${index}`}
                                    value={status.value}
                                    checked={currentStatusKeaktifan === status.value}
                                    onChange={(e) => onFieldChange(index, 'status_keaktifan', normalizeStatusKeaktifan(e.target.value))}
                                    disabled={isReadOnly}
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-gray-700">{status.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const pengajuanActions = (row: any) => (
        row.status_pengajuan === 'Menunggu Review' ? (
            <Button variant="secondary" size="sm" onClick={() => handleReviewClick(row._raw)}>Review</Button>
        ) : null
    );

    const relawanActions = (row: RelawanData) => (
        <Button variant="secondary" size="sm" onClick={() => handleDetailClick(row)}>Detail</Button>
    );

    return (
        <div className="space-y-6">
            {/* GLOBAL ACTIONS (Tombol Atas Tetap Di Sini) */}
            <div className="flex justify-between items-center">
                <div className="flex gap-3">
                    <Button variant="primary" onClick={() => {
                        setFormData({
                            namaRelawan: '', nik: '', jenisKelamin: 'L', alamat: '', no_hp: '',
                            kemantren:'',kelurahan: '', kader: '', jabatan: '', penugasan: '', detail_penugasan: '',
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
            </div>
            {/* TABEL 1: Pengajuan Perubahan Data */}
            <Card>
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h2 className="text-xl font-semibold text-gray-900">Pengajuan Perubahan Data</h2>
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                        <SearchInput
                            value={searchPengajuan}
                            onChange={(e) => { setSearchPengajuan(e.target.value); setCurrentPengajuanPage(1); }}
                            placeholder="Cari pengajuan..."
                            className="w-64"
                        />
                    </div>
                </div>

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
                    <>
                        <Table columns={pengajuanColumns} data={currentPengajuanData} actions={pengajuanActions} minRows={3} />
                        
                        {/* Pagination Tabel Pengajuan */}
                        <div className="mt-4 flex justify-between items-center">
                            <div className="text-sm text-gray-500">
                                Menampilkan {startPengajuanIndex + 1}-{Math.min(endPengajuanIndex, pengajuanUIData.length)} dari {pengajuanUIData.length} Pengajuan
                            </div>
                            <Pagination
                                currentPage={currentPengajuanPage}
                                totalPages={totalPengajuanPages}
                                onPageChange={(page) => setCurrentPengajuanPage(page)}
                            />
                        </div>
                    </>
                )}
            </Card>

            {/* TABEL 2: Daftar Relawan */}
            <Card>
                {/* Menggabungkan Judul, Search bar, dan Tombol Ekspor PDF dalam 1 Baris Sejajar */}
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h2 className="text-xl font-semibold text-gray-900">Daftar Relawan</h2>
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                        <SearchInput
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            placeholder="Cari relawan..."
                            className="w-64"
                        />
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

                {/* Pagination Tabel Relawan */}
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

            {/* Modal-modal (Tambah, Detail, Review, Upload) tetap di bawah */}
            {/* Modal Tambah Relawan */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Relawan Baru" subtitle="Isi data relawan yang ingin ditambahkan" maxWidth="2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {[
                        { label: 'Nama Relawan', name: 'namaRelawan', required: true, placeholder: 'Nama Lengkap Relawan' },
                        { label: 'NIK', name: 'nik', required: true, placeholder: '16 digit NIK', maxLength: 16 },
                        { label: 'Alamat KTP', name: 'alamat', required: true, placeholder: 'Alamat sesuai KTP' },
                        { label: 'No. HP', name: 'no_hp', required: true, placeholder: 'Nomor HP' },
                    ].map(field => (
                        <div key={field.name} className="grid grid-cols-3 gap-4 items-center">
                            <label className="text-lg font-medium text-gray-900">
                                {field.label}{field.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            <input
                                type="text"
                                name={field.name}
                                value={(formData as any)[field.name]}
                                onChange={(e) => {
                                    if (field.name === 'nik') {
                                        const val = e.target.value.replace(/\D/g, '');
                                        setFormData(prev => ({ ...prev, nik: val }));
                                    } else {
                                        setFormData(prev => ({ ...prev, [field.name]: e.target.value }));
                                    }
                                }}
                                placeholder={field.placeholder}
                                required={field.required}
                                maxLength={(field as any).maxLength}
                                className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    ))}

                    <div className="grid grid-cols-3 gap-4 items-center">
                        <label className="text-lg font-medium text-gray-900">
                            Kemantren <span className="text-red-500 ml-1">*</span>
                        </label>
                        <AutocompleteInput
                            name="kemantren"
                            value={formData.kemantren}
                            options={kemantrenOptions}
                            onChange={(val) => setFormData(prev => ({
                                ...prev,
                                kemantren: val,
                                kelurahan: ''
                            }))}
                            placeholder="Cari nama Kemantren..."
                            required
                            warnIfNotFound={false}
                            className="col-span-2"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4 items-center">
                        <label className="text-lg font-medium text-gray-900">
                            Kelurahan <span className="text-red-500 ml-1">*</span>
                        </label>
                        <AutocompleteInput
                            name="kelurahan"
                            value={formData.kelurahan}
                            options={kelurahanOptionsForForm}
                            onChange={(val) => setFormData(prev => ({ ...prev, kelurahan: val }))}
                            placeholder={formData.kemantren ? 'Cari nama Kelurahan...' : 'Pilih Kemantren terlebih dahulu...'}
                            required
                            disabled={!formData.kemantren}
                            warnIfNotFound={false}
                            className="col-span-2"
                        />
                    </div>

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

                        {[
                            { label: 'Nama Relawan', name: 'namaRelawan' },
                            { label: 'NIK', name: 'nik' },
                            { label: 'Alamat KTP', name: 'alamat' },
                            { label: 'No. HP', name: 'no_hp' },
                        ].map(field => {
                            const isFieldEditable = isEditMode && field.name !== 'nik' && field.name !== 'jabatan';
                            
                            return (
                                <div key={field.name} className="grid grid-cols-3 gap-4 items-center">
                                    <label className="text-lg font-medium text-gray-900">{field.label}</label>
                                    <input
                                        type="text"
                                        value={!isEditMode && field.name === 'no_hp' ? formatPhoneDisplay((detailFormData as any)[field.name]) : (detailFormData as any)[field.name]}
                                        readOnly={!isFieldEditable}
                                        onChange={(e) => setDetailFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                                        className={`col-span-2 px-4 py-2 border rounded-lg focus:outline-none transition-all
                                            ${isFieldEditable
                                                ? 'border-blue-300 focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-medium'
                                                : 'border-gray-200 bg-gray-50 text-gray-400 italic font-normal cursor-not-allowed'
                                            }`}
                                    />
                                </div>
                            );
                        })}

                        <div className="grid grid-cols-3 gap-4 items-center">
                            <label className="text-lg font-medium text-gray-900">Kemantren</label>
                            {isEditMode ? (
                                <AutocompleteInput
                                    name="kemantren"
                                    value={detailFormData.kemantren}
                                    options={kemantrenOptions}
                                    onChange={(val) => setDetailFormData(prev => ({
                                        ...prev,
                                        kemantren: val,
                                        kelurahan: ''
                                    }))}
                                    placeholder="Cari nama Kemantren..."
                                    className="col-span-2"
                                    warnIfNotFound={false}
                                />
                            ) : (
                                <input
                                    type="text"
                                    value={detailFormData.kemantren}
                                    readOnly
                                    className="col-span-2 px-4 py-2 border border-gray-200 bg-gray-50 text-gray-400 italic font-normal cursor-not-allowed rounded-lg"
                                />
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-4 items-center">
                            <label className="text-lg font-medium text-gray-900">Kelurahan</label>
                            {isEditMode ? (
                                <AutocompleteInput
                                    name="kelurahan"
                                    value={detailFormData.kelurahan}
                                    options={kelurahanOptionsForDetail}
                                    onChange={(val) => setDetailFormData(prev => ({ ...prev, kelurahan: val }))}
                                    placeholder={detailFormData.kemantren ? 'Cari nama Kelurahan...' : 'Pilih Kemantren terlebih dahulu...'}
                                    disabled={!detailFormData.kemantren}
                                    className="col-span-2"
                                    warnIfNotFound={false}
                                />
                            ) : (
                                <input
                                    type="text"
                                    value={detailFormData.kelurahan}
                                    readOnly
                                    className="col-span-2 px-4 py-2 border border-gray-200 bg-gray-50 text-gray-400 italic font-normal cursor-not-allowed rounded-lg"
                                />
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-4 items-center">
                            <label className="text-lg font-medium text-gray-900">Jenis Kelamin</label>
                            <select
                                value={detailFormData.jenisKelamin}
                                disabled={!isEditMode}
                                onChange={(e) => setDetailFormData(prev => ({ ...prev, jenisKelamin: e.target.value as 'L' | 'P' }))}
                                className={`col-span-2 px-4 py-2 border rounded-lg focus:outline-none transition-all
                                    ${isEditMode 
                                        ? 'border-blue-300 bg-white text-gray-900 font-medium' 
                                        : 'border-gray-200 bg-gray-50 text-gray-400 italic font-normal cursor-not-allowed'
                                    }`}
                            >
                                <option value="L">Laki-laki (L)</option>
                                <option value="P">Perempuan (P)</option>
                            </select>
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Daftar Penugasan:</h3>
                            {Array.isArray(detailFormData.assignments) && detailFormData.assignments.length > 0 ? (
                                detailFormData.assignments.map((assignment, index) => {
                                    const penugasanId = parseInt((assignment as any).id);
                                    const isNewAssignment = isNaN(penugasanId) || String((assignment as any).id).startsWith('new-');
                                    return (
                                        <div key={(assignment as any).id} className="relative bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4 space-y-4">
                                            {isEditMode && (
                                                <div className="flex justify-end -mt-2 -mr-2 mb-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeletePenugasan(isNewAssignment ? 0 : penugasanId, index)}
                                                        disabled={deletingPenugasanId === penugasanId}
                                                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Hapus Penugasan"
                                                    >
                                                        {deletingPenugasanId === penugasanId ? <Loader2 size={18} className="animate-spin" /> : <X size={18} />}
                                                    </button>
                                                </div>
                                            )}
                                            {renderAssignmentFields(
                                                assignment, index, !isEditMode, isEditMode ? 'form' : 'detail',
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

                            {isEditMode && (
                                <div className="flex justify-center mt-2">
                                    <Button type="button" variant="primary" size="sm" onClick={handleAddDetailAssignment}>
                                        <Plus size={16} />
                                        Tambah Penugasan
                                    </Button>
                                </div>
                            )}
                        </div>

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

                        {selectedPengajuan.data_baru && (() => {
                            let dataBaru: any = {};
                            try {
                                dataBaru = typeof selectedPengajuan.data_baru === 'string'
                                    ? JSON.parse(selectedPengajuan.data_baru)
                                    : selectedPengajuan.data_baru;
                            } catch (e) {
                                return (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2 mt-4">
                                        <p className="text-sm font-medium text-red-800">Data perubahan tidak valid atau rusak.</p>
                                    </div>
                                );
                            }

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
                isOpdUser={isOPD}
            />
            
            {/* Modal Konfirmasi Hapus Penugasan */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-9999">
                    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Hapus Penugasan?</h3>
                        <p className="text-sm text-gray-600">
                            Apakah Anda yakin ingin menghapus penugasan{' '}
                            <span className="font-medium text-gray-800">"{deleteConfirm.label}"</span>?
                            Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="px-6">
                                Batal
                            </Button>
                            <Button onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700 text-white px-6">
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
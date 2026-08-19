import React, { useState, useMemo, useCallback } from "react";
import { Plus, Upload } from "lucide-react";
import Button from "../components/ui/Button";
import UploadExcelModal from "../components/ui/UploadExcelModal";
import type { ToastType } from "../components/ui/Toast";
import Toast from "../components/ui/Toast";
import { PengajuanTableSection } from "../pages/data-relawan-components/PengajuanTableSection";
import { RelawanTableSection } from "../pages/data-relawan-components/RelawanTableSection";
import { TambahRelawanModal } from "../pages/data-relawan-components/TambahRelawanModal";
import { DetailRelawanModal } from "../pages/data-relawan-components/DetailRelawanModal";
import { ReviewPengajuanModal } from "../pages/data-relawan-components/ReviewPengajuanModal";

import type { RelawanData, PengajuanAPIData } from "../types/relawan.types";
import type { AutoOption } from "../types/common.types";
import { useWilayah } from "../hooks/useWilayah";
import { useAuth } from "../context/AuthContext";
import { useRelawanList, RELAWAN_KEYS } from "../hooks/relawan/useRelawanList";
import { usePengajuanList, PENGAJUAN_KEYS } from "../hooks/relawan/usePengajuanList";
import { useOpdList } from "../hooks/opd/useOpdList";
import { useQueryClient } from "@tanstack/react-query";
import apiClient from "../lib/axios";
import { parseErrorMessage } from "../utils/parseErrorMessage";
import { exportToPDF } from "../utils/exportToPDF";
import { toTitleCase } from "../utils/formatText";
import { REGEX_PATTERNS } from "../utils/regex";

const DataRelawan: React.FC = () => {
  const { isOPD, isSuperAdmin, user } = useAuth();
  const API_BASE = isSuperAdmin ? "/admin/relawan" : "/opd-admin/relawan";
  const qc = useQueryClient();

  // Queries
  const { data: relawanList = [], isLoading: isLoadingRelawan } = useRelawanList(!!isSuperAdmin);
  const { data: pengajuanList = [], isLoading: isLoadingPengajuan } = usePengajuanList(!!isSuperAdmin);
  const { data: opdListData = [] } = useOpdList(!!isSuperAdmin);
  const { fetchKelurahanByKemantrenId, kelurahanList, kemantrenList } = useWilayah();

  // State Tabs & Tables
  const [pengajuanTab, setPengajuanTab] = useState<"pending" | "history">("pending");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("ALL");
  const [searchPengajuan, setSearchPengajuan] = useState("");
  const [currentPengajuanPage, setCurrentPengajuanPage] = useState(1);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<"namaLengkap" | "nik" | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);

  // Modals & Selected items
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedRelawan, setSelectedRelawan] = useState<RelawanData | null>(null);
  const [selectedPengajuan, setSelectedPengajuan] = useState<PengajuanAPIData | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingEdit] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Options & Kader Cache
  const [kaderOptionsByOpdId, setKaderOptionsByOpdId] = useState<Record<number, AutoOption[]>>({});
  const [loadingOpdIds, setLoadingOpdIds] = useState<Record<number, boolean>>({});

  const opdOptions = useMemo(() => opdListData.map((o) => ({ label: o.nama_opd, value: String(o.opd_id) })), [opdListData]);
  const kemantrenOptions = useMemo(() => kemantrenList.map((i) => ({ label: i.nama_kemantren, value: i.id })), [kemantrenList]);
  const kelurahanOptions = useMemo(() => kelurahanList.map((i) => ({ label: i.nama_kelurahan, value: i.id_kelurahan })), [kelurahanList]);

  const fetchKaderOptionsForOpd = useCallback(async (opdId: number) => {
    if (opdId <= 0 || kaderOptionsByOpdId[opdId] || loadingOpdIds[opdId]) return;
    setLoadingOpdIds((prev) => ({ ...prev, [opdId]: true }));
    try {
      const endpoint = isOPD ? "/opd-admin/kader" : `/kader?opd_id=${opdId}`;
      const { data } = await apiClient.get(endpoint);
      const options: AutoOption[] = data?.success
        ? data.data.map((k: any) => ({ label: k.nama_kader, value: String(k.kader_id) }))
        : [];
      setKaderOptionsByOpdId((prev) => ({ ...prev, [opdId]: options }));
    } finally {
      setLoadingOpdIds((prev) => ({ ...prev, [opdId]: false }));
    }
  }, [isOPD, kaderOptionsByOpdId, loadingOpdIds]);

  // Transform Pengajuan Data
  const pendingCount = useMemo(() => pengajuanList.filter((p) => p.status_pengajuan === "Menunggu Review").length, [pengajuanList]);

  const pengajuanUIData = useMemo(() => {
    const q = searchPengajuan.toLowerCase();
    let filtered = pengajuanList.filter((p) => pengajuanTab === "pending" ? p.status_pengajuan === "Menunggu Review" : p.status_pengajuan !== "Menunggu Review");
    if (pengajuanTab === "history" && historyStatusFilter !== "ALL") {
      filtered = filtered.filter((p) => historyStatusFilter === "DISETUJUI" ? (p.status_pengajuan === "Disetujui" || p.status_pengajuan === "Diterima") : p.status_pengajuan === "Ditolak");
    }
    filtered = filtered.filter((p) => p.nik.toLowerCase().includes(q) || p.nama_lengkap.toLowerCase().includes(q) || (p.nama_verifikator || "").toLowerCase().includes(q));
    const sorted = [...filtered].sort((a, b) => new Date(b.tanggal_pengajuan).getTime() - new Date(a.tanggal_pengajuan).getTime());
    return sorted.map((p) => ({
      _raw: p,
      namaLengkap: p.nama_lengkap,
      nik: p.nik,
      status_pengajuan: p.status_pengajuan,
      verifikator: 
      p.nama_verifikator ||
      (p as any).verifikator_nama ||
      (p as any).nama_admin ||
      (p as any).verifikator?.nama_lengkap ||
      (p.verifikator_id ? `Admin #${p.verifikator_id}` : "-"),
      tanggalPengajuan: new Date(p.tanggal_pengajuan).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }),
    }));
  }, [pengajuanList, pengajuanTab, historyStatusFilter, searchPengajuan]);

  // Transform Relawan Data
  const filteredRelawanData = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return relawanList.filter((r) => !q || r.namaLengkap.toLowerCase().includes(q) || r.nik.toLowerCase().includes(q));
  }, [relawanList, searchTerm]);

  const sortedRelawanData = useMemo(() => {
    if (!sortColumn || !sortOrder) return filteredRelawanData;
    return [...filteredRelawanData].sort((a, b) => {
      const valA = String(a[sortColumn] || "").toLowerCase();
      const valB = String(b[sortColumn] || "").toLowerCase();
      return sortOrder === "asc" ? (valA < valB ? -1 : 1) : (valA > valB ? -1 : 1);
    });
  }, [filteredRelawanData, sortColumn, sortOrder]);

  const handleReview = async (status: "Disetujui" | "Ditolak", note: string) => {
    if (!selectedPengajuan) return;
    setIsReviewing(true);
    try {
      const endpoint = isSuperAdmin
        ? `/admin/relawan/pengajuan/${selectedPengajuan.pengajuan_id}/review`
        : `/opd-admin/relawan/pengajuan/${selectedPengajuan.pengajuan_id}/review`;
      const { data } = await apiClient.post(endpoint, { catatan_verifikator: note, status });
      if (data.success) {
        setToast({ message: data.message, type: "success" });
        setIsReviewModalOpen(false);
        qc.invalidateQueries({ queryKey: PENGAJUAN_KEYS.all });
        if (status === "Disetujui") qc.invalidateQueries({ queryKey: RELAWAN_KEYS.all });
      }
    } catch (e) {
      setToast({ message: parseErrorMessage(e, "Gagal memproses review"), type: "error" });
    } finally {
      setIsReviewing(false);
    }
  };

  const handleSaveTambah = async (formData: any) => {
    if (!REGEX_PATTERNS.NAMA_RELAWAN.test(formData.namaRelawan) || !REGEX_PATTERNS.NIK.test(formData.nik)) {
      setToast({ message: "Format NIK atau Nama tidak valid", type: "error" });
      return;
    }
    setIsSaving(true);
    try {
      const { data } = await apiClient.post(`${API_BASE}/bulk`, [{
        alamat_ktp: formData.alamat,
        assignments: formData.assignments,
        jenis_kelamin: formData.jenisKelamin,
        kelurahan: formData.kelurahan,
        kemantren: formData.kemantren,
        nama_lengkap: toTitleCase(formData.namaRelawan.trim()),
        nik: formData.nik,
        no_hp: formData.no_hp.replace(/\D/g, ""),
      }]);
      if (data.success) {
        setToast({ message: "Relawan berhasil ditambahkan", type: "success" });
        setIsModalOpen(false);
        qc.invalidateQueries({ queryKey: RELAWAN_KEYS.all });
      }
    } catch (e) {
      setToast({ message: parseErrorMessage(e, "Gagal menyimpan relawan"), type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-3">
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Tambah Relawan
          </Button>
          <Button variant="outline" onClick={() => setIsUploadModalOpen(true)}>
            <Upload size={18} /> Unggah dari Excel
          </Button>
        </div>
      </div>

      <PengajuanTableSection
        pengajuanTab={pengajuanTab}
        setPengajuanTab={setPengajuanTab}
        pendingCount={pendingCount}
        historyStatusFilter={historyStatusFilter}
        setHistoryStatusFilter={setHistoryStatusFilter}
        searchPengajuan={searchPengajuan}
        setSearchPengajuan={setSearchPengajuan}
        isLoading={isLoadingPengajuan}
        pengajuanUIData={pengajuanUIData}
        currentPengajuanData={pengajuanUIData.slice((currentPengajuanPage - 1) * 5, currentPengajuanPage * 5)}
        currentPage={currentPengajuanPage}
        setCurrentPage={setCurrentPengajuanPage}
        totalPages={Math.ceil(pengajuanUIData.length / 5)}
        startIndex={(currentPengajuanPage - 1) * 5}
        endIndex={currentPengajuanPage * 5}
        onOpenReview={(p) => { setSelectedPengajuan(p); setIsReviewModalOpen(true); }}
      />

      <RelawanTableSection
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        isLoading={isLoadingRelawan}
        filteredRelawanData={filteredRelawanData}
        currentRelawanData={sortedRelawanData.slice((currentPage - 1) * 5, currentPage * 5)}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={Math.ceil(sortedRelawanData.length / 5)}
        startIndex={(currentPage - 1) * 5}
        endIndex={currentPage * 5}
        sortColumn={sortColumn}
        sortOrder={sortOrder}
        onSort={(col) => {
          if (sortColumn === col) setSortOrder(sortOrder === "asc" ? "desc" : null);
          else { setSortColumn(col as any); setSortOrder("asc"); }
        }}
        onExportPdf={() => exportToPDF({
          columns: [{ dataKey: "nik", header: "NIK" }, { dataKey: "namaLengkap", header: "NAMA" }],
          data: filteredRelawanData as any,
          filename: "data-relawan.pdf",
          title: "Data Relawan",
        })}
        onOpenDetail={(r) => { setSelectedRelawan(r); setIsDetailModalOpen(true); }}
      />

      <TambahRelawanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isOPD={isOPD}
        userOpdName={user?.nama_opd}
        userOpdId={user?.opd_id}
        opdOptions={opdOptions}
        kemantrenOptions={kemantrenOptions}
        kelurahanOptions={kelurahanOptions}
        kaderOptionsByIndex={kaderOptionsByOpdId}
        isLoadingKaderByIndex={loadingOpdIds}
        onKemantrenChange={(k) => {
          const match = kemantrenList.find((i) => i.nama_kemantren.toLowerCase() === k.trim().toLowerCase());
          if (match) fetchKelurahanByKemantrenId(match.id);
        }}
        onOpdChangeAssignment={(_, name) => {
          const m = opdOptions.find((o) => o.label.toLowerCase() === name.toLowerCase());
          if (m) fetchKaderOptionsForOpd(Number(m.value));
        }}
        onKaderChangeAssignment={() => {}}
        onSubmit={handleSaveTambah}
        isSaving={isSaving}
      />

      <DetailRelawanModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        relawan={selectedRelawan}
        isOPD={isOPD}
        userOpdName={user?.nama_opd}
        opdOptions={opdOptions}
        kemantrenOptions={kemantrenOptions}
        kelurahanOptions={kelurahanOptions}
        kaderOptionsByIndex={kaderOptionsByOpdId}
        isLoadingKaderByIndex={loadingOpdIds}
        onKemantrenChange={(k) => {
          const match = kemantrenList.find((i) => i.nama_kemantren.toLowerCase() === k.trim().toLowerCase());
          if (match) fetchKelurahanByKemantrenId(match.id);
        }}
        onOpdChangeAssignment={(_, name) => {
          const m = opdOptions.find((o) => o.label.toLowerCase() === name.toLowerCase());
          if (m) fetchKaderOptionsForOpd(Number(m.value));
        }}
        onKaderChangeAssignment={() => {}}
        onSaveEdit={async () => {}}
        onDeletePenugasan={() => {}}
        isSavingEdit={isSavingEdit}
      />

      <ReviewPengajuanModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        pengajuan={selectedPengajuan}
        onReview={handleReview}
        isReviewing={isReviewing}
      />

      <UploadExcelModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onConfirm={async () => {}}
        title="Unggah Data Relawan"
        templateName="Data Relawan"
        dataType="relawan"
        isOpdUser={isOPD}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default DataRelawan;
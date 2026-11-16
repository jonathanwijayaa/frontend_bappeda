//ManejemenOPD.tsx
import React, { useState, useMemo, useEffect } from "react";
import { Plus, FileDown, Upload, Loader2 } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { SearchInput } from "../components/ui/Input";
import Table from "../components/ui/Table";
import Modal from "../components/ui/Modal";
import UploadExcelModal from "../components/ui/UploadExcelModal";
import type { ToastType } from "../components/ui/Toast";
import Toast from "../components/ui/Toast";
import Pagination from "../components/ui/Pagination";
import { exportToPDF } from "../utils/exportToPDF";
import { parseErrorMessage } from "../utils/parseErrorMessage";
import type { OPDData } from "../types";
import { useOpdList } from "../hooks/opd/useOpdList";
import { REGEX_PATTERNS } from "../utils/regex";
import {
  useCreateOpd,
  useUpdateOpd,
  useToggleOpdStatus,
  useBulkOpd,
} from "../hooks/opd/useOpdMutations";
import { toTitleCase } from "../utils/formatText";

const ManajemenOPD: React.FC = () => {
  // ── Server State (TanStack Query) ─────────────────────────
  const { data: opdList = [], isLoading } = useOpdList();
  const createOpd = useCreateOpd();
  const updateOpd = useUpdateOpd();
  const toggleStatus = useToggleOpdStatus();
  const bulkOpd = useBulkOpd();

  // ── UI State (useState) ───────────────────────────────────
  const [searchTerm, setSearchTerm] = useState<string>("");
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
    alamat: "",
    kontak: "",
    nama_opd: "",
    nik_pic: "",
    pic: "",
  });

  const resetAddForm = () => {
    setFormData({ alamat: "", kontak: "", nama_opd: "", nik_pic: "", pic: "" });
  };

  useEffect(() => {
    if (!isModalOpen) {
      resetAddForm();
    }
  }, [isModalOpen]);

  const handleCloseAddModal = () => {
    setIsModalOpen(false);
    resetAddForm();
  };

  const [detailFormData, setDetailFormData] = useState({
    alamat: "",
    kontak: "",
    nama_opd: "",
    nik_pic: "",
    pic: "",
  });

  const validateOpdForm = (payload: typeof formData): string | null => {
  if (
    !payload.nama_opd.trim() ||
    !payload.alamat.trim() ||
    !payload.pic.trim() ||
    !payload.nik_pic.trim() ||
    !payload.kontak.trim()
  ) {
    return "Semua field wajib diisi";
  }

  if (payload.nama_opd.trim().length < 3) {
    return "Nama OPD minimal 3 karakter";
  }
  if (payload.nama_opd.trim().length > 100) {
    return "Nama OPD terlalu panjang (maks 100 karakter)";
  }
  if (!REGEX_PATTERNS.NAMA_OPD.test(payload.nama_opd)) {
    return "Nama OPD tidak boleh mengandung angka atau karakter spesial";
  }

  if (payload.alamat && payload.alamat.trim().length > 0) {
    if (payload.alamat.trim().length < 5) {
      return "Alamat OPD minimal 5 karakter";
    }
    if (payload.alamat.trim().length > 255) {
      return "Alamat OPD terlalu panjang (maks 255 karakter)";
    }
    if (REGEX_PATTERNS.ALAMAT_ANGKA_SAJA.test(payload.alamat.trim())) {
      return "Alamat OPD tidak boleh hanya berisi angka";
    }
    if (!REGEX_PATTERNS.ALAMAT_VALID.test(payload.alamat.trim())) {
      return "Alamat OPD tidak boleh mengandung karakter spesial yang tidak valid";
    }
  }

  if (payload.pic && payload.pic.trim().length > 0) {
    if (payload.pic.trim().length < 3) {
      return "Nama PIC minimal 3 karakter";
    }
    if (payload.pic.trim().length > 100) {
      return "Nama PIC terlalu panjang (maks 100 karakter)";
    }
    if (!REGEX_PATTERNS.NAMA_RELAWAN.test(payload.pic)) {
      return "Nama PIC tidak boleh mengandung angka atau karakter spesial";
    }
  }

  if (payload.nik_pic && !REGEX_PATTERNS.NIK.test(payload.nik_pic)) {
    return "NIK PIC harus terdiri dari tepat 16 digit angka";
  }

  // ── TAMBAHKAN VALIDASI KONTAK DI SINI ──
  const cleanKontak = payload.kontak.replace(/[\s-]/g, ""); // buang spasi dan strip jika ada
  if (REGEX_PATTERNS.HAS_LETTERS.test(cleanKontak)) {
    return "Nomor kontak tidak boleh mengandung huruf";
  }
  if (!REGEX_PATTERNS.NO_HP.test(cleanKontak)) {
    return "Format nomor kontak tidak valid (harus diawali 08 atau +628, minimal 9-13 digit angka)";
  }

  return null;
};

  const hasChanges = useMemo(() => {
    if (!selectedOPD) return false;
    return (
      detailFormData.nama_opd !== (selectedOPD.nama_opd || "") ||
      detailFormData.alamat !== (selectedOPD.alamat || "") ||
      detailFormData.pic !== (selectedOPD.pic || "") ||
      detailFormData.nik_pic !== (selectedOPD.nik_pic || "") ||
      detailFormData.kontak !== (selectedOPD.kontak || "")
    );
  }, [selectedOPD, detailFormData]);

  // ── Filter & Pagination ────────────────────────────────────
  const filteredData = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return opdList.filter(
      (opd) =>
        opd.nama_opd.toLowerCase().includes(lowerSearch) ||
        opd.alamat?.toLowerCase().includes(lowerSearch) ||
        opd.pic?.toLowerCase().includes(lowerSearch) ||
        opd.nik_pic?.toLowerCase().includes(lowerSearch) ||
        opd.kontak?.toLowerCase().includes(lowerSearch),
    );
  }, [opdList, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // ── Columns ────────────────────────────────────────────────
const columns = [
  {
    accessor: "nama_opd" as keyof OPDData,
    header: "NAMA OPD",
    width: "20%",
    render: (row: OPDData) => (
      <span className="font-medium text-gray-900 line-clamp-3 break-words" title={row.nama_opd}>
        {row.nama_opd || "-"}
      </span>
    ),
  },
  {
    header: "STATUS",
    width: "10%",
    render: (row: OPDData) => (
      <span
        className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${
          row.status_keaktifan ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
        }`}
      >
        {row.status_keaktifan ? "Aktif" : "Tidak Aktif"}
      </span>
    ),
  },
  {
    accessor: "alamat" as keyof OPDData,
    header: "ALAMAT",
    width: "24%",
    render: (row: OPDData) => (
      <span className="line-clamp-3 break-words text-gray-600" title={row.alamat || "-"}>
        {row.alamat || "-"}
      </span>
    ),
  },
  {
    accessor: "pic" as keyof OPDData,
    header: "PIC",
    width: "14%",
    render: (row: OPDData) => (
      <span className="line-clamp-2 break-words text-gray-700" title={row.pic || "-"}>
        {row.pic || "-"}
      </span>
    ),
  },
  {
    accessor: "kontak" as keyof OPDData,
    header: "KONTAK",
    width: "14%",
    render: (row: OPDData) => (
      <span className="whitespace-nowrap font-mono text-gray-700">
        {row.kontak || "-"}
      </span>
    ),
  },
];

  // ── Handlers ──────────────────────────────────────────────
  // Buka modal detail dan isi form dengan data OPD yang dipilih.
  const handleDetailClick = (opd: OPDData) => {
    setSelectedOPD(opd);
    setDetailFormData({
      alamat: opd.alamat || "",
      kontak: opd.kontak || "",
      nama_opd: opd.nama_opd || "",
      nik_pic: opd.nik_pic || "",
      pic: opd.pic || "",
    });
    setIsDetailModalOpen(true);
  };

  // Siapkan konfirmasi sebelum mengubah status aktif/nonaktif OPD.
  const handleToggleStatus = (opd: OPDData) => {
    setSelectedOPD(opd);
    setIsConfirmModalOpen(true);
  };

  // Kirim perubahan status OPD ke server setelah konfirmasi.
  const handleConfirmToggleStatus = async () => {
    if (!selectedOPD) return;
    toggleStatus.mutate(
      { opd_id: selectedOPD.opd_id, status_keaktifan: !selectedOPD.status_keaktifan },
      {
        onError: (e: unknown) =>
          setToast({ message: parseErrorMessage(e, "Gagal mengubah status"), type: "error" }),
        onSettled: () => {
          setIsConfirmModalOpen(false);
          setSelectedOPD(null);
        },
        onSuccess: (d) => setToast({ message: d.message, type: "success" }),
      },
    );
  };

  // Validasi lalu simpan perubahan data OPD dari modal detail.
  const handleDetailSave = () => {
    if (!selectedOPD) return;
    const validationError = validateOpdForm(detailFormData);
    if (validationError) {
      setToast({ message: validationError, type: "error" });
      return;
    }

    const normalizedNamaOpd = detailFormData.nama_opd.trim();
    const isDuplicate = opdList.some(
      (o) =>
        o.opd_id !== selectedOPD.opd_id &&
        o.nama_opd.toLowerCase() === normalizedNamaOpd.toLowerCase(),
    );
    if (isDuplicate) {
      setToast({ message: "Nama OPD sudah terdaftar", type: "error" });
      return;
    }

    const payload = { ...detailFormData, nama_opd: toTitleCase(normalizedNamaOpd) };
    updateOpd.mutate(
      { opd_id: selectedOPD.opd_id, payload: payload },
      {
        onError: (e: unknown) =>
          setToast({ message: parseErrorMessage(e, "Gagal menyimpan perubahan"), type: "error" }),
        onSuccess: () => {
          setToast({ message: "Data OPD berhasil diperbarui", type: "success" });
          setIsDetailModalOpen(false);
        },
      },
    );
  };

  // Validasi lalu simpan OPD baru dari form tambah data.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateOpdForm(formData);
    if (validationError) {
      setToast({ message: validationError, type: "error" });
      return;
    }

    const normalizedNamaOpd = formData.nama_opd.trim();
    const isDuplicate = opdList.some(
      (o) => o.nama_opd.toLowerCase() === normalizedNamaOpd.toLowerCase(),
    );
    if (isDuplicate) {
      setToast({ message: "Nama OPD sudah terdaftar", type: "error" });
      return;
    }

    const payload = { ...formData, nama_opd: toTitleCase(normalizedNamaOpd) };
    createOpd.mutate(payload, {
      onError: (e: unknown) =>
        setToast({ message: parseErrorMessage(e, "Gagal menambahkan OPD"), type: "error" }),
      onSuccess: () => {
        setToast({ message: "OPD baru berhasil ditambahkan", type: "success" });
        setIsModalOpen(false);
        setFormData({ alamat: "", kontak: "", nama_opd: "", nik_pic: "", pic: "" });
      },
    });
  };

  // Sinkronkan input form tambah OPD ke state lokal.
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Sinkronkan input form detail OPD ke state lokal.
  const handleDetailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDetailFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Ekspor daftar OPD yang sedang terfilter ke PDF.
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      exportToPDF({
        columns: [
          { dataKey: "nama_opd", header: "NAMA OPD" },
          { dataKey: "status_keaktifan", header: "STATUS" },
          { dataKey: "alamat", header: "ALAMAT" },
          { dataKey: "pic", header: "PIC" },
          { dataKey: "kontak", header: "KONTAK" },
        ],
        data: filteredData.map((opd) => ({
          ...opd,
          status_keaktifan: opd.status_keaktifan ? "Aktif" : "Tidak Aktif",
        })),
        filename: `manajemen-opd-${new Date().toISOString().split("T")[0]}.pdf`,
        title: "Data Manajemen OPD",
      });
      setToast({ message: "Data berhasil diekspor ke PDF", type: "success" });
    } catch {
      setToast({ message: "Gagal mengekspor data ke PDF", type: "error" });
    } finally {
      setIsExporting(false);
    }
  };

  // Proses hasil unggahan Excel untuk impor massal OPD.
  const handleExcelUploadConfirm = (data: unknown[]) => {
    bulkOpd.mutate(data, {
      onError: (e: unknown) =>
        setToast({ message: parseErrorMessage(e, "Gagal import Excel dari Excel"), type: "error" }),
      onSuccess: (d) => {
        setToast({ message: d.message, type: "success" });
        setIsUploadModalOpen(false);
      },
    });
  };

  const actions = (row: OPDData) => (
    <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
      <Button variant="secondary" size="sm" onClick={() => handleDetailClick(row)}>
        Detail
      </Button>
      <Button
        variant={row.status_keaktifan ? "danger" : "secondary"}
        size="sm"
        onClick={() => handleToggleStatus(row)}
      >
        {row.status_keaktifan ? "Nonaktif" : "Aktifkan"}
      </Button>
    </div>
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
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="w-80"
        />
      </div>

      {/* Table */}
      <Card>
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Daftar OPD</h2>
          <Button variant="secondary" size="sm" onClick={handleExportPDF} disabled={isExporting}>
            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
            {isExporting ? "Mengekspor..." : "Ekspor PDF"}
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
                ? "Tidak ada OPD yang cocok dengan pencarian Anda."
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
              Menampilkan {startIndex + 1}-
              {Math.min(startIndex + itemsPerPage, filteredData.length)} dari {filteredData.length}{" "}
              OPD
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
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseAddModal}
        title="Tambah OPD Baru"
        subtitle="Isi data OPD yang ingin ditambahkan"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {[
            {
              label: "Nama OPD",
              name: "nama_opd",
              placeholder: "Nama Dinas / OPD",
              required: true,
            },
            { label: "Alamat", name: "alamat", placeholder: "Alamat OPD", required: true },
            { label: "PIC", name: "pic", placeholder: "Penanggung jawab", required: true },
            {
              label: "NIK PIC",
              maxLength: 16,
              name: "nik_pic",
              placeholder: "16 digit NIK PIC",
              required: true,
            },
            {
              label: "Kontak",
              name: "kontak",
              placeholder: "Nomor telepon / email",
              required: true,
            },
          ].map((field) => (
            <div key={field.name} className="grid grid-cols-3 gap-4 items-center">
              <label className="text-lg font-medium text-gray-900">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type="text"
                name={field.name}
                value={(formData as Record<string, string>)[field.name]}
                onChange={handleInputChange}
                placeholder={field.placeholder}
                required={field.required}
                maxLength={(field as Record<string, unknown>).maxLength as number | undefined}
                className="col-span-2 px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              onClick={handleCloseAddModal}
              className="bg-red-600 hover:bg-red-700 text-white px-8"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700 text-white px-8 disabled:opacity-70"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-1" />
                  Menyimpan...
                </>
              ) : (
                "Simpan"
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Detail OPD"
        subtitle="Edit data OPD"
        maxWidth="2xl"
      >
        {selectedOPD && (
          <div className="space-y-6">
            {[
              { label: "Nama OPD", name: "nama_opd", required: true },
              { label: "Alamat", name: "alamat", required: true },
              { label: "PIC", name: "pic", required: true },
              { label: "NIK PIC", maxLength: 16, name: "nik_pic", required: true },
              { label: "Kontak", name: "kontak", required: true },
            ].map((field) => (
              <div key={field.name} className="grid grid-cols-3 gap-4 items-center">
                <label className="text-lg font-medium text-gray-900">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  name={field.name}
                  value={(detailFormData as Record<string, string>)[field.name]}
                  onChange={handleDetailInputChange}
                  maxLength={(field as Record<string, unknown>).maxLength as number | undefined}
                  className="col-span-2 px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
            <div className="flex justify-end pt-6">
              <Button
                type="button"
                onClick={handleDetailSave}
                disabled={!hasChanges || isSaving}
                className="bg-green-600 hover:bg-green-700 text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-1" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan"
                )}
              </Button>
            </div>
            <div className="pt-4 border-t border-gray-200 space-y-1">
              <div className="flex gap-2 text-sm">
                <span className="font-medium">Tanggal Dibuat</span>
                <span>{new Date(selectedOPD.created_at).toLocaleString("id-ID")}</span>
              </div>
              <div className="flex gap-2 text-sm italic text-gray-500">
                <span>Terakhir di-update</span>
                <span>{new Date(selectedOPD.updated_at).toLocaleString("id-ID")}</span>
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
        subtitle={
          selectedOPD?.status_keaktifan
            ? "Apakah Anda yakin ingin menonaktifkan OPD ini?"
            : "Apakah Anda yakin ingin mengaktifkan OPD ini?"
        }
        maxWidth="md"
        showCloseButton={false}
      >
        {selectedOPD && (
          <div className="space-y-6">
            <div className="text-center py-4">
              <p className="text-lg text-gray-700">
                Anda akan {selectedOPD.status_keaktifan ? "menonaktifkan" : "mengaktifkan"}{" "}
                <span className="font-semibold">{selectedOPD.nama_opd}</span>
              </p>
            </div>
            <div className="flex justify-center gap-4 pt-6">
              <Button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-8"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleConfirmToggleStatus}
                disabled={toggleStatus.isPending}
                className="bg-red-600 hover:bg-red-700 text-white px-8"
              >
                {toggleStatus.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Lanjutkan"
                )}
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

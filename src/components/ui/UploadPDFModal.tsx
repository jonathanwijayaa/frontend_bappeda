import React, { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Modal from "./Modal";
import Button from "./Button";
import { Upload, X, FileText } from "lucide-react";
import AutocompleteInput from "./AutocompleteInput";
import apiClient from "../../lib/axios";

interface UploadPDFModalProps {
  isOPD?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (file: File, metadata: unknown) => Promise<void>;
  title: string;
  userOpdData?: { id?: number; name?: string };
}

interface AutoOption {
  label: string;
  value: string;
}

const UploadPDFModal: React.FC<UploadPDFModalProps> = ({
  isOPD = false,
  isOpen,
  onClose,
  onConfirm,
  title,
  userOpdData,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // === STATE: Pemilihan Kader ===
  const [kaderOptions, setKaderOptions] = useState<{ kader_id: number; nama_kader: string }[]>([]);
  const [selectedKaderIds, setSelectedKaderIds] = useState<number[]>([]);
  const [isSelectAllKader, setIsSelectAllKader] = useState(true); // Default: Semua Kader
  const isAllSelected = kaderOptions.length > 0 && selectedKaderIds.length === kaderOptions.length;

  // State untuk opsi OPD dari database (Hanya diambil jika user adalah Super Admin)
  const [opdOptions, setOpdOptions] = useState<AutoOption[]>([]);

  const [metadata, setMetadata] = useState({
    batasAktif: "",
    judulSK: "",
    nomorSK: "",
    opd_id: "",
    opd_name: "", // Tambahan state untuk menyimpan text nama OPD
    tanggalTerbit: "",
  });

  // Reset dan atur nilai awal saat modal terbuka
  useEffect(() => {
    if (isOpen) {
      setMetadata({
        batasAktif: "",
        judulSK: "",
        nomorSK: "",
        // Jika isOPD, langsung kunci id dan namanya dari props userOpdData
        opd_id: isOPD && userOpdData?.id ? String(userOpdData.id) : "",
        opd_name: isOPD && userOpdData?.name ? userOpdData.name : "",
        tanggalTerbit: "",
      });
      setFile(null);
      setKaderOptions([]);
      setSelectedKaderIds([]);
      setIsSelectAllKader(true);

      // Ambil daftar OPD dari API HANYA jika yang login adalah Super Admin
      if (!isOPD) {
        apiClient
          .get("/opd")
          .then((r) => r.data)
          .then((result) => {
            if (result.success) {
              setOpdOptions(
                result.data.map((o: unknown) => ({
                  label: o.nama_opd,
                  value: String(o.opd_id),
                })),
              );
            }
          })
          .catch(() => console.error("Gagal mengambil daftar OPD"));
      }
    }
  }, [isOpen, isOPD, userOpdData]);

  // === useEffect: Fetch Kader berdasarkan OPD ===
  useEffect(() => {
    const opdId = metadata.opd_id;
    if (!opdId || !isOpen) {
      setKaderOptions([]);
      return;
    }

    // Gunakan endpoint /admin/sk/kader-list yang bisa diakses oleh super_admin DAN opd
    apiClient
      .get(`/admin/sk/kader-list?opd_id=${opdId}`)
      .then((r) => r.data)
      .then((result) => {
        if (result.success) {
          setKaderOptions(result.data);
        }
      })
      .catch(() => console.error("Gagal mengambil daftar Kader"));
  }, [metadata.opd_id, isOpen]);

  // === Fitur Drag & Drop menggunakan react-dropzone ===
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: unknown[]) => {
    if (rejectedFiles.length > 0) {
      const isSizeError = rejectedFiles[0].errors.some((e: unknown) => e.code === "file-too-large");
      if (isSizeError) {
        alert("Ukuran file maksimal 2MB");
      } else {
        alert("Hanya file berformat PDF yang diperbolehkan");
      }
      return;
    }
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getInputProps, getRootProps, isDragActive, isDragReject } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    maxSize: 2 * 1024 * 1024, // Maksimal 2MB
    multiple: false,
    onDrop,
  });

  // Fungsi handle perubahan pada komponen Autocomplete
  const handleOpdChange = (val: string) => {
    const matched = opdOptions.find((o) => o.label.toLowerCase() === val.toLowerCase());
    setMetadata((prev) => ({
      ...prev,
      opd_id: matched ? matched.value : "",
      opd_name: val,
    }));
  };

  // === HANDLER: Toggle "Semua Kader" ===
  const handleSelectAllKader = () => {
    if (isAllSelected) {
      // Jika sudah tercentang semua, kosongkan pilihan
      setSelectedKaderIds([]);
    } else {
      // Jika belum tercentang semua, centang seluruh ID kader
      setSelectedKaderIds(kaderOptions.map((k) => k.kader_id));
    }
  };

  // === HANDLER: Toggle satu Kader ===
  const handleToggleKader = (kaderId: number) => {
    setIsSelectAllKader(false); // Lepas centang "Semua"
    setSelectedKaderIds(
      (prev) =>
        prev.includes(kaderId)
          ? prev.filter((id) => id !== kaderId) // Hapus jika sudah dipilih
          : [...prev, kaderId], // Tambah jika belum
    );
  };

  const handleSubmit = async () => {
    const missingFields = [];
    if (!file) missingFields.push("File PDF");
    if (metadata.nomorSK.trim() === "") missingFields.push("Nomor SK");
    if (metadata.judulSK.trim() === "") missingFields.push("Judul SK");
    if (metadata.tanggalTerbit.trim() === "") missingFields.push("Tanggal Terbit");
    if (metadata.batasAktif.trim() === "") missingFields.push("Batas Aktif");
    if (metadata.opd_id.trim() === "") missingFields.push("OPD");

    if (missingFields.length > 0) {
      alert(
        `Terdapat field yang masih kosong:\n- ${missingFields.join("\n- ")}\n\nHarap lengkapi semua field yang wajib diisi.`,
      );
      return;
    }
    // Validasi ekstra: Super Admin tidak boleh upload kalau tidak pilih OPD yang valid
    if (!isOPD && !metadata.opd_id) {
      alert("Harap pilih OPD yang valid dari daftar.");
      return;
    }
    // === VALIDASI: Pemilihan Kader ===
    if (!isSelectAllKader && selectedKaderIds.length === 0) {
      alert('Harap pilih minimal 1 Kader atau centang "Semua Kader".');
      return;
    }
    setIsUploading(true);
    try {
      await onConfirm(file!, {
        ...metadata,
        kader_ids: isSelectAllKader ? "ALL" : selectedKaderIds,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} maxWidth="lg">
      <div className="space-y-4">
        {/* Drag and Drop File Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ease-in-out
                        ${
                          isDragActive && !isDragReject
                            ? "border-blue-500 bg-blue-50"
                            : isDragReject
                              ? "border-red-500 bg-red-50"
                              : "border-gray-400 hover:border-blue-400 hover:bg-gray-50"
                        }`}
        >
          <input {...getInputProps()} />

          {file ? (
            <div className="flex items-center justify-center gap-2 text-green-600">
              <FileText size={24} />
              <span className="text-sm font-medium">{file.name}</span>
              <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(2)} KB)</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="ml-2 text-red-500 hover:text-red-700"
                title="Hapus file"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mb-4
                                ${isDragActive && !isDragReject ? "bg-blue-100" : isDragReject ? "bg-red-100" : "bg-gray-100"}`}
              >
                <Upload
                  size={32}
                  className={
                    isDragActive && !isDragReject
                      ? "text-blue-600"
                      : isDragReject
                        ? "text-red-600"
                        : "text-gray-500"
                  }
                />
              </div>
              <div className="space-y-1">
                {isDragActive ? (
                  isDragReject ? (
                    <p className="text-red-600 font-medium text-sm">
                      File harus berformat PDF (Maks 2MB)!
                    </p>
                  ) : (
                    <p className="text-blue-600 font-medium text-sm">Lepaskan file di sini...</p>
                  )
                ) : (
                  <>
                    <p className="text-gray-700 font-medium text-sm">
                      Tarik & lepas file PDF di sini
                    </p>
                    <p className="text-gray-500 text-xs">atau klik untuk memilih file</p>
                    <p className="text-gray-400 text-xs mt-1">Format: .pdf • Maks: 2MB</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nomor SK <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={metadata.nomorSK}
              onChange={(e) => setMetadata({ ...metadata, nomorSK: e.target.value })}
              className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="800/123/BPBD/2026"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Judul SK <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={metadata.judulSK}
              onChange={(e) => setMetadata({ ...metadata, judulSK: e.target.value })}
              className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Pengangkatan Kader"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Terbit <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={metadata.tanggalTerbit}
              onChange={(e) => setMetadata({ ...metadata, tanggalTerbit: e.target.value })}
              className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Batas Aktif <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={metadata.batasAktif}
              onChange={(e) => setMetadata({ ...metadata, batasAktif: e.target.value })}
              className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/*  KOLOM OPD ROLE-AWARE */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              OPD <span className="text-red-500">*</span>
            </label>
            {isOPD ? (
              <input
                type="text"
                disabled
                value={metadata.opd_name || "Instansi Anda"}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 italic cursor-not-allowed"
              />
            ) : (
              <div className="relative">
                <AutocompleteInput
                  name="opd_name"
                  value={metadata.opd_name}
                  options={opdOptions}
                  onChange={handleOpdChange}
                  placeholder="Ketik nama OPD..."
                  warnIfNotFound={true}
                  warnMessage="OPD tidak ditemukan di database"
                />
                {/* Indikator centang hijau jika OPD valid ditemukan */}
                {metadata.opd_id && (
                  <p className="mt-1 text-xs text-green-600 font-medium">✓ OPD valid dipilih</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* === PEMILIHAN KADER === */}
        {metadata.opd_id && (
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Target Kader <span className="text-red-500">*</span>
              </label>

              {/* Checkbox Pilih Semua ditaruh sejajar dengan label */}
              {kaderOptions.length > 0 && (
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAllKader}
                    className="rounded border-gray-400 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  Pilih Semua ({kaderOptions.length} kader)
                </label>
              )}
            </div>

            {kaderOptions.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Tidak ada kader terdaftar di OPD ini.</p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2">
                {/* Render Opsi Per Kader */}
                {kaderOptions.map((kader) => {
                  const isSelected = selectedKaderIds.includes(kader.kader_id);

                  return (
                    <label
                      key={kader.kader_id}
                      // Highlight Biru & Hilangkan statis disabled
                      className={`flex items-center gap-3 cursor-pointer p-2 rounded-md transition-colors border ${
                        isSelected
                          ? "bg-blue-50 border-blue-200"
                          : "hover:bg-gray-50 border-transparent"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleKader(kader.kader_id)}
                        className="rounded border-gray-400 text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span
                        className={`text-sm ${isSelected ? "text-blue-800 font-medium" : "text-gray-600"}`}
                      >
                        {kader.nama_kader}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Batal
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isUploading}>
            {isUploading ? "Mengunggah..." : "Unggah SK"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default UploadPDFModal;

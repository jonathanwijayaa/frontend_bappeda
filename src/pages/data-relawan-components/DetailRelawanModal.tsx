import React, { useState, useEffect } from "react";
import { Loader2, AlertCircle, Plus } from "lucide-react";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import Select from "../../components/ui/Select";
import AutocompleteInput from "../../components/ui/AutocompleteInput";
import { AssignmentFormFields } from "./AssignmentFormFields";
import type { RelawanData, Assignment } from "../../types/relawan.types";
import type { AutoOption } from "../../types/common.types";
import { formatPhoneDisplay } from "../../utils/formatPhone";
import { REGEX_PATTERNS } from "../../utils/regex";

interface DetailRelawanModalProps {
  isOpen: boolean;
  onClose: () => void;
  relawan: RelawanData | null;
  isOPD: boolean;
  userOpdName?: string;
  userOpdId?: number;
  opdOptions: AutoOption[];
  kemantrenOptions: AutoOption[];
  kelurahanOptions: AutoOption[];
  kaderOptionsByIndex: Record<number, AutoOption[]>;
  isLoadingKaderByIndex: Record<number, boolean>;
  onKemantrenChange: (kemantren: string) => void;
  onOpdChangeAssignment: (index: number, opdName: string) => void;
  onKaderChangeAssignment: (index: number, kaderName: string) => void;
  onSaveEdit: (detailFormData: any) => Promise<void>;
  onDeletePenugasan: (penugasanId: number, index: number) => void;
  isSavingEdit: boolean;
}

const JENIS_KELAMIN_OPTIONS = [
  { label: "Laki-laki (L)", value: "L" },
  { label: "Perempuan (P)", value: "P" },
];

export const DetailRelawanModal: React.FC<DetailRelawanModalProps> = ({
  isOpen,
  onClose,
  relawan,
  isOPD,
  userOpdName,
  userOpdId,
  opdOptions,
  kemantrenOptions,
  kelurahanOptions,
  kaderOptionsByIndex,
  isLoadingKaderByIndex,
  onKemantrenChange,
  onOpdChangeAssignment,
  onKaderChangeAssignment,
  onSaveEdit,
  onDeletePenugasan,
  isSavingEdit,
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [detailFormData, setDetailFormData] = useState({
    alamat: "",
    assignments: [] as Assignment[],
    jenisKelamin: "L" as "L" | "P",
    kelurahan: "",
    kemantren: "",
    namaRelawan: "",
    nik: "",
    no_hp: "",
  });

  const validateEditForm = (): string | null => {
    const nama = detailFormData.namaRelawan.trim();
    if (!nama) return "Nama Relawan wajib diisi";
    if (nama.length < 3) return "Nama Relawan minimal 3 karakter";
    if (!REGEX_PATTERNS.NAMA_RELAWAN.test(nama)) {
      return "Format nama relawan tidak valid (hanya huruf, spasi, titik, koma, petik)";
    }

    const alamat = detailFormData.alamat.trim();
    if (alamat && alamat !== "-") {
      if (REGEX_PATTERNS.ALAMAT_ANGKA_SAJA.test(alamat)) {
        return "Alamat tidak boleh hanya berupa angka";
      }
      if (!REGEX_PATTERNS.ALAMAT_VALID.test(alamat)) {
        return "Alamat mengandung karakter tidak valid";
      }
    }

    const rawHp = detailFormData.no_hp.trim();
    if (rawHp && rawHp !== "-") {
      const cleanHp = rawHp.replace(/[\s-]/g, "");
      if (REGEX_PATTERNS.HAS_LETTERS.test(cleanHp)) {
        return "Nomor HP tidak boleh mengandung huruf";
      }
      if (!REGEX_PATTERNS.NO_HP.test(cleanHp)) {
        return "Format Nomor HP tidak valid (harus diawali 08 atau +628, 9-13 digit angka)";
      }
    }

    return null;
  };

  // Reset seluruh form detail kembali ke data awal relawan dan matikan edit mode
  const resetToRelawanData = () => {
    if (relawan) {
      const assigns = Array.isArray(relawan.assignments) ? relawan.assignments : [];
      setDetailFormData({
        alamat: relawan.alamat || "-",
        assignments: assigns,
        jenisKelamin: (relawan.jenisKelamin as "L" | "P") || "L",
        kelurahan: relawan.kelurahan || "-",
        kemantren: relawan.kemantren || "-",
        namaRelawan: relawan.namaLengkap || "",
        nik: relawan.nik || "",
        no_hp: relawan.no_hp || "-",
      });
    }
    setIsEditMode(false);
    setErrorMsg(null);
  };

  // ── Effect 1: Reset form data setiap kali modal dibuka atau ganti relawan
  useEffect(() => {
    if (isOpen && relawan) {
      resetToRelawanData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, relawan?.relawan_id ?? relawan?.nik]);

  // ── Effect 2: Pre-fetch kader options setiap kali relawan (atau konteks OPD) berubah
  // Dipisah agar tidak ikut mereset form data saat user sedang edit.
  useEffect(() => {
    if (!isOpen || !relawan) return;
    const assigns = Array.isArray(relawan.assignments) ? relawan.assignments : [];
    assigns.forEach((assign, idx) => {
      if (assign.opd || isOPD) {
        onOpdChangeAssignment(idx, assign.opd || userOpdName || "");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, relawan?.relawan_id ?? relawan?.nik, isOPD, userOpdName]);

  const handleClose = () => {
    resetToRelawanData();
    onClose();
  };

  const handleAddAssignment = () => {
    const newIndex = detailFormData.assignments.length;
    const newOpdName = isOPD ? userOpdName || "" : "";
    const newOpdId = isOPD ? (userOpdId || 0) : 0;

    setDetailFormData((prev) => ({
      ...prev,
      assignments: [
        ...prev.assignments,
        {
          id: `new-${Date.now()}`,
          detail: "",
          kader: "",
          kader_id: null,
          nomorSK: "",
          opd: newOpdName,
          opd_id: newOpdId,
          penugasan: "",
          peran: "",
          skId: "",
          status_keaktifan: "Aktif",
        } as Assignment,
      ],
    }));

    if (isOPD || newOpdName) {
      onOpdChangeAssignment(newIndex, newOpdName);
    }
  };

  const handleRemoveAssignment = (index: number) => {
    const assignment = detailFormData.assignments[index];
    const penugasanId = parseInt(assignment.id) || 0;

    if (penugasanId > 0) {
      // Penugasan sudah tersimpan di DB → panggil delete ke backend
      onDeletePenugasan(penugasanId, index);
    }
    // Hapus dari local state (baik penugasan baru maupun yang sudah di-DB)
    setDetailFormData((prev) => ({
      ...prev,
      assignments: prev.assignments.filter((_, i) => i !== index),
    }));
  };

  const handleOpdChange = (index: number, opdName: string) => {
    const match = opdOptions.find((o) => o.label.toLowerCase() === opdName.toLowerCase());
    const opdId = match ? Number(match.value) : 0;

    setDetailFormData((prev) => {
      const newAssigns = [...prev.assignments];
      newAssigns[index] = {
        ...newAssigns[index],
        opd: opdName,
        opd_id: opdId,
        kader: "",
        kader_id: null,
      };
      return { ...prev, assignments: newAssigns };
    });

    onOpdChangeAssignment(index, opdName);
  };

  const handleKaderChange = (index: number, kaderName: string) => {
    const kaderOpts = kaderOptionsByIndex[index] || [];
    const match = kaderOpts.find((k) => k.label.toLowerCase() === kaderName.toLowerCase());
    const kaderId = match ? Number(match.value) : null;

    setDetailFormData((prev) => {
      const newAssigns = [...prev.assignments];
      newAssigns[index] = {
        ...newAssigns[index],
        kader: kaderName,
        kader_id: kaderId,
      };
      return { ...prev, assignments: newAssigns };
    });

    onKaderChangeAssignment(index, kaderName);
  };

  if (!relawan) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Detail Relawan"
      subtitle={isEditMode ? "Mode Edit — ubah data lalu klik Simpan" : "Informasi lengkap relawan"}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (isEditMode) {
                resetToRelawanData();
              } else {
                setErrorMsg(null);
                setIsEditMode(true);
              }
            }}
            className={isEditMode ? "border-gray-400 text-gray-600" : "border-blue-500 text-blue-600"}
          >
            {isEditMode ? "Batal" : "Edit Data"}
          </Button>
        </div>

        {[
          { label: "Nama Relawan", name: "namaRelawan" },
          { label: "NIK", name: "nik" },
          { label: "Alamat KTP", name: "alamat" },
          { label: "No. HP", name: "no_hp" },
        ].map((f) => {
          const editable = isEditMode && f.name !== "nik";
          return (
            <div key={f.name} className="grid grid-cols-3 gap-4 items-center">
              <label className="text-lg font-medium text-gray-900">{f.label}</label>
              <input
                type="text"
                value={
                  !isEditMode && f.name === "no_hp"
                    ? formatPhoneDisplay((detailFormData as any)[f.name])
                    : (detailFormData as any)[f.name]
                }
                readOnly={!editable}
                onChange={(e) => setDetailFormData((prev) => ({ ...prev, [f.name]: e.target.value }))}
                className={`col-span-2 px-4 py-2 border rounded-lg ${
                  editable
                    ? "border-blue-300 focus:ring-2 focus:ring-blue-500 bg-white"
                    : "border-gray-200 bg-gray-50 text-gray-400 italic"
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
              onChange={(val) => {
                setDetailFormData((prev) => ({ ...prev, kemantren: val, kelurahan: "" }));
                onKemantrenChange(val);
              }}
              placeholder="Cari nama Kemantren..."
              className="col-span-2"
              warnIfNotFound={false}
            />
          ) : (
            <input
              type="text"
              value={detailFormData.kemantren}
              readOnly
              className="col-span-2 px-4 py-2 border border-gray-200 bg-gray-50 text-gray-400 italic rounded-lg"
            />
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 items-center">
          <label className="text-lg font-medium text-gray-900">Kelurahan</label>
          {isEditMode ? (
            <AutocompleteInput
              name="kelurahan"
              value={detailFormData.kelurahan}
              options={kelurahanOptions}
              onChange={(val) => setDetailFormData((prev) => ({ ...prev, kelurahan: val }))}
              placeholder="Cari nama Kelurahan..."
              disabled={!detailFormData.kemantren}
              className="col-span-2"
              warnIfNotFound={false}
            />
          ) : (
            <input
              type="text"
              value={detailFormData.kelurahan}
              readOnly
              className="col-span-2 px-4 py-2 border border-gray-200 bg-gray-50 text-gray-400 italic rounded-lg"
            />
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 items-center">
          <label className="text-lg font-medium text-gray-900">Jenis Kelamin</label>
          <div className="col-span-2">
            <Select
              name="jenisKelamin"
              value={detailFormData.jenisKelamin}
              disabled={!isEditMode}
              onChange={(e) =>
                setDetailFormData((prev) => ({
                  ...prev,
                  jenisKelamin: e.target.value as "L" | "P",
                }))
              }
              options={JENIS_KELAMIN_OPTIONS}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Daftar Penugasan:</h3>
          {detailFormData.assignments.length === 0 && (
            <p className="text-sm text-gray-400 italic mb-4">Belum ada data penugasan.</p>
          )}
          {detailFormData.assignments.map((assignment, index) => (
            <AssignmentFormFields
              key={assignment.id}
              assignment={assignment}
              index={index}
              isReadOnly={!isEditMode}
              isOPD={isOPD}
              userOpdName={userOpdName}
              opdOptions={opdOptions}
              kaderOptions={kaderOptionsByIndex[index] || []}
              isKaderLoading={isLoadingKaderByIndex[index] || false}
              context={isEditMode ? "form" : "detail"}
              onFieldChange={(i, f, val) => {
                const newAssigns = [...detailFormData.assignments];
                newAssigns[i] = { ...newAssigns[i], [f]: val };
                setDetailFormData((prev) => ({ ...prev, assignments: newAssigns }));
              }}
              onOpdChange={handleOpdChange}
              onKaderChange={handleKaderChange}
              onRemove={handleRemoveAssignment}
            />
          ))}
          {isEditMode && (
            <div className="flex justify-center mt-4">
              <Button type="button" variant="primary" size="sm" onClick={handleAddAssignment}>
                <Plus size={16} /> Tambah Data Penugasan
              </Button>
            </div>
          )}
        </div>

        {isEditMode && (
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              onClick={resetToRelawanData}
              className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-6"
            >
              Batal
            </Button>
            <Button
              onClick={() => {
                const err = validateEditForm();
                if (err) {
                  setErrorMsg(err);
                  return;
                }
                setErrorMsg(null);
                void onSaveEdit(detailFormData);
              }}
              disabled={isSavingEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-10 disabled:opacity-50"
            >
              {isSavingEdit ? <Loader2 size={16} className="animate-spin" /> : "Simpan Perubahan"}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
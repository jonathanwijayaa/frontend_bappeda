import React, { useState, useEffect } from "react";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import Select from "../../components/ui/Select";
import AutocompleteInput from "../../components/ui/AutocompleteInput";
import { AssignmentFormFields } from "./AssignmentFormFields";
import type { Assignment } from "../../types/relawan.types";
import type { AutoOption } from "../../types/common.types";
import { REGEX_PATTERNS } from "../../utils/regex";

interface TambahRelawanModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  onSubmit: (formData: any) => Promise<void>;
  isSaving: boolean;
}

const JENIS_KELAMIN_OPTIONS = [
  { label: "Laki-laki (L)", value: "L" },
  { label: "Perempuan (P)", value: "P" },
];

export const TambahRelawanModal: React.FC<TambahRelawanModalProps> = ({
  isOpen,
  onClose,
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
  onSubmit,
  isSaving,
}) => {
  const [formData, setFormData] = useState({
    alamat: "",
    assignments: [] as Assignment[],
    jenisKelamin: "L" as "L" | "P",
    kelurahan: "",
    kemantren: "",
    namaRelawan: "",
    nik: "",
    no_hp: "",
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const validateForm = (): string | null => {
    const nama = formData.namaRelawan.trim();
    if (!nama) return "Nama Relawan wajib diisi";
    if (nama.length < 3) return "Nama Relawan minimal 3 karakter";
    if (!REGEX_PATTERNS.NAMA_RELAWAN.test(nama)) {
      return "Format nama relawan tidak valid (hanya huruf, spasi, titik, koma, petik)";
    }

    const nik = formData.nik.trim();
    if (!nik) return "NIK wajib diisi";
    if (!REGEX_PATTERNS.NIK.test(nik)) {
      return "NIK harus tepat 16 digit angka";
    }

    const alamat = formData.alamat.trim();
    if (!alamat) return "Alamat KTP wajib diisi";
    if (alamat.length < 5) return "Alamat minimal 5 karakter";
    if (REGEX_PATTERNS.ALAMAT_ANGKA_SAJA.test(alamat)) {
      return "Alamat tidak boleh hanya berupa angka";
    }
    if (!REGEX_PATTERNS.ALAMAT_VALID.test(alamat)) {
      return "Alamat mengandung karakter tidak valid";
    }

    const rawHp = formData.no_hp.trim();
    if (!rawHp) return "Nomor HP wajib diisi";
    const cleanHp = rawHp.replace(/[\s-]/g, "");
    if (REGEX_PATTERNS.HAS_LETTERS.test(cleanHp)) {
      return "Nomor HP tidak boleh mengandung huruf";
    }
    if (!REGEX_PATTERNS.NO_HP.test(cleanHp)) {
      return "Format Nomor HP tidak valid (harus diawali 08 atau +628, 9-13 digit angka)";
    }

    if (!formData.kemantren.trim()) return "Kemantren wajib dipilih";
    if (!formData.kelurahan.trim()) return "Kelurahan wajib dipilih";

    return null;
  };

  useEffect(() => {
    if (isOpen) {
      setFormData({
        alamat: "",
        assignments: [],
        jenisKelamin: "L",
        kelurahan: "",
        kemantren: "",
        namaRelawan: "",
        nik: "",
        no_hp: "",
      });
    }
  }, [isOpen]);

  const handleAddAssignment = () => {
    const newIndex = formData.assignments.length;
    const newOpdName = isOPD ? userOpdName || "" : "";
    const newOpdId = isOPD ? userOpdId || 0 : 0;

    setFormData((prev) => ({
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
        },
      ],
    }));

    if (isOPD || newOpdName) {
      onOpdChangeAssignment(newIndex, newOpdName);
    }
  };

  const handleRemoveAssignment = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      assignments: prev.assignments.filter((_, i) => i !== index),
    }));
  };

  const handleFieldChange = (index: number, field: string, value: string) => {
    setFormData((prev) => {
      const newAssigns = [...prev.assignments];
      newAssigns[index] = { ...newAssigns[index], [field]: value };
      return { ...prev, assignments: newAssigns };
    });
  };

  const handleOpdChange = (index: number, opdName: string) => {
    const match = opdOptions.find((o) => o.label.toLowerCase() === opdName.toLowerCase());
    const opdId = match ? Number(match.value) : 0;

    setFormData((prev) => {
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

    setFormData((prev) => {
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tambah Relawan Baru"
      subtitle="Isi data relawan yang ingin ditambahkan"
      maxWidth="2xl"
    >
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircle size={16} className="text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const err = validateForm();
          if (err) {
            setErrorMsg(err);
            return;
          }
          setErrorMsg(null);
          void onSubmit(formData);
        }}
        className="space-y-6"
      >
        {[
          { label: "Nama Relawan", name: "namaRelawan", placeholder: "Nama Lengkap Relawan", required: true },
          { label: "NIK", maxLength: 16, name: "nik", placeholder: "16 digit NIK", required: true },
          { label: "Alamat KTP", name: "alamat", placeholder: "Alamat sesuai KTP", required: true },
          { label: "No. HP", name: "no_hp", placeholder: "Nomor HP", required: true },
        ].map((f) => (
          <div key={f.name} className="grid grid-cols-3 gap-4 items-center">
            <label className="text-lg font-medium text-gray-900">
              {f.label} {f.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={(formData as any)[f.name]}
              maxLength={f.maxLength}
              onChange={(e) => {
                const val = f.name === "nik" ? e.target.value.replace(/\D/g, "") : e.target.value;
                setFormData((prev) => ({ ...prev, [f.name]: val }));
              }}
              placeholder={f.placeholder}
              required={f.required}
              className="col-span-2 px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}

        <div className="grid grid-cols-3 gap-4 items-center">
          <label className="text-lg font-medium text-gray-900">
            Kemantren <span className="text-red-500">*</span>
          </label>
          <AutocompleteInput
            name="kemantren"
            value={formData.kemantren}
            options={kemantrenOptions}
            onChange={(val) => {
              setFormData((prev) => ({ ...prev, kemantren: val, kelurahan: "" }));
              onKemantrenChange(val);
            }}
            placeholder="Cari nama Kemantren..."
            required
            warnIfNotFound={false}
            className="col-span-2"
          />
        </div>

        <div className="grid grid-cols-3 gap-4 items-center">
          <label className="text-lg font-medium text-gray-900">
            Kelurahan <span className="text-red-500">*</span>
          </label>
          <AutocompleteInput
            name="kelurahan"
            value={formData.kelurahan}
            options={kelurahanOptions}
            onChange={(val) => setFormData((prev) => ({ ...prev, kelurahan: val }))}
            placeholder={
              formData.kemantren ? "Cari nama Kelurahan..." : "Pilih Kemantren terlebih dahulu..."
            }
            required
            disabled={!formData.kemantren}
            warnIfNotFound={false}
            className="col-span-2"
          />
        </div>

        <div className="grid grid-cols-3 gap-4 items-center">
          <label className="text-lg font-medium text-gray-900">
            Jenis Kelamin <span className="text-red-500">*</span>
          </label>
          <div className="col-span-2">
            <Select
              name="jenisKelamin"
              value={formData.jenisKelamin}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  jenisKelamin: e.target.value as "L" | "P",
                }))
              }
              options={JENIS_KELAMIN_OPTIONS}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daftar Penugasan:</h3>
          {formData.assignments.map((assignment, index) => (
            <AssignmentFormFields
              key={assignment.id}
              assignment={assignment}
              index={index}
              isReadOnly={false}
              isOPD={isOPD}
              userOpdName={userOpdName}
              opdOptions={opdOptions}
              kaderOptions={kaderOptionsByIndex[index] || []}
              isKaderLoading={isLoadingKaderByIndex[index] || false}
              onFieldChange={handleFieldChange}
              onOpdChange={handleOpdChange}
              onKaderChange={handleKaderChange}
              onRemove={handleRemoveAssignment}
            />
          ))}
          <div className="flex justify-center mt-4">
            <Button type="button" variant="primary" size="sm" onClick={handleAddAssignment}>
              <Plus size={16} /> Tambah Data Penugasan
            </Button>
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700 text-white px-12 disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : "Simpan"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
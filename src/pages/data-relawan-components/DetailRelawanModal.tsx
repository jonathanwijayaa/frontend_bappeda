import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import Select from "../../components/ui/Select";
import AutocompleteInput from "../../components/ui/AutocompleteInput";
import { AssignmentFormFields } from "./AssignmentFormFields";
import type { RelawanData, Assignment } from "../../types/relawan.types";
import type { AutoOption } from "../../types/common.types";
import { formatPhoneDisplay } from "../../utils/formatPhone";

interface DetailRelawanModalProps {
  isOpen: boolean;
  onClose: () => void;
  relawan: RelawanData | null;
  isOPD: boolean;
  userOpdName?: string;
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

  useEffect(() => {
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
      setIsEditMode(false);

      // Pre-fetch kader options for each assignment
      assigns.forEach((assign, idx) => {
        if (assign.opd || isOPD) {
          onOpdChangeAssignment(idx, assign.opd || userOpdName || "");
        }
      });
    }
  }, [relawan, isOPD, userOpdName, onOpdChangeAssignment]);

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
      onClose={onClose}
      title="Detail Relawan"
      subtitle={isEditMode ? "Mode Edit — ubah data lalu klik Simpan" : "Informasi lengkap relawan"}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
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
              onRemove={() => onDeletePenugasan(parseInt(assignment.id) || 0, index)}
            />
          ))}
        </div>

        {isEditMode && (
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              onClick={() => setIsEditMode(false)}
              className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-6"
            >
              Batal
            </Button>
            <Button
              onClick={() => void onSaveEdit(detailFormData)}
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
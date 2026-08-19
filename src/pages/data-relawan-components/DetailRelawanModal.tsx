import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
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
      setDetailFormData({
        alamat: relawan.alamat || "-",
        assignments: Array.isArray(relawan.assignments) ? relawan.assignments : [],
        jenisKelamin: (relawan.jenisKelamin as "L" | "P") || "L",
        kelurahan: relawan.kelurahan || "-",
        kemantren: relawan.kemantren || "-",
        namaRelawan: relawan.namaLengkap || "",
        nik: relawan.nik || "",
        no_hp: relawan.no_hp || "-",
      });
      setIsEditMode(false);
    }
  }, [relawan]);

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
                value={!isEditMode && f.name === "no_hp" ? formatPhoneDisplay((detailFormData as any)[f.name]) : (detailFormData as any)[f.name]}
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
            <input type="text" value={detailFormData.kemantren} readOnly className="col-span-2 px-4 py-2 border border-gray-200 bg-gray-50 text-gray-400 italic rounded-lg" />
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
            <input type="text" value={detailFormData.kelurahan} readOnly className="col-span-2 px-4 py-2 border border-gray-200 bg-gray-50 text-gray-400 italic rounded-lg" />
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 items-center">
          <label className="text-lg font-medium text-gray-900">Jenis Kelamin</label>
          <select
            value={detailFormData.jenisKelamin}
            disabled={!isEditMode}
            onChange={(e) => setDetailFormData((prev) => ({ ...prev, jenisKelamin: e.target.value as "L" | "P" }))}
            className="col-span-2 px-4 py-2 border rounded-lg disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="L">Laki-laki (L)</option>
            <option value="P">Perempuan (P)</option>
          </select>
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
              onOpdChange={onOpdChangeAssignment}
              onKaderChange={onKaderChangeAssignment}
              onRemove={() => onDeletePenugasan(parseInt(assignment.id) || 0, index)}
            />
          ))}
        </div>

        {isEditMode && (
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button onClick={() => setIsEditMode(false)} className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-6">Batal</Button>
            <Button onClick={() => void onSaveEdit(detailFormData)} disabled={isSavingEdit} className="bg-blue-600 hover:bg-blue-700 text-white px-10 disabled:opacity-50">
              {isSavingEdit ? <Loader2 size={16} className="animate-spin" /> : "Simpan Perubahan"}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
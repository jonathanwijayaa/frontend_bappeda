import React from "react";
import { X } from "lucide-react";
import AutocompleteInput from "../../components/ui/AutocompleteInput";
import Select from "../../components/ui/Select";
import type { Assignment } from "../../types/relawan.types";
import type { AutoOption } from "../../types/common.types";

interface AssignmentFormFieldsProps {
  assignment: Assignment;
  index: number;
  isReadOnly: boolean;
  isOPD: boolean;
  userOpdName?: string;
  opdOptions: AutoOption[];
  kaderOptions: AutoOption[];
  isKaderLoading: boolean;
  context?: "detail" | "form";
  onFieldChange: (index: number, field: string, value: string) => void;
  onOpdChange?: (index: number, val: string) => void;
  onKaderChange?: (index: number, val: string) => void;
  onRemove?: (index: number) => void;
}

const PERAN_OPTIONS = [
  { label: "-- Pilih Jabatan --", value: "" },
  { label: "Ketua", value: "Ketua" },
  { label: "Wakil", value: "Wakil" },
  { label: "Sekretaris", value: "Sekretaris" },
  { label: "Bendahara", value: "Bendahara" },
  { label: "Seksi", value: "Seksi" },
  { label: "Anggota", value: "Anggota" },
  { label: "Lainnya", value: "Lainnya" },
];

export const AssignmentFormFields: React.FC<AssignmentFormFieldsProps> = ({
  assignment,
  index,
  isReadOnly,
  isOPD,
  userOpdName,
  opdOptions,
  kaderOptions,
  isKaderLoading,
  context = "form",
  onFieldChange,
  onOpdChange,
  onKaderChange,
  onRemove,
}) => {
  const hasOpdSelected = isOPD || Number(assignment.opd_id || 0) > 0 || assignment.opd !== "";
  const currentStatusKeaktifan = assignment.status_keaktifan === "Aktif" ? "Aktif" : "Tidak Aktif";

  return (
    <div className="relative bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4 space-y-4">
      {!isReadOnly && onRemove && (
        <div className="flex justify-end -mt-2 -mr-2 mb-2">
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
            title="Hapus Penugasan"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* OPD */}
      <div className="grid grid-cols-3 gap-4 items-start">
        <label className="text-lg font-medium text-gray-900 pt-2">OPD</label>
        <div className="col-span-2">
          {isOPD ? (
            <input
              type="text"
              disabled
              value={assignment.opd || userOpdName || "Instansi Anda"}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 italic cursor-not-allowed"
            />
          ) : (
            <AutocompleteInput
              name={`opd-${index}`}
              value={assignment.opd}
              options={opdOptions}
              onChange={(val) => {
                onFieldChange(index, "opd", val);
                if (onOpdChange) onOpdChange(index, val);
              }}
              placeholder="Cari nama OPD..."
              disabled={isReadOnly}
            />
          )}
          {!isReadOnly && !isOPD && Number(assignment.opd_id || 0) > 0 && (
            <p className="mt-1 text-xs text-green-600 font-medium">OPD ditemukan</p>
          )}
        </div>
      </div>

      {/* Kader */}
      <div className="grid grid-cols-3 gap-4 items-start">
        <label className="text-lg font-medium text-gray-900 pt-2">Kader</label>
        <div className="col-span-2">
          {context === "form" ? (
            <>
              <AutocompleteInput
                name={`kader-${index}`}
                value={assignment.kader}
                options={kaderOptions}
                onChange={(val) => {
                  onFieldChange(index, "kader", val);
                  if (onKaderChange) onKaderChange(index, val);
                }}
                placeholder={
                  !hasOpdSelected
                    ? "Pilih OPD terlebih dahulu..."
                    : isKaderLoading
                    ? "Memuat kader..."
                    : kaderOptions.length === 0
                    ? "Tidak ada kader di OPD ini"
                    : "Cari nama Kader..."
                }
                disabled={isReadOnly || !hasOpdSelected || isKaderLoading}
                warnIfNotFound={false}
              />
              {!isReadOnly && hasOpdSelected && !isKaderLoading && kaderOptions.length > 0 && (
                <p className="mt-1 text-xs text-blue-500">
                  {kaderOptions.length} kader tersedia di OPD ini
                </p>
              )}
            </>
          ) : (
            <AutocompleteInput
              name={`kader-${index}`}
              value={assignment.kader}
              options={assignment.kader ? [{ label: assignment.kader, value: assignment.kader }] : []}
              onChange={() => {}}
              placeholder="Kader"
              disabled={true}
            />
          )}
        </div>
      </div>

      {/* Peran / Jabatan */}
      <div className="grid grid-cols-3 gap-4 items-center">
        <label className="text-lg font-medium text-gray-900">Peran/Jabatan</label>
        <div className="col-span-2">
          <Select
            name={`peran-${index}`}
            value={assignment.peran}
            onChange={(e) => onFieldChange(index, "peran", e.target.value)}
            options={PERAN_OPTIONS}
            disabled={isReadOnly}
          />
        </div>
      </div>

      {/* Detail Jabatan */}
      <div className="grid grid-cols-3 gap-4 items-center">
        <label className="text-lg font-medium text-gray-900">Detail Jabatan</label>
        <input
          type="text"
          value={assignment.detail}
          onChange={(e) => onFieldChange(index, "detail", e.target.value)}
          placeholder="Detail jabatan (contoh: Anggota Umum Bidang X)"
          disabled={isReadOnly}
          required
          className="col-span-2 px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:text-gray-500"
        />
      </div>

      {/* Penugasan */}
      <div className="grid grid-cols-3 gap-4 items-center">
        <label className="text-lg font-medium text-gray-900">Penugasan</label>
        <input
          type="text"
          value={assignment.penugasan || ""}
          onChange={(e) => onFieldChange(index, "penugasan", e.target.value)}
          placeholder="Nama/detail penugasan"
          disabled={isReadOnly}
          required
          className="col-span-2 px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:text-gray-500"
        />
      </div>

      {/* Status Keaktifan */}
      <div className="grid grid-cols-3 gap-4 items-center mt-2">
        <label className="text-lg font-medium text-gray-900">Status Keaktifan</label>
        <div className="col-span-2 flex items-center gap-6">
          {(["Aktif", "Tidak Aktif"] as const).map((st) => (
            <label key={st} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`status_keaktifan-${index}`}
                value={st}
                checked={currentStatusKeaktifan === st}
                onChange={(e) => onFieldChange(index, "status_keaktifan", e.target.value)}
                disabled={isReadOnly}
                className="w-4 h-4 text-blue-600 border-gray-400 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-gray-700">{st === "Aktif" ? "Aktif" : "Nonaktif"}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
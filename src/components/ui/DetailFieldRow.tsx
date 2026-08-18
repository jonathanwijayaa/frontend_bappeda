/**
 * components/ui/DetailFieldRow.tsx
 * Komponen reusable untuk menampilkan baris label-value di modal detail.
 * Menggantikan fungsi renderFieldRow() inline di HistoriRelawan, DataRelawan, dll.
 */
import React from "react";

interface DetailFieldRowProps {
  label: string;
  value: string | number | undefined | null;
}

const DetailFieldRow: React.FC<DetailFieldRowProps> = ({ label, value }) => (
  <div className="grid grid-cols-3 gap-4 items-start py-2 border-b border-gray-100 last:border-b-0">
    <span className="text-sm font-medium text-gray-500">{label}</span>
    <span className="col-span-2 text-sm text-gray-900 font-medium break-words">
      {value || "-"}
    </span>
  </div>
);

export default DetailFieldRow;

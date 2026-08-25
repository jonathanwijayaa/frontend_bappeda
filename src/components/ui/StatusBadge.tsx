/**
 * components/ui/StatusBadge.tsx
 * Komponen reusable untuk badge status.
 * Menggantikan inline badge styling yang tersebar di 5+ halaman.
 *
 * Styling 100% identik dengan yang sudah ada di masing-masing halaman.
 */
import React from "react";

type StatusValue =
  | "Aktif"
  | "Tidak Aktif"
  | "Menunggu Review"
  | "Menunggu"
  | "Selesai"
  | "Diterima"
  | "Disetujui"
  | "Ditolak";

interface StatusConfig {
  bg: string;
  text: string;
  dot?: string;
}

const STATUS_MAP: Record<StatusValue, StatusConfig> = {
  Aktif: { bg: "bg-green-50", text: "text-green-700" },
  "Tidak Aktif": { bg: "bg-red-50", text: "text-red-600" },
  "Menunggu Review": { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-400" },
  Menunggu: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-400" },
  Selesai: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  Diterima: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  Disetujui: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  Ditolak: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
};

const DEFAULT_CONFIG: StatusConfig = { bg: "bg-gray-50", text: "text-gray-600" };

interface StatusBadgeProps {
  status: string;
  /** Render sebagai pill badge (default) atau dot-label */
  variant?: "badge" | "dot";
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = "badge",
  className = "",
}) => {
  const cfg = STATUS_MAP[status as StatusValue] || DEFAULT_CONFIG;

  if (variant === "dot") {
    return (
      <span className={`flex items-center gap-1.5 text-sm font-medium ${cfg.text} ${className}`}>
        <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot || cfg.bg}`} />
        {status}
      </span>
    );
  }

  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${cfg.bg} ${cfg.text} ${className}`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;

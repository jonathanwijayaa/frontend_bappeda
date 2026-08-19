import React from "react";
import { Loader2, UserCheck } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { SearchInput } from "../../components/ui/Input";
import Table from "../../components/ui/Table";
import Pagination from "../../components/ui/Pagination";
import type { PengajuanAPIData, PengajuanData } from "../../types/relawan.types";
import Select from "../../components/ui/Select";

interface PengajuanTableSectionProps {
  pengajuanTab: "pending" | "history";
  setPengajuanTab: (tab: "pending" | "history") => void;
  pendingCount: number;
  historyStatusFilter: string;
  setHistoryStatusFilter: (val: string) => void;
  searchPengajuan: string;
  setSearchPengajuan: (val: string) => void;
  isLoading: boolean;
  pengajuanUIData: PengajuanData[];
  currentPengajuanData: PengajuanData[];
  currentPage: number;
  setCurrentPage: (p: number) => void;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  onOpenReview: (pengajuan: PengajuanAPIData) => void;
}

const statusOptions = [
{ label: "Semua Status", value: "ALL" },
{ label: "Disetujui", value: "DISETUJUI" },
{ label: "Ditolak", value: "DITOLAK" },
];

export const PengajuanTableSection: React.FC<PengajuanTableSectionProps> = ({
  pengajuanTab,
  setPengajuanTab,
  pendingCount,
  historyStatusFilter,
  setHistoryStatusFilter,
  searchPengajuan,
  setSearchPengajuan,
  isLoading,
  pengajuanUIData,
  currentPengajuanData,
  currentPage,
  setCurrentPage,
  totalPages,
  startIndex,
  endIndex,
  onOpenReview,
}) => {
  const pengajuanColumns = [
    { accessor: "nik" as const, header: "NIK", width: "15%" },
    { accessor: "namaLengkap" as const, header: "NAMA LENGKAP", width: "20%" },
    { accessor: "tanggalPengajuan" as const, header: "TANGGAL PENGAJUAN", width: "18%" },
    {
      header: "STATUS",
      width: "18%",
      render: (row: PengajuanData) => {
        const isDisetujui = row.status_pengajuan === "Disetujui" || row.status_pengajuan === "Diterima";
        const isDitolak = row.status_pengajuan === "Ditolak";
        const colorClass = isDisetujui ? "bg-green-500" : isDitolak ? "bg-red-500" : "bg-yellow-400";
        return (
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 ${colorClass} rounded-full`}></span>
            <span className="font-medium text-xs text-gray-800">{row.status_pengajuan}</span>
          </div>
        );
      },
    },
    {
      header: "DIVERIFIKASI OLEH",
      width: "20%",
      render: (row: PengajuanData) => (
        <span className="text-xs text-gray-700 font-medium">
          {row.verifikator !== "-" ? (
            <span className="flex items-center gap-1.5 text-gray-800">
              <UserCheck size={14} className="text-blue-600 shrink-0" />
              {row.verifikator}
            </span>
          ) : (
            <span className="text-gray-400 italic font-normal">Belum diproses</span>
          )}
        </span>
      ),
    },
  ];

  const pengajuanActions = (row: PengajuanData) => {
    const isPending = row.status_pengajuan === "Menunggu Review";
    return (
      <Button
        variant={isPending ? "primary" : "secondary"}
        size="sm"
        onClick={() => onOpenReview(row._raw as PengajuanAPIData)}
        className={isPending ? "bg-blue-600 hover:bg-blue-700 text-white font-medium" : ""}
      >
        {isPending ? "Review" : "Detail"}
      </Button>
    );
  };

  return (
    <Card>
      <div className="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold text-gray-900">Pengajuan Perubahan Data</h2>
          <div className="flex p-1 bg-gray-100 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setPengajuanTab("pending");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                pengajuanTab === "pending"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Perlu Review
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full text-[10px]">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setPengajuanTab("history");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-md transition-all ${
                pengajuanTab === "history"
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Riwayat Selesai
            </button>
          </div>
        </div>

            <div className="flex flex-wrap items-center gap-3 self-end lg:self-auto">
            {pengajuanTab === "history" && (
                <div className="w-48">
                <Select
                    value={historyStatusFilter}
                    onChange={(e) => {
                    setHistoryStatusFilter(e.target.value);
                    setCurrentPage(1);
                    }}
                    options={statusOptions}
                    className="text-xs"
                />
                </div>
            )}
            <SearchInput
                value={searchPengajuan}
                onChange={(e) => {
                setSearchPengajuan(e.target.value);
                setCurrentPage(1);
                }}
                placeholder="Cari NIK, nama, verifikator..."
                className="w-64"
            />
            </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-36">
          <Loader2 size={24} className="animate-spin text-gray-400" />
          <span className="ml-3 text-gray-500 text-sm">Memuat data pengajuan...</span>
        </div>
      ) : pengajuanUIData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-gray-600 font-medium">
            {pengajuanTab === "pending" ? "Tidak ada pengajuan yang perlu direview" : "Tidak ada riwayat pengajuan"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {pengajuanTab === "pending" ? "Semua pengajuan perubahan data telah selesai diproses." : "Belum ada riwayat pengajuan yang tercatat."}
          </p>
        </div>
      ) : (
        <>
          <Table columns={pengajuanColumns} data={currentPengajuanData} actions={pengajuanActions} minRows={5} />
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Menampilkan {startIndex + 1}-{Math.min(endIndex, pengajuanUIData.length)} dari {pengajuanUIData.length} Pengajuan
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        </>
      )}
    </Card>
  );
};
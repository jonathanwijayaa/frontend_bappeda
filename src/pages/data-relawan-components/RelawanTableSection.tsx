import React from "react";
import { Loader2, FileDown } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { SearchInput } from "../../components/ui/Input";
import Table, { Column } from "../../components/ui/Table";
import Pagination from "../../components/ui/Pagination";
import type { RelawanData } from "../../types/relawan.types";

interface RelawanTableSectionProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  isLoading: boolean;
  filteredRelawanData: RelawanData[];
  currentRelawanData: RelawanData[];
  currentPage: number;
  setCurrentPage: (p: number) => void;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  sortColumn: "namaLengkap" | "nik" | null;
  sortOrder: "asc" | "desc" | null;
  onSort: (col: string) => void;
  onExportPdf: () => void;
  onOpenDetail: (relawan: RelawanData) => void;
}

export const RelawanTableSection: React.FC<RelawanTableSectionProps> = ({
  searchTerm,
  setSearchTerm,
  isLoading,
  filteredRelawanData,
  currentRelawanData,
  currentPage,
  setCurrentPage,
  totalPages,
  startIndex,
  endIndex,
  sortColumn,
  sortOrder,
  onSort,
  onExportPdf,
  onOpenDetail,
}) => {
  const relawanColumns: Column<RelawanData>[] = [
    {
      header: "NIK",
      accessor: "nik",
      width: "18%",
      sortable: true,
      render: (row) => <span className="font-mono tracking-tight whitespace-nowrap font-medium text-gray-900">{row.nik}</span>,
    },
    {
      header: "NAMA",
      accessor: "namaLengkap",
      width: "20%",
      sortable: true,
      render: (row) => <span className="font-medium text-gray-900 line-clamp-2 break-words" title={row.namaLengkap}>{row.namaLengkap}</span>,
    },
    {
      header: "ALAMAT",
      accessor: "alamat",
      width: "26%",
      render: (row) => <span className="line-clamp-3 break-words text-gray-600" title={row.alamat}>{row.alamat || "-"}</span>,
    },
    {
      header: "KEMANTREN",
      accessor: "kemantren",
      width: "13%",
      render: (row) => <span className="line-clamp-2 break-words">{row.kemantren || "-"}</span>,
    },
    {
      header: "KELURAHAN",
      accessor: "kelurahan",
      width: "13%",
      render: (row) => <span className="line-clamp-2 break-words">{row.kelurahan || "-"}</span>,
    },
  ];

  return (
    <Card>
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-900">Daftar Relawan</h2>
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <SearchInput
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari relawan..."
            className="w-64"
          />
          {!isLoading && filteredRelawanData.length > 0 && (
            <Button variant="secondary" size="sm" onClick={onExportPdf} className="flex items-center gap-2">
              <FileDown size={16} /> Ekspor PDF
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 size={28} className="animate-spin text-gray-400" />
          <span className="ml-3 text-gray-500">Memuat data relawan...</span>
        </div>
      ) : filteredRelawanData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-gray-600 font-medium">Belum ada relawan</p>
          <p className="text-sm text-gray-400 mt-1">Tidak ada relawan yang cocok dengan kriteria.</p>
        </div>
      ) : (
        <Table
          columns={relawanColumns}
          data={currentRelawanData}
          actions={(row: RelawanData) => (
            <Button variant="secondary" size="sm" onClick={() => onOpenDetail(row)}>Detail</Button>
          )}
          minRows={5}
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={onSort}
        />
      )}

      {!isLoading && filteredRelawanData.length > 0 && (
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredRelawanData.length)} dari {filteredRelawanData.length} Relawan
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}
    </Card>
  );
};
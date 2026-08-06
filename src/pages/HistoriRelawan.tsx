import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Loader2, History, Search } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Table from "../components/ui/Table";
import Modal from "../components/ui/Modal";
import Select from "../components/ui/Select";
import YearPicker from "../components/ui/YearPicker";
import Pagination from "../components/ui/Pagination";
import apiClient from "../lib/axios";
import { useAuth } from "../context/AuthContext";
import type { HistoriRelawanData } from "../types/histori.types";
import type { AutoOption } from "../types/common.types";
import { formatPhoneDisplay } from "../utils/formatPhone";
import type { ToastType } from "../components/ui/Toast";
import Toast from "../components/ui/Toast";
import { useWilayah } from "../hooks/useWilayah";

// ── Tipe untuk baris mentah dari API ─
interface RawRelawanRow {
  alamat_ktp?: string;
  batas_aktif?: string;
  detail_jabatan?: string;
  jabatan?: string;
  jenis_kelamin?: string;
  kader_id?: number | null;
  kelurahan?: string;
  kemantren?: string;
  nama_kader?: string;
  nama_lengkap: string;
  nama_opd?: string;
  nik: string;
  no_hp?: string;
  nomor_sk?: string;
  opd_id?: number;
  penugasan?: string;
  penugasan_id?: number;
  relawan_id?: number;
  status_penugasan?: string;
  tahun?: number | string;
  tanggal_terbit?: string;
  user_id?: number;
}

interface OpdItem {
  nama_opd: string;
}

// ── Helper: kelompokkan baris flat dari API menjadi per-relawan ─
const groupRelawanData = (rows: RawRelawanRow[]): HistoriRelawanData[] => {
  const map = new Map<string, HistoriRelawanData>();
  rows.forEach((row) => {
    if (!map.has(row.nik)) {
      map.set(row.nik, {
        alamat: row.alamat_ktp || "-",
        assignments: [],
        jabatan: row.jabatan || "-",
        jenisKelamin: row.jenis_kelamin || "L",
        kader: row.nama_kader || "-",
        kelurahan: row.kelurahan || "-",
        kemantren: row.kemantren || "-",
        namaLengkap: row.nama_lengkap,
        nik: row.nik,
        no_hp: row.no_hp || "-",
        penugasan: row.nama_opd || row.penugasan || "-",
        relawan_id: row.relawan_id,
        user_id: row.user_id,
      });
    }
    if (row.nama_opd || row.penugasan || row.nama_kader) {
      map.get(row.nik)!.assignments.push({
        batasAktif: row.batas_aktif || "",
        detail: row.detail_jabatan || "",
        id: row.penugasan_id?.toString() || Math.random().toString(),
        kader: row.nama_kader || "",
        kader_id: row.kader_id || null,
        nomorSK: row.nomor_sk || "",
        opd: row.nama_opd || "",
        opd_id: row.opd_id || 0,
        penugasan: row.penugasan || "",
        peran: row.jabatan || "",
        status_keaktifan: row.status_penugasan || "Aktif",
        tahun: row.tahun || "",
        tahunMulai: row.tanggal_terbit ? new Date(row.tanggal_terbit).getFullYear() : null,
        tahunSelesai: row.batas_aktif ? new Date(row.batas_aktif).getFullYear() : null,
        tanggalTerbit: row.tanggal_terbit || "",
      });
    }
  });
  return Array.from(map.values());
};

// ── Interface Raw Kader dari API ──
interface RawKader {
  kader_id: number;
  nama_kader: string;
  nama_opd?: string;
  opd_id?: number;
}

// ── Component ────────────────────────────────────────────────────
const HistoriRelawan: React.FC = () => {
  const { isOPD, isSuperAdmin } = useAuth();
  const API_BASE = isSuperAdmin ? "/admin/relawan" : "/opd-admin/relawan";

  const [relawanList, setRelawanList] = useState<HistoriRelawanData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Custom Hook Wilayah
  const { fetchKelurahanByKemantrenId, kelurahanList, kemantrenList, setKelurahanList } =
    useWilayah();

  // ── Filter state ──────────────────────────────────────────────
  const [filterOpd, setFilterOpd] = useState<string>("");
  const [filterKader, setFilterKader] = useState<string>("");
  const [filterKemantren, setFilterKemantren] = useState<string>("");
  const [filterKelurahan, setFilterKelurahan] = useState<string>("");
  const [filterTahunAwal, setFilterTahunAwal] = useState<string>("");
  const [filterTahunAkhir, setFilterTahunAkhir] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // ── Dropdown options & raw state ──────────────────────────────
  const [opdOptions, setOpdOptions] = useState<AutoOption[]>([]);
  const [rawKaderList, setRawKaderList] = useState<RawKader[]>([]);

  // ── Transform Options Kemantren & Kelurahan ───────────────────
  const kemantrenOptions = useMemo<AutoOption[]>(
    () => kemantrenList.map((item) => ({ label: item.nama_kemantren, value: item.nama_kemantren })),
    [kemantrenList],
  );

  const kelurahanOptions = useMemo<AutoOption[]>(
    () => kelurahanList.map((item) => ({ label: item.nama_kelurahan, value: item.nama_kelurahan })),
    [kelurahanList],
  );

  // ── Filter Opsi Kader Berdasarkan OPD yang Dipilih ────────────
  const kaderOptions = useMemo<AutoOption[]>(() => {
    let list = rawKaderList;

    // Jika OPD dipilih, saring kader yang terikat/mempunyai relasi dengan OPD tersebut
    if (filterOpd) {
      list = rawKaderList.filter((k) => k.nama_opd?.toLowerCase() === filterOpd.toLowerCase());
    }

    // Ambil nama kader yang unik
    const uniqueNames = Array.from(new Set(list.map((k) => k.nama_kader).filter(Boolean)));
    return uniqueNames.map((nama) => ({ label: nama, value: nama }));
  }, [rawKaderList, filterOpd]);

  // ── Pagination ────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  // ── Detail modal ──────────────────────────────────────────────
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRelawan, setSelectedRelawan] = useState<HistoriRelawanData | null>(null);

  // ── Tahun range ───────────────────────────────────────────────
  const currentYear = new Date().getFullYear();
  const maxYearAkhir = currentYear + 10;
  const minYearGlobal = 2000;
  const minYearAkhir = filterTahunAwal ? Number(filterTahunAwal) : minYearGlobal;

  // ── Fetch data relawan ────────────────────────────────────────
  const fetchRelawan = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: result } = await apiClient.get(API_BASE);
      if (result.success) {
        setRelawanList(groupRelawanData(result.data));
      } else {
        setToast({ message: result.message || "Gagal memuat data histori", type: "error" });
      }
    } catch {
      setToast({ message: "Tidak dapat terhubung ke server", type: "error" });
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE]);

  // ── Fetch OPD & Raw Kader Data ────────────────────────────────
  useEffect(() => {
    fetchRelawan();

    // Fetch OPD
    apiClient
      .get("/opd")
      .then((r) => r.data)
      .then((result) => {
        if (result.success) {
          setOpdOptions(
            result.data.map((o: OpdItem) => ({ label: o.nama_opd, value: o.nama_opd })),
          );
        }
      })
      .catch(() => undefined);

    // Fetch Master Data Kader lengkap dengan relasi OPD
    const kaderEndpoint = isOPD ? "/opd-admin/kader" : "/kader";
    apiClient
      .get(kaderEndpoint)
      .then((r) => r.data)
      .then((result) => {
        if (result.success) {
          setRawKaderList(result.data);
        }
      })
      .catch(() => undefined);
  }, [fetchRelawan, isOPD]);

  // ── Fetch Kelurahan berdasarkan Kemantren ─────────────────────
  useEffect(() => {
    const matchedKemantren = kemantrenList.find(
      (item) => item.nama_kemantren.toLowerCase() === filterKemantren.trim().toLowerCase(),
    );

    if (matchedKemantren) {
      fetchKelurahanByKemantrenId(matchedKemantren.id);
    } else {
      setKelurahanList([]);
      setFilterKelurahan("");
    }
  }, [filterKemantren, kemantrenList, fetchKelurahanByKemantrenId, setKelurahanList]);

  // ── Reset Pilihan Kader Jika Kader Tidak Ada di OPD Baru ─────
  const handleOpdChange = (opdValue: string) => {
    setFilterOpd(opdValue);

    if (opdValue && filterKader) {
      // Cek apakah kader yang sedang dipilih terdaftar di OPD baru
      const isValidForNewOpd = rawKaderList.some(
        (k) =>
          k.nama_opd?.toLowerCase() === opdValue.toLowerCase() &&
          k.nama_kader.toLowerCase() === filterKader.toLowerCase(),
      );

      // Jika kader tidak terdaftar pada OPD tersebut, reset pilihan kader
      if (!isValidForNewOpd) {
        setFilterKader("");
      }
    }
    setCurrentPage(1);
  };

  // ── Filtering ─────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return relawanList.filter((relawan) => {
      const matchSearch =
        !q ||
        relawan.namaLengkap.toLowerCase().includes(q) ||
        relawan.nik.toLowerCase().includes(q);

      const matchOpd =
        !filterOpd ||
        relawan.assignments.some((a) => a.opd.toLowerCase() === filterOpd.toLowerCase());

      const matchKader =
        !filterKader ||
        relawan.assignments.some((a) => a.kader.toLowerCase() === filterKader.toLowerCase());

      const matchKemantren =
        !filterKemantren ||
        (relawan.kemantren && relawan.kemantren.toLowerCase() === filterKemantren.toLowerCase());

      const matchKelurahan =
        !filterKelurahan ||
        (relawan.kelurahan && relawan.kelurahan.toLowerCase() === filterKelurahan.toLowerCase());

      const matchTahun = (() => {
        if (!filterTahunAwal && !filterTahunAkhir) return true;
        return relawan.assignments.some((a) => {
          if (!a.tahunMulai && !a.tahunSelesai) return false;

          const awal = filterTahunAwal ? Number(filterTahunAwal) : 0;
          const akhir = filterTahunAkhir ? Number(filterTahunAkhir) : 9999;

          const skAwal = a.tahunMulai || 0;
          const skAkhir = a.tahunSelesai || 9999;

          return skAkhir >= awal && skAwal <= akhir;
        });
      })();

      return (
        matchSearch && matchOpd && matchKader && matchKemantren && matchKelurahan && matchTahun
      );
    });
  }, [
    relawanList,
    searchTerm,
    filterOpd,
    filterKader,
    filterKemantren,
    filterKelurahan,
    filterTahunAwal,
    filterTahunAkhir,
  ]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // ── Handlers ──────────────────────────────────────────────────
  const handleYearAwalChange = (year: string) => {
    setFilterTahunAwal(year);
    if (year && filterTahunAkhir && Number(filterTahunAkhir) < Number(year)) {
      setFilterTahunAkhir("");
    }
    setCurrentPage(1);
  };

  const handleYearAkhirChange = (year: string) => {
    setFilterTahunAkhir(year);
    setCurrentPage(1);
  };

  const handleResetFilter = () => {
    setFilterOpd("");
    setFilterKader("");
    setFilterKemantren("");
    setFilterKelurahan("");
    setFilterTahunAwal("");
    setFilterTahunAkhir("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleDetailClick = (relawan: HistoriRelawanData) => {
    setSelectedRelawan(relawan);
    setIsDetailModalOpen(true);
  };

  // ── Table Columns ─────────────────────────────────────────────
  const columns = [

    { accessor: "nik" as keyof HistoriRelawanData, header: "NIK", width: "20%" },
    { accessor: "namaLengkap" as keyof HistoriRelawanData, header: "NAMA", width: "16%" },
    { accessor: "alamat" as keyof HistoriRelawanData, header: "ALAMAT", width: "20%" },
    { accessor: "kelurahan" as keyof HistoriRelawanData, header: "KELURAHAN", width: "14%" },
    {
      header: "OPD",
      render: (row: HistoriRelawanData) => (
        <span className="text-sm text-gray-700">
          {row.assignments.length > 0
            ? [...new Set(row.assignments.map((a) => a.opd).filter(Boolean))].join(", ") || "-"
            : "-"}
        </span>
      ),
      width: "15%",
    },
    {
      header: "KADER",
      render: (row: HistoriRelawanData) => (
        <span className="text-sm text-gray-700">
          {row.assignments.length > 0
            ? [...new Set(row.assignments.map((a) => a.kader).filter(Boolean))].join(", ") || "-"
            : "-"}
        </span>
      ),
      width: "15%",
    },
  ];

  const rowActions = (row: HistoriRelawanData) => (
    <Button variant="secondary" size="sm" onClick={() => handleDetailClick(row)}>
      Detail
    </Button>
  );

  const renderFieldRow = (label: string, value: string | undefined) => (
    <div
      key={label}
      className="grid grid-cols-3 gap-4 items-start py-2 border-b border-gray-100 last:border-b-0"
    >
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <span className="col-span-2 text-sm text-gray-900 font-medium break-words">
        {value || "-"}
      </span>
    </div>
  );

  const isActiveFilter =
    filterOpd ||
    filterKader ||
    filterKemantren ||
    filterKelurahan ||
    filterTahunAwal ||
    filterTahunAkhir;

  return (
    <div className="space-y-6">
      {/* ── Filter Bar (Grid 3 x 2) ── */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <History size={18} className="text-green-600" />
            <h3 className="font-semibold text-gray-800 text-sm">Filter Riwayat</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Baris 1 - OPD */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nama OPD</label>
              <Select
                value={filterOpd}
                onChange={(e) => handleOpdChange(e.target.value)}
                placeholder="Semua OPD"
                options={opdOptions}
                disabled={!isSuperAdmin}
                className="w-full text-sm"
              />
            </div>

            {/* Baris 1 - Kemantren */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Kemantren</label>
              <Select
                value={filterKemantren}
                onChange={(e) => {
                  setFilterKemantren(e.target.value);
                  setFilterKelurahan("");
                  setCurrentPage(1);
                }}
                placeholder="Semua Kemantren"
                options={kemantrenOptions}
                className="w-full text-sm"
              />
            </div>

            {/* Baris 1 - Tahun Awal */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tahun Awal</label>
              <YearPicker
                value={filterTahunAwal}
                onChange={handleYearAwalChange}
                placeholder="Tahun Awal"
                minYear={minYearGlobal}
                maxYear={currentYear}
              />
            </div>

            {/* Baris 2 - Kader (Bisa dipilih langsung / menyesuaikan OPD) */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nama Kader</label>
              <Select
                value={filterKader}
                onChange={(e) => {
                  setFilterKader(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={
                  filterOpd
                    ? kaderOptions.length > 0
                      ? "Semua Kader di OPD ini"
                      : "Tidak ada kader di OPD ini"
                    : "Semua Kader"
                }
                options={kaderOptions}
                className="w-full text-sm"
              />
            </div>

            {/* Baris 2 - Kelurahan */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Kelurahan</label>
              <Select
                value={filterKelurahan}
                onChange={(e) => {
                  setFilterKelurahan(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={filterKemantren ? "Semua Kelurahan" : "Pilih Kemantren dulu"}
                options={kelurahanOptions}
                disabled={!filterKemantren}
                className="w-full text-sm"
              />
            </div>

            {/* Baris 2 - Tahun Akhir */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tahun Akhir</label>
              <YearPicker
                value={filterTahunAkhir}
                onChange={handleYearAkhirChange}
                placeholder="Tahun Akhir"
                minYear={minYearAkhir}
                maxYear={maxYearAkhir}
              />
            </div>
          </div>

          {/* Reset Filter Button */}
          {isActiveFilter && (
            <div className="flex justify-end pt-1">
              <Button
                onClick={handleResetFilter}
                className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                variant="danger"
              >
                ✕ Reset Filter
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* ── Search Bar ── */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Cari nama atau NIK relawan..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white shadow-sm"
        />
      </div>

      {/* ── Tabel ── */}
      <Card title="Tabel Riwayat Data Relawan">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 size={28} className="animate-spin text-gray-400" />
            <span className="ml-3 text-gray-500">Memuat riwayat data relawan...</span>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <History size={40} className="text-gray-300 mb-3" />
            <p className="text-gray-600 font-medium">Tidak ada data riwayat</p>
            <p className="text-sm text-gray-400 mt-1">
              {isActiveFilter
                ? "Tidak ada relawan yang cocok dengan filter yang dipilih."
                : "Belum ada riwayat data relawan yang tercatat."}
            </p>
          </div>
        ) : (
          <Table columns={columns} data={currentData} actions={rowActions} minRows={5} />
        )}

        {!isLoading && filteredData.length > 0 && (
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Menampilkan {startIndex + 1}–
              {Math.min(startIndex + itemsPerPage, filteredData.length)} dari {filteredData.length}{" "}
              relawan
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </Card>

      {/* ── Detail Modal ── */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedRelawan(null);
        }}
        title="Detail Riwayat Relawan"
        subtitle="Informasi lengkap data relawan (hanya baca)"
        maxWidth="2xl"
      >
        {selectedRelawan && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                Informasi Pribadi
              </h3>
              <div className="space-y-1">
                {renderFieldRow("Nama Relawan", selectedRelawan.namaLengkap)}
                {renderFieldRow("NIK", selectedRelawan.nik)}
                {renderFieldRow(
                  "Jenis Kelamin",
                  selectedRelawan.jenisKelamin === "L" ? "Laki-laki (L)" : "Perempuan (P)",
                )}
                {renderFieldRow("Alamat KTP", selectedRelawan.alamat)}
                {renderFieldRow("No. HP", formatPhoneDisplay(selectedRelawan.no_hp))}
                {renderFieldRow("Kemantren", selectedRelawan.kemantren)}
                {renderFieldRow("Kelurahan", selectedRelawan.kelurahan)}
              </div>
            </div>

            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                Daftar Penugasan
              </h3>
              {Array.isArray(selectedRelawan.assignments) &&
              selectedRelawan.assignments.length > 0 ? (
                <div className="space-y-4">
                  {selectedRelawan.assignments.map((assignment, index) => (
                    <div
                      key={assignment.id}
                      className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                          Penugasan #{index + 1}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            assignment.status_keaktifan === "Aktif"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {assignment.status_keaktifan}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {renderFieldRow("OPD", assignment.opd)}
                        {renderFieldRow("Kader", assignment.kader)}
                        {renderFieldRow("Peran / Jabatan", assignment.peran)}
                        {renderFieldRow("Detail Jabatan", assignment.detail)}
                        {renderFieldRow("Penugasan", assignment.penugasan)}
                        {assignment.tahun
                          ? renderFieldRow("Tahun", String(assignment.tahun))
                          : null}
                        {assignment.nomorSK ? renderFieldRow("Nomor SK", assignment.nomorSK) : null}
                        {assignment.nomorSK
                          ? renderFieldRow(
                              "Tanggal Terbit",
                              assignment.tanggalTerbit
                                ? new Date(assignment.tanggalTerbit).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  })
                                : "-",
                            )
                          : null}
                        {assignment.nomorSK
                          ? renderFieldRow(
                              "Batas Aktif",
                              assignment.batasAktif
                                ? new Date(assignment.batasAktif).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  })
                                : "-",
                            )
                          : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 italic py-4 text-sm">
                  Belum ada data penugasan terdaftar.
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default HistoriRelawan;

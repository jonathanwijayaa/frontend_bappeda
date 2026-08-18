//Dashboard.tsx
import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";
import BarChart from "../components/charts/BarChart";
import DonutChart from "../components/charts/DonutChart";
import Select from "../components/ui/Select";
import HorizontalBarChart from "../components/charts/HorizontalBarChart";
import type { ChartDataItem,DashboardData,TopRelawanItem } from "../types/dashboard.types";
import {useStatistikGender, useStatistikKelurahan, useStatistikRelawanPerKader, useStatistikKaderPerOpd, } from "../hooks/statistik/useStatistik";
import apiClient from "../lib/axios";
import {
  Clock,
  Users,
  UserCheck,
  Building2,
  FileClock,
  Trophy,
  Medal,
  Award,
  Loader2,
} from "lucide-react";


const Dashboard: React.FC = () => {
  const { isOPD, isSuperAdmin, user } = useAuth();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [topRelawanList, setTopRelawanList] = useState<TopRelawanItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [timestamp, setTimestamp] = useState<string>("");
  const [showAllChart, setShowAllChart] = useState(false);

  const { data: gender = [], isLoading: l1 } = useStatistikGender();
  const { data: kelurahan = [], isLoading: l2 } = useStatistikKelurahan();
  const { data: relawanPerKader = [], isLoading: l3 } = useStatistikRelawanPerKader();
  const { data: kaderPerOpd = [], isLoading: l4 } = useStatistikKaderPerOpd();

  useEffect(() => {
    const fetchDashboard = async (url: string) => {
      try {
        setIsLoading(true);
        setError("");
        const { data: result } = await apiClient.get(url);

        if (result.success && result.data) {
          setDashboardData(result.data);

          // Top Relawan: langsung dari payload dashboard
          if (Array.isArray(result.data.top_relawan)) {
            setTopRelawanList(result.data.top_relawan);
          }

          const now = new Date();
          const formattedDate = now.toLocaleDateString("id-ID", {
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            month: "long",
            weekday: "long",
            year: "numeric",
          });
          setTimestamp(`${formattedDate} WIB`);
        } else {
          setError(result.message || "Gagal memuat data dashboard");
          setDashboardData(null);
        }
      } catch (err: unknown) {
        console.error("Dashboard fetch error:", err);
        setError(err instanceof Error ? err.message : "Tidak dapat terhubung ke server.");
        setDashboardData(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (isSuperAdmin) {
      fetchDashboard("/admin/dashboard");
    } else if (isOPD) {
      fetchDashboard("/opd-admin/dashboard");
    }
  }, [isSuperAdmin, isOPD]);

  // Master Data Bar Chart
  const rawChartData: ChartDataItem[] = useMemo(() => {
    if (
      !dashboardData?.grafik_relawan_per_opd ||
      !Array.isArray(dashboardData.grafik_relawan_per_opd)
    ) {
      return [];
    }
    return dashboardData.grafik_relawan_per_opd.map((item) => ({
      jumlah: item.jumlah_relawan || 0,
      name: item.nama_opd,
    }));
  }, [dashboardData]);

  // Data Terpotong (Top 10 vs Semua Data)
  const visibleChartData = useMemo(() => {
    if (showAllChart || rawChartData.length <= 10) return rawChartData;
    return [...rawChartData].sort((a, b) => Number(b.jumlah) - Number(a.jumlah)).slice(0, 10);
  }, [rawChartData, showAllChart]);

  const labelPeriodeKumulatif = useMemo(() => {
    const tanggalAwal = new Date(2024, 5, 1);
    const bulanAwalTeks = tanggalAwal.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    const tanggalSekarang = new Date();
    const bulanSekarangTeks = tanggalSekarang.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    return `Semua Periode Data (${bulanAwalTeks} — ${bulanSekarangTeks})`;
  }, []);

  const isLoadingTotal = isLoading || l1 || l2 || l3 || l4;

  if (isLoadingTotal) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="text-gray-500 text-sm flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
          Memuat data dashboard & statistik...
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg text-sm">
          {error || "Data dashboard tidak tersedia"}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 font-medium"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Real-time Status Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 border-b border-gray-100 pb-2">
        <p className="text-xs italic text-gray-400">Data ditampilkan secara real-time</p>
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm w-fit">
          <Clock size={13} className="text-green-600 animate-pulse" />
          <span>Data per: {timestamp}</span>
        </div>
      </div>

      {/* ── BARIS 1: KPI Stat Cards ── */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${
            isSuperAdmin ? "lg:grid-cols-4" : "lg:grid-cols-3"
          }`}
        >
          {/* Card 1: Total Relawan */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Users size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Total Relawan Aktif</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">
                {dashboardData.ringkasan.total_relawan_aktif.toLocaleString("id-ID")}
              </p>
            </div>
          </div>

          {/* Card 2: Total Kader */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <UserCheck size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Total Kader</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">
                {dashboardData.ringkasan.total_kader.toLocaleString("id-ID")}
              </p>
            </div>
          </div>

          {/* Card 3: Total OPD (Hanya untuk Super Admin) */}
          {isSuperAdmin && (
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <Building2 size={22} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Total OPD Terdaftar</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">
                  {dashboardData.ringkasan.total_opd}
                </p>
              </div>
            </div>
          )}

          {/* Card 4: Pengajuan Pending */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div
              className={`p-3 rounded-xl ${
                dashboardData.ringkasan.pengajuan_pending > 0
                  ? "bg-amber-50 text-amber-600"
                  : "bg-gray-50 text-gray-400"
              }`}
            >
              <FileClock size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Pengajuan Pending</p>
              <p
                className={`text-2xl font-bold mt-0.5 ${
                  dashboardData.ringkasan.pengajuan_pending > 0
                    ? "text-amber-600"
                    : "text-gray-900"
                }`}
              >
                {dashboardData.ringkasan.pengajuan_pending}
              </p>
            </div>
          </div>
        </div>

      {/* ── BARIS 2: Visualisasi Utama & Demografi ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Main Bar Chart (Lebar 60%) */}
        <div className="lg:col-span-3">
          <Card
            title={
              <div className="flex items-center justify-between gap-4 w-full">
                {/* Sisi Kiri: Judul & Subtitle */}
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-gray-800 text-sm md:text-base">
                    {isSuperAdmin ? "Jumlah Relawan per OPD" : "Jumlah Relawan per Kader"}
                  </span>
                  <span className="text-xs font-normal text-gray-500">
                    {labelPeriodeKumulatif}
                  </span>
                </div>

                {/* Sisi Kanan: Dropdown Select Filter */}
                {rawChartData.length > 10 && (
                  <div className="w-40 shrink-0">
                    <Select
                      value={showAllChart ? "all" : "top10"}
                      onChange={(e) => setShowAllChart(e.target.value === "all")}
                      options={[
                        { label: "Top 10 Data", value: "top10" },
                        { label: `Semua Data (${rawChartData.length})`, value: "all" },
                      ]}
                      placeholder="Pilih tampilan..."
                    />
                  </div>
                )}
              </div>
            }
          >
            {visibleChartData.length > 0 ? (
              <BarChart data={visibleChartData} dataKey="jumlah" xAxisKey="name" height={320} />
            ) : (
              <div className="flex items-center justify-center h-72 text-gray-400 text-xs">
                Belum ada data grafik
              </div>
            )}
          </Card>
        </div>

        {/* Demografi Gender (Donut Chart Lebar 40%) */}
        <div className="lg:col-span-2">
          <Card title="Demografi Gender Relawan">
            <div className="flex items-center justify-center min-h-[320px]">
              {gender.length > 0 ? (
                <DonutChart data={gender} dataKey="value" nameKey="name" />
              ) : (
                <p className="text-xs text-gray-400">Data gender belum tersedia</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* ── BARIS 3: Leaderboard Top Relawan & Distribusi Wilayah ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Top 5 Relawan dengan Penugasan Terbanyak */}
        <div className="lg:col-span-3">
          <Card
            title={
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-amber-500" />
                <span className="font-semibold text-gray-800">Relawan dengan Penugasan Terbanyak</span>
              </div>
            }
          >
            {topRelawanList.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {topRelawanList.map((relawan, idx) => (
                  <div
                    key={relawan.relawan_id || idx}
                    className="py-3 flex items-center justify-between hover:bg-gray-50/70 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0">
                        {idx === 0 && (
                          <span className="bg-amber-100 text-amber-700 p-1.5 rounded-full">
                            <Trophy size={14} />
                          </span>
                        )}
                        {idx === 1 && (
                          <span className="bg-slate-200 text-slate-700 p-1.5 rounded-full">
                            <Medal size={14} />
                          </span>
                        )}
                        {idx === 2 && (
                          <span className="bg-orange-100 text-orange-700 p-1.5 rounded-full">
                            <Award size={14} />
                          </span>
                        )}
                        {idx > 2 && <span className="text-gray-500 font-semibold">#{idx + 1}</span>}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-800">{relawan.nama_lengkap}</p>
                        <p className="text-[11px] text-gray-400">{relawan.nama_opd || "OPD Relawan"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                        {relawan.total_penugasan} Penugasan
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-400 text-xs">
                Belum ada data penugasan relawan
              </div>
            )}
          </Card>
        </div>

        {/* Distribusi Relawan per Kelurahan */}
        <div className="lg:col-span-2">
          <Card title="Sebaran Relawan per Kelurahan">
            <div className="min-h-[280px]">
              {kelurahan.length > 0 ? (
                <HorizontalBarChart
                  data={kelurahan.slice(0, 7)}
                  dataKey="value"
                  xAxisKey="name"
                  color="#E76F51"
                />
              ) : (
                <div className="flex items-center justify-center h-48 text-gray-400 text-xs">
                  Data kelurahan belum tersedia
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* ── BARIS 4: Relawan per Kader & Kader per OPD ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          title={
            isOPD
              ? `Jumlah Relawan Per Kader (${user?.nama_opd ?? ""})`
              : "Jumlah Relawan Per Kader"
          }
        >
          <div className="min-h-[250px]">
            {relawanPerKader.length > 0 ? (
              <HorizontalBarChart
                data={relawanPerKader.slice(0, 8)}
                dataKey="value"
                xAxisKey="name"
              />
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-400 text-xs">
                Data relawan per kader belum tersedia
              </div>
            )}
          </div>
        </Card>

        {(isSuperAdmin || isOPD) && (
          <Card
            title={
              isOPD ? `Jumlah Kader (${user?.nama_opd ?? ""})` : "Jumlah Kader Per OPD"
            }
          >
            <div className="min-h-[250px]">
              {kaderPerOpd.length > 0 ? (
                <HorizontalBarChart
                  data={kaderPerOpd.slice(0, 8)}
                  dataKey="value"
                  xAxisKey="name"
                  color="#2A9D8F"
                />
              ) : (
                <div className="flex items-center justify-center h-48 text-gray-400 text-xs">
                  Data kader per OPD belum tersedia
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
// Statistik.tsx
import React from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";
import DonutChart from "../components/charts/DonutChart";
import HorizontalBarChart from "../components/charts/HorizontalBarChart";
import {
  useStatistikGender,
  useStatistikKelurahan,
  useStatistikRelawanPerKader,
  useStatistikKaderPerOpd,
} from "../hooks/statistik/useStatistik";

const Statistik: React.FC = () => {
  const { isSuperAdmin, user } = useAuth();
  const isOpd = user?.role === "opd";

  const { data: gender = [], isLoading: l1 } = useStatistikGender();
  const { data: kelurahan = [], isLoading: l2 } = useStatistikKelurahan();
  const { data: relawanPerKader = [], isLoading: l3 } = useStatistikRelawanPerKader();
  const { data: kaderPerOpd = [], isLoading: l4 } = useStatistikKaderPerOpd();

  const isLoading = l1 || l2 || l3 || l4;

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 size={28} className="animate-spin text-gray-400" />
        <span className="ml-3 text-gray-500">Memuat statistik...</span>
      </div>
    );

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      {/* Kolom Kiri */}
      <div className="flex flex-col gap-6 flex-1">
        <Card title="Demografi Gender" collapsible>
          <DonutChart data={gender} dataKey="value" nameKey="name" />
        </Card>

        <Card
          title={
            isOpd ? `Jumlah Relawan Per Kader (${user.nama_opd ?? ""})` : "Jumlah Relawan Per Kader"
          }
          collapsible
        >
          <HorizontalBarChart data={relawanPerKader} dataKey="value" xAxisKey="name" />
        </Card>
      </div>

      {/* Kolom Kanan */}
      <div className="flex flex-col gap-6 flex-1">
        <Card title="Jumlah Relawan Per Kelurahan" collapsible>
          <HorizontalBarChart data={kelurahan} dataKey="value" xAxisKey="name" color="#E76F51" />
        </Card>

        {(isSuperAdmin || isOpd) && (
          <Card
            title={isOpd ? `Jumlah Kader (${user.nama_opd ?? ""})` : "Jumlah Kader Per OPD"}
            collapsible
          >
            <HorizontalBarChart data={kaderPerOpd} dataKey="value" xAxisKey="name" />
          </Card>
        )}
      </div>
    </div>
  );
};

export default Statistik;

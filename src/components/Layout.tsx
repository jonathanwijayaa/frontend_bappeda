//Layout.tsx
import type { ReactNode } from "react";
import React from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface LayoutProps {
  children: ReactNode;
}

type PageTitles = Record<string, string>;

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const getPageTitle = (): string => {
    const titles: PageTitles = {
      "/daftar-kader": "Kader",
      "/dashboard": "Dashboard",
      "/data-relawan": "Relawan",
      "/dokumen": "Dokumen",
      "/edit-profil": "Edit Profil",
      "/histori-relawan": "Riwayat Relawan",
      "/log-aktifitas": "Log / Aktifitas",
      "/manajemen-opd": "Manajemen OPD",
      "/saran-hotline": "Saran/Hotline",
      "/statistik": "Statistik",
      "/surat-keputusan": "Surat Keputusan",
    };
    return titles[location.pathname] || "Dashboard";
  };

  const getPageCaption = (): string => {
    const captions: PageTitles = {
      "/daftar-kader": "Kelola data kader yang terdaftar dalam sistem",
      "/dashboard": "Ringkasan data dan informasi utama sistem",
      "/data-relawan": "Kelola data relawan dan penugasan mereka",
      "/dokumen": "Akses guidebook dan template Excel untuk mengelola data",
      "/edit-profil": "Ubah informasi pribadi dan pengaturan akun",
      "/histori-relawan": "Lihat riwayat data dan penugasan seluruh relawan",
      "/log-aktifitas": "Riwayat aktivitas pengguna dalam sistem",
      "/manajemen-opd": "Kelola data Organisasi Perangkat Daerah (OPD)",
      "/saran-hotline": "Kirim saran, masukan, atau laporan ke administrator",
      "/statistik": "Visualisasi dan analisis data secara keseluruhan",
      "/surat-keputusan": "Kelola Surat Keputusan (SK) terkait penugasan",
    };
    return captions[location.pathname] || "";
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title={getPageTitle()} caption={getPageCaption()} />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
};

export default Layout;

//Sidebar.tsx
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import logoBappeda from "../assets/image/logo-bappeda.png";
import type { LucideIcon } from "lucide-react";
import {
  Home,
  Building2,
  Users,
  FileText,
  Clock,
  BarChart3,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  FolderOpen,
  History,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface MenuItem {
  icon: LucideIcon;
  label: string;
  path: string;
}

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { isSuperAdmin } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const superAdminMenu: MenuItem[] = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: Building2, label: "Manajemen OPD", path: "/manajemen-opd" },
    { icon: UserCircle, label: "Kader", path: "/daftar-kader" },
    { icon: Users, label: "Relawan", path: "/data-relawan" },
    { icon: FileText, label: "Surat Keputusan", path: "/surat-keputusan" },
    { icon: Clock, label: "Log Aktivitas", path: "/log-aktifitas" },
    // { icon: BarChart3, label: "Statistik", path: "/statistik" },
    { icon: FolderOpen, label: "Dokumen", path: "/dokumen" },
    { icon: History, label: "Riwayat Relawan", path: "/histori-relawan" },
  ];

  const opdMenu: MenuItem[] = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: UserCircle, label: "Kader", path: "/daftar-kader" },
    { icon: Users, label: "Relawan", path: "/data-relawan" },
    { icon: FileText, label: "Surat Keputusan", path: "/surat-keputusan" },
    // { icon: BarChart3, label: "Statistik", path: "/statistik" },
    { icon: FolderOpen, label: "Dokumen", path: "/dokumen" },
    { icon: History, label: "Riwayat Relawan", path: "/histori-relawan" },
  ];

  const menuItems = isSuperAdmin ? superAdminMenu : opdMenu;

  return (
    <div
      className={`bg-primary-green h-screen flex flex-col transition-all duration-300 sticky top-0 ${
        isCollapsed ? "w-28" : "w-64"
      }`}
    >
      {/* Header - chevron terintegrasi di dalam, tidak floating */}
      <div
        className={`border-b border-green-600 flex-shrink-0 h-[88px] transition-all duration-300 ${
          isCollapsed
            ? "flex items-center justify-center gap-2 px-3"
            : "flex items-center gap-3 px-4"
        }`}
      >
        <img
          src={logoBappeda}
          alt="Logo Bappeda"
          className="w-10 h-10 object-contain flex-shrink-0"
        />

        {/* Title 2 baris — hanya tampil saat expanded */}
        <div
          className={`flex-1 min-w-0 transition-all duration-300 ${isCollapsed ? "hidden" : "block"}`}
        >
          <p className="text-white font-bold text-sm leading-tight">Bappeda</p>
          <p className="text-white font-bold text-sm leading-tight">Yogyakarta</p>
        </div>

        {/* Tombol chevron — di dalam header, tidak floating */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          className="flex items-center justify-center flex-shrink-0 w-7 h-7 rounded-full text-white transition-colors hover:bg-green-700"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation Menu - Scrollable */}
      <nav className="flex-1 py-6 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 py-3 text-white transition-colors ${
                isActive ? "bg-green-600" : "hover:bg-green-600"
              } ${isCollapsed ? "justify-center px-0" : "px-6"}`}
              title={isCollapsed ? item.label : ""}
            >
              <Icon size={20} className="flex-shrink-0" />
              <span
                className={`transition-all duration-300 whitespace-nowrap ${
                  isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer - Fixed*/}
      <div className={`p-6 border-t border-green-600 flex-shrink-0 ${isCollapsed ? "px-0" : ""}`}>
        <Link
          to="/saran-hotline"
          className={`flex items-center gap-3 text-white hover:bg-green-600 py-3 rounded-lg transition-colors ${
            isCollapsed ? "justify-center px-0" : "px-4"
          }`}
          title={isCollapsed ? "Saran/Hotline" : ""}
        >
          <MessageSquare size={20} className="flex-shrink-0" />
          <span
            className={`transition-all duration-300 whitespace-nowrap ${
              isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
            }`}
          >
            Saran/Hotline
          </span>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;

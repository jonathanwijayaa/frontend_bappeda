import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
    LucideIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MenuItem {
    path: string;
    icon: LucideIcon;
    label: string;
}

const Sidebar: React.FC = () => {
    const location = useLocation();
    const { isSuperAdmin } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
        const saved = localStorage.getItem('sidebarCollapsed');
        return saved ? JSON.parse(saved) : false;
    });

    useEffect(() => {
        localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
    }, [isCollapsed]);

    const superAdminMenu: MenuItem[] = [
        { path: '/dashboard', icon: Home, label: 'Dashboard' },
        { path: '/manajemen-opd', icon: Building2, label: 'Manajemen OPD' },
        { path: '/data-relawan', icon: Users, label: 'Data Relawan' },
        { path: '/surat-keputusan', icon: FileText, label: 'Surat Keputusan' },
        { path: '/log-aktifitas', icon: Clock, label: 'Log/Aktifitas' },
        { path: '/statistik', icon: BarChart3, label: 'Statistik' },
    ];

    const opdMenu: MenuItem[] = [
        { path: '/dashboard', icon: Home, label: 'Dashboard' },
        { path: '/daftar-kader', icon: UserCircle, label: 'Daftar Kader' },
        { path: '/data-relawan', icon: Users, label: 'Data Relawan' },
        { path: '/surat-keputusan', icon: FileText, label: 'Surat Keputusan' },
        { path: '/log-aktifitas', icon: Clock, label: 'Log/Aktifitas' },
        { path: '/statistik', icon: BarChart3, label: 'Statistik' },
    ];

    const menuItems = isSuperAdmin ? superAdminMenu : opdMenu;

    return (
        <div
            className={`bg-emerald-500 h-screen flex flex-col transition-all duration-300 relative sticky top-0 ${isCollapsed ? 'w-20' : 'w-64'
                }`}
        >
            {/* Collapse/Expand Button - Always Visible */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute top-6 right-2 z-10 text-white hover:bg-emerald-600 p-2 rounded-lg transition-colors"
                title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
                {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>

            {/* Header */}
            <div className="p-6 border-b border-emerald-600 flex items-center flex-shrink-0">
                <h1 className={`text-white font-bold text-xl transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'
                    }`}>
                    Icon App
                </h1>
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
                            className={`flex items-center gap-3 px-6 py-3 text-white transition-colors ${isActive ? 'bg-emerald-600' : 'hover:bg-emerald-600'
                                }`}
                            title={isCollapsed ? item.label : ''}
                        >
                            <Icon size={20} className="flex-shrink-0" />
                            <span className={`transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'
                                }`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer - Fixed at Bottom */}
            <div className="p-6 border-t border-emerald-600 flex-shrink-0">
                <Link
                    to="/saran-hotline"
                    className="flex items-center gap-3 text-white hover:bg-emerald-600 px-4 py-3 rounded-lg transition-colors"
                    title={isCollapsed ? 'Saran/Hotline' : ''}
                >
                    <MessageSquare size={20} className="flex-shrink-0" />
                    <span className={`transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'
                        }`}>
                        Saran/Hotline
                    </span>
                </Link>
            </div>
        </div>
    );
};

export default Sidebar;

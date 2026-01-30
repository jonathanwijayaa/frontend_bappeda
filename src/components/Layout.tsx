import React, { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
    children: ReactNode;
}

interface PageTitles {
    [key: string]: string;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const location = useLocation();

    const getPageTitle = (): string => {
        const titles: PageTitles = {
            '/dashboard': 'Dashboard',
            '/manajemen-opd': 'Manajemen OPD',
            '/daftar-kader': 'Daftar Kader',
            '/data-relawan': 'Data Relawan',
            '/surat-keputusan': 'Surat Keputusan',
            '/log-aktifitas': 'Log / Aktifitas',
            '/statistik': 'Statistik',
            '/saran-hotline': 'Saran/Hotline',
            '/edit-profil': 'Edit Profil',
        };
        return titles[location.pathname] || 'Dashboard';
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Header title={getPageTitle()} caption="caption singkat" />
                <main className="flex-1 p-8">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;

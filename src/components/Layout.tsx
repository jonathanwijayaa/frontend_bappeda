//Layout.tsx
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
            '/daftar-kader': 'Kader',
            '/data-relawan': 'Relawan',
            '/surat-keputusan': 'Surat Keputusan',
            '/log-aktifitas': 'Log / Aktifitas',
            '/statistik': 'Statistik',
            '/dokumen': 'Dokumen',
            '/saran-hotline': 'Saran/Hotline',
            '/edit-profil': 'Edit Profil',
            '/histori-relawan': 'Riwayat Relawan',
        };
        return titles[location.pathname] || 'Dashboard';
    };

    const getPageCaption = (): string => {
        const captions: PageTitles = {
            '/dashboard': 'Ringkasan data dan informasi utama sistem',
            '/manajemen-opd': 'Kelola data Organisasi Perangkat Daerah (OPD)',
            '/daftar-kader': 'Kelola data kader yang terdaftar dalam sistem',
            '/data-relawan': 'Kelola data relawan dan penugasan mereka',
            '/surat-keputusan': 'Kelola Surat Keputusan (SK) terkait penugasan',
            '/log-aktifitas': 'Riwayat aktivitas pengguna dalam sistem',
            '/statistik': 'Visualisasi dan analisis data secara keseluruhan',
            '/dokumen': 'Akses guidebook dan template Excel untuk mengelola data',
            '/saran-hotline': 'Kirim saran, masukan, atau laporan ke administrator',
            '/edit-profil': 'Ubah informasi pribadi dan pengaturan akun',
            '/histori-relawan': 'Lihat riwayat data dan penugasan seluruh relawan',
        };
        return captions[location.pathname] || '';
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Header title={getPageTitle()} caption={getPageCaption()} />
                <main className="flex-1 p-8">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;

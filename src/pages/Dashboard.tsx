//Dashboard.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import BarChart from '../components/charts/BarChart';
import { ChartDataItem } from '../types/dashboard.types';
import apiClient from '../lib/axios';

interface DashboardData {
    nama_opd?: string;
    ringkasan: {
        total_relawan_aktif: number;
        total_opd: number;
        total_kader: number;
        pengajuan_pending: number;
    };
    grafik_relawan_per_opd: { nama_opd: string; jumlah_relawan: number }[];
}

const Dashboard: React.FC = () => {
    
    const { isSuperAdmin, isOPD, user } = useAuth();
    
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboard = async (url: string) => {
            try {
                setIsLoading(true);
                setError('');
                const { data: result } = await apiClient.get(url);
                
                if (result.success && result.data) {
                    setDashboardData(result.data);
                } else {
                    setError(result.message || 'Gagal memuat data dashboard');
                    setDashboardData(null);
                }
            } catch (err: any) {
                console.error('Dashboard fetch error:', err);
                setError(err.message || 'Tidak dapat terhubung ke server.');
                setDashboardData(null);
            } finally {
                setIsLoading(false);
            }
        };

        if (isSuperAdmin) {
            fetchDashboard('/admin/dashboard');
        } else if (isOPD) {
            fetchDashboard('/opd-admin/dashboard');
        }
    }, [isSuperAdmin, isOPD]);

    //  FIXED: useMemo sekarang akan bekerja karena sudah di-import
    const chartData: ChartDataItem[] = useMemo(() => {
        if (!dashboardData?.grafik_relawan_per_opd || !Array.isArray(dashboardData.grafik_relawan_per_opd)) {
            return [];
        }
        return dashboardData.grafik_relawan_per_opd.map(item => ({
            name: item.nama_opd,
            jumlah: item.jumlah_relawan || 0
        }));
    }, [dashboardData]);


    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500 text-lg flex items-center gap-3">
                    <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    Memuat data dashboard...
                </div>
            </div>
        );
    }

    if (error || !dashboardData) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
                    {error || 'Data dashboard tidak tersedia'}
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Coba Lagi
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Real-time Data Notice */}
            <div className="text-right">
                <p className="text-sm italic text-gray-600">Data Ditampilkan secara real-time</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Chart Section */}
                <div className="lg:col-span-3">
                    <Card title={isSuperAdmin ? "Jumlah Relawan per OPD" : "Jumlah Relawan per Kader"}>
                        {chartData.length > 0 ? (
                            <BarChart
                                data={chartData}
                                dataKey="jumlah"
                                xAxisKey="name"
                                height={350}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-[350px] text-gray-400">
                                Belum ada data grafik
                            </div>
                        )}
                    </Card>
                </div>

                {/* Info Section */}
                <div className="lg:col-span-2 flex flex-col h-full">
                    <Card 
                        title={isSuperAdmin ? "Info Tambahan:" : `Info Tambahan ${user?.nama_opd || ''}:`} 
                        // Tambahkan class h-full pada Card jika komponen Card Anda mendukung properti className
                        className="h-full" 
                    >
                        {/* Wrapper Flexbox untuk menengahkan konten secara vertikal & horizontal */}
                        <div className="flex items-center justify-center h-full min-h-[320px] w-full p-4">
                            
                            {/* w-full diganti jadi w-auto agar tabelnya rapat dan bisa di-center */}
                            <table className="w-auto">
                                <tbody className="text-lg">
                                    <tr className="border-b border-gray-100 last:border-0">
                                        <td className="text-gray-600 py-4 pr-4 whitespace-nowrap font-medium">Total Relawan Aktif</td>
                                        <td className="font-bold py-4 px-2 w-4 text-center text-gray-400">:</td>
                                        <td className="font-extrabold py-4 pl-2 text-left text-blue-600 text-2xl">
                                            {dashboardData.ringkasan.total_relawan_aktif.toLocaleString('id-ID')}
                                        </td>
                                    </tr>
                                    
                                    <tr className="border-b border-gray-100 last:border-0">
                                        <td className="text-gray-600 py-4 pr-4 whitespace-nowrap font-medium">Total Kader</td>
                                        <td className="font-bold py-4 px-2 w-4 text-center text-gray-400">:</td>
                                        <td className="font-extrabold py-4 pl-2 text-left text-emerald-600 text-2xl">
                                            {dashboardData.ringkasan.total_kader}
                                        </td>
                                    </tr>

                                    {isSuperAdmin && (
                                        <tr className="border-b border-gray-100 last:border-0">
                                            <td className="text-gray-600 py-4 pr-4 whitespace-nowrap font-medium">Total OPD</td>
                                            <td className="font-bold py-4 px-2 w-4 text-center text-gray-400">:</td>
                                            <td className="font-extrabold py-4 pl-2 text-left text-purple-600 text-2xl">
                                                {dashboardData.ringkasan.total_opd}
                                            </td>
                                        </tr>
                                    )}

                                    {isSuperAdmin && (
                                        <tr className="border-b border-gray-100 last:border-0">
                                            <td className="text-gray-600 py-4 pr-4 whitespace-nowrap font-medium">Pengajuan Pending</td>
                                            <td className="font-bold py-4 px-2 w-4 text-center text-gray-400">:</td>
                                            <td className={`font-extrabold py-4 pl-2 text-left text-2xl ${dashboardData.ringkasan.pengajuan_pending > 0 ? 'text-amber-500' : 'text-gray-500'}`}>
                                                {dashboardData.ringkasan.pengajuan_pending}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
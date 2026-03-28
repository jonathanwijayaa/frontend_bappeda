import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import BarChart from '../components/charts/BarChart';
import { ChartDataItem } from '../types/dashboard.types';
import { apiFetch } from '../utils/api';

// TODO: Tambahkan tipe OPD Dashboard jika sudah disambungkan
// import { mockKaderChartData } from '../data/dashboard.data';

interface DashboardData {
    nama_opd?: string; // ✨ TAMBAHKAN BARIS INI
    ringkasan: {
        total_relawan_aktif: number;
        total_opd: number;
        total_kader: number;
        pengajuan_pending: number;
    };
    grafik_relawan_per_opd: { nama_opd: string; jumlah_relawan: number }[];
}

const Dashboard: React.FC = () => {
    const { isSuperAdmin, isOPD } = useAuth();
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboard = async (url: string) => {
            try {
                setIsLoading(true);
                const response = await apiFetch(url);
                const result = await response.json();
                if (result.success) setDashboardData(result.data);
                else setError(result.message);
            } catch (err) {
                setError('Tidak dapat terhubung ke server.');
            } finally {
                setIsLoading(false);
            }
        };

        // ✨ FIXED: Arahkan ke endpoint yang benar sesuai role
        if (isSuperAdmin) fetchDashboard('/admin/dashboard');
        else if (isOPD) fetchDashboard('/opd-admin/dashboard');
    }, [isSuperAdmin, isOPD]);

    // Map data backend ke format chart
    const chartData: ChartDataItem[] = dashboardData
        ? dashboardData.grafik_relawan_per_opd.map(item => ({
            name: item.nama_opd,
            jumlah: item.jumlah_relawan
        }))
        : [];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500 text-lg">Memuat data dashboard...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Real-time Data Notice */}
            <div className="text-right">
                <p className="text-sm italic text-gray-600">Data Ditampilkan secara real-time</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Section */}
                <div className="lg:col-span-2">
                    <Card title={isSuperAdmin ? "Jumlah Relawan per OPD" : "Jumlah Relawan per Kader"}>
                        {isSuperAdmin && chartData.length > 0 ? (
                            <BarChart
                                data={chartData}
                                dataKey="jumlah"
                                xAxisKey="name"
                                height={350}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-[350px] text-gray-400">
                                {/* TODO: Tampilkan chart OPD dashboard */}
                                Belum ada data grafik
                            </div>
                        )}
                    </Card>
                </div>

                {/* Info Section */}
                <div>
                    <Card title={isSuperAdmin ? "Info Tambahan:" : `Info Tambahan ${dashboardData?.nama_opd || ''}:`}>
                        <div className="space-y-4">
                            {dashboardData ? (
                                <table className="w-full">
                                    <tbody>
                                        {isSuperAdmin && (
                                            <tr>
                                                <td className="text-gray-600 py-1.5">Total OPD</td>
                                                <td className="font-semibold py-1.5 w-4 text-center">:</td>
                                                <td className="font-semibold py-1.5 text-right">{dashboardData.ringkasan.total_opd}</td>
                                            </tr>
                                        )}
                                        <tr>
                                            <td className="text-gray-600 py-1.5">Total Kader</td>
                                            <td className="font-semibold py-1.5 w-4 text-center">:</td>
                                            <td className="font-semibold py-1.5 text-right">{dashboardData.ringkasan.total_kader}</td>
                                        </tr>
                                        <tr>
                                            <td className="text-gray-600 py-1.5">Total Relawan Aktif</td>
                                            <td className="font-semibold py-1.5 w-4 text-center">:</td>
                                            <td className="font-semibold py-1.5 text-right">{dashboardData.ringkasan.total_relawan_aktif.toLocaleString('id-ID')}</td>
                                        </tr>
                                        {isSuperAdmin && (
                                            <tr>
                                                <td className="text-gray-600 py-1.5">Pengajuan Pending</td>
                                                <td className="font-semibold py-1.5 w-4 text-center">:</td>
                                                <td className="font-semibold py-1.5 text-right">{dashboardData.ringkasan.pengajuan_pending}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-gray-400 text-center py-4">Belum ada data</div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

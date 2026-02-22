import React from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import BarChart from '../components/charts/BarChart';
import { ChartDataItem } from '../types/dashboard.types';
import { mockOPDChartData, mockKaderChartData } from '../data/dashboard.data';

const Dashboard: React.FC = () => {
    const { isSuperAdmin } = useAuth();

    // Sample data Super Admin
    const opdData: ChartDataItem[] = mockOPDChartData;

    // Sample data OPD
    const kaderData: ChartDataItem[] = mockKaderChartData;

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
                        <BarChart
                            data={isSuperAdmin ? opdData : kaderData}
                            dataKey="jumlah"
                            xAxisKey="name"
                            height={350}
                        />
                    </Card>
                </div>

                {/* Info Section */}
                <div>
                    <Card title="Info Tambahan:">
                        <div className="space-y-4">
                            {isSuperAdmin ? (
                                <table className="w-full">
                                    <tbody>
                                        <tr>
                                            <td className="text-gray-600 py-1.5">Total OPD</td>
                                            <td className="font-semibold py-1.5 w-4 text-center">:</td>
                                            <td className="font-semibold py-1.5 text-right">8</td>
                                        </tr>
                                        <tr>
                                            <td className="text-gray-600 py-1.5">Total Kader</td>
                                            <td className="font-semibold py-1.5 w-4 text-center">:</td>
                                            <td className="font-semibold py-1.5 text-right">22</td>
                                        </tr>
                                        <tr>
                                            <td className="text-gray-600 py-1.5">Total Relawan Aktif per OPD</td>
                                            <td className="font-semibold py-1.5 w-4 text-center">:</td>
                                            <td className="font-semibold py-1.5 text-right">19.959</td>
                                        </tr>
                                    </tbody>
                                </table>
                            ) : (
                                <table className="w-full">
                                    <tbody>
                                        <tr>
                                            <td className="text-gray-600 py-1.5">Total Kader</td>
                                            <td className="font-semibold py-1.5 w-4 text-center">:</td>
                                            <td className="font-semibold py-1.5 text-right">5</td>
                                        </tr>
                                        <tr>
                                            <td className="text-gray-600 py-1.5">Total Relawan Aktif per Kader</td>
                                            <td className="font-semibold py-1.5 w-4 text-center">:</td>
                                            <td className="font-semibold py-1.5 text-right">250</td>
                                        </tr>
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

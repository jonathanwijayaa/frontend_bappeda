import React from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import BarChart from '../components/charts/BarChart';
import { ChartDataItem } from '../types/dashboard.types';
import { mockOPDChartData, mockKaderChartData } from '../data/dashboard.data';

const Dashboard: React.FC = () => {
    const { isSuperAdmin } = useAuth();

    // Sample data for Super Admin
    const opdData: ChartDataItem[] = mockOPDChartData;

    // Sample data for OPD
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
                                <>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Total OPD</span>
                                        <span className="font-semibold">: 8</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Total Kader</span>
                                        <span className="font-semibold">: 22</span>
                                    </div>
                                    <div className="flex justify-between items-start">
                                        <span className="text-gray-600">Total Relawan Aktif per OPD</span>
                                        <span className="font-semibold">: 19.959</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Total Kader</span>
                                        <span className="font-semibold">: 5</span>
                                    </div>
                                    <div className="flex justify-between items-start">
                                        <span className="text-gray-600">Total Relawan Aktif per Kader</span>
                                        <span className="font-semibold">: 250</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

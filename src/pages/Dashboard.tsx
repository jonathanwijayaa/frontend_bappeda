import React from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import BarChart from '../components/charts/BarChart';

interface ChartDataItem {
    name: string;
    [key: string]: string | number;
}

const Dashboard: React.FC = () => {
    const { isSuperAdmin } = useAuth();

    // Sample data for Super Admin
    const opdData: ChartDataItem[] = [
        { name: 'OPD 1', jumlah: 450 },
        { name: 'OPD 2', jumlah: 350 },
        { name: 'OPD 3', jumlah: 320 },
        { name: 'OPD 4', jumlah: 480 },
        { name: 'OPD 5', jumlah: 390 },
        { name: 'OPD 6', jumlah: 430 },
        { name: 'OPD 7', jumlah: 360 },
        { name: 'OPD 8', jumlah: 330 },
    ];

    // Sample data for OPD
    const kaderData: ChartDataItem[] = [
        { name: 'Kader 1', jumlah: 30 },
        { name: 'Kader 2', jumlah: 40 },
        { name: 'Kader 3', jumlah: 47 },
        { name: 'Kader 4', jumlah: 43 },
        { name: 'Kader 5', jumlah: 48 },
    ];

    return (
        <div className="space-y-6">
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

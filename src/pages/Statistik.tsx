import React from 'react';
import Card from '../components/ui/Card';
import DonutChart from '../components/charts/DonutChart';
import PieChart from '../components/charts/PieChart';
import HorizontalBarChart from '../components/charts/HorizontalBarChart';

interface ChartData {
    name: string;
    value: number;
}

const Statistik: React.FC = () => {
    const genderData: ChartData[] = [
        { name: 'Laki - Laki: 63 %', value: 63 },
        { name: 'Perempuan: 37%', value: 37 },
    ];

    const ageData: ChartData[] = [
        { name: '18 - 25: 70 %', value: 70 },
        { name: '26 - 35: 20 %', value: 20 },
        { name: '36+: 10 %', value: 10 },
    ];

    const relawanPerKaderData: ChartData[] = [
        { name: 'Kader Kesehatan', value: 250 },
        { name: 'Kader Pendidikan', value: 200 },
        { name: 'Kader Sosial Kemasyarakatan', value: 150 },
        { name: 'Kader Lingkungan', value: 100 },
        { name: 'Kader Ekonomi Kreatif', value: 50 },
    ];

    const kaderPerOPDData: ChartData[] = [
        { name: 'Dinas Kesehatan', value: 250 },
        { name: 'Dinas Pendidikan', value: 220 },
        { name: 'Dinas Perhubungan', value: 150 },
        { name: 'Dinas Sosial', value: 100 },
        { name: 'Dinas Pariwisata', value: 50 },
    ];

    return (
        <div className="space-y-6">
            {/* Baris Atas- Donut and Pie Charts Gender dan Umur*/}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                <Card title="Demografi Gender" collapsible>
                    <DonutChart
                        data={genderData}
                        dataKey="value"
                        nameKey="name"
                        colors={['#0EA5E9', '#06B6D4']}
                    />
                </Card>

                <Card title="Range Umur Relawan" collapsible>
                    <PieChart
                        data={ageData}
                        dataKey="value"
                        nameKey="name"
                        colors={['#0C4A6E', '#0EA5E9', '#7DD3FC']}
                    />
                </Card>
            </div>

            {/* Baris Bawah - Horizontal Bar Charts Jumlah Relawan per Kader dan OPD */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                <Card title="Jumlah Relawan Per Kader" collapsible>
                    <HorizontalBarChart
                        data={relawanPerKaderData}
                        dataKey="value"
                        yAxisKey="name"
                        color="#3B82F6"
                    />
                </Card>

                <Card title="Jumlah Kader Per OPD" collapsible>
                    <HorizontalBarChart
                        data={kaderPerOPDData}
                        dataKey="value"
                        yAxisKey="name"
                        color="#3B82F6"
                    />
                </Card>
            </div>
        </div>
    );
};

export default Statistik;

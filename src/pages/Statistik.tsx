import React from 'react';
import Card from '../components/ui/Card';
import DonutChart from '../components/charts/DonutChart';
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

    const kelurahanData: ChartData[] = [
        { name: 'Sorosutan', value: 156 },
        { name: 'Kricak', value: 142 },
        { name: 'Baciro', value: 128 },
        { name: 'Pringgokusuman', value: 115 },
        { name: 'Terban', value: 98 },
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
                    />
                </Card>

                <Card title="Demografi Kelurahan" collapsible>
                    <HorizontalBarChart
                        data={kelurahanData}
                        dataKey="value"
                        xAxisKey="name"
                        color="#E76F51"
                    />
                </Card>
            </div>

            {/* Baris Bawah - Horizontal Bar Charts Jumlah Relawan per Kader dan OPD */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                <Card title="Jumlah Relawan Per Kader" collapsible>
                    <HorizontalBarChart
                        data={relawanPerKaderData}
                        dataKey="value"
                        xAxisKey="name"
                    />
                </Card>

                <Card title="Jumlah Kader Per OPD" collapsible>
                    <HorizontalBarChart
                        data={kaderPerOPDData}
                        dataKey="value"
                        xAxisKey="name"
                    />
                </Card>
            </div>
        </div>
    );
};

export default Statistik;

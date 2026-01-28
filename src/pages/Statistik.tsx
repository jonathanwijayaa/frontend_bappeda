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
        { name: 'Kader A', value: 250 },
        { name: 'Kader B', value: 200 },
        { name: 'Kader C', value: 150 },
        { name: 'Kader D', value: 100 },
        { name: 'Kader E', value: 50 },
    ];

    const kaderPerOPDData: ChartData[] = [
        { name: 'OPD 1', value: 250 },
        { name: 'OPD 2', value: 220 },
        { name: 'OPD 3', value: 150 },
        { name: 'OPD 4', value: 100 },
        { name: 'OPD 5', value: 50 },
    ];

    return (
        <div className="space-y-6">
            {/* Top Row - Donut and Pie Charts */}
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

            {/* Bottom Row - Horizontal Bar Charts */}
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

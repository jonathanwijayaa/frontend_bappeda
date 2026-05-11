import React from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartDataItem {
    name: string;
    value: number;
}

interface HorizontalBarChartProps {
    data: ChartDataItem[];
    dataKey: string;
    xAxisKey: string;
    color?: string;
    height?: number;
    maxLabelLength?: number; // Tambahan untuk membatasi panjang teks
}

const HorizontalBarChart: React.FC<HorizontalBarChartProps> = ({
    data,
    dataKey,
    xAxisKey,
    color = '#F4A261', // Oranye Amber – Kader & OPD
    height = 300,
    maxLabelLength = 15 // Default dipotong setelah 15 karakter
}) => {
    // Fungsi untuk memotong teks
    const formatTick = (value: string) => {
        if (typeof value === 'string' && value.length > maxLabelLength) {
            return `${value.substring(0, maxLabelLength)}...`;
        }
        return value;
    };

    return (
        <ResponsiveContainer width="100%" height={height}>
            <RechartsBarChart
                data={data}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                    dataKey={xAxisKey}
                    type="category"
                    tick={{ fontSize: 12 }}
                    width={110} // Sedikit dilebarkan agar teks tidak terlalu mepet
                    tickFormatter={formatTick} // Implementasi truncate di sini
                />
                <Tooltip />
                <Bar dataKey={dataKey} fill={color} radius={[0, 4, 4, 0]} />
            </RechartsBarChart>
        </ResponsiveContainer>
    );
};

export default HorizontalBarChart;
import React from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartDataItem {
    name: string;
    [key: string]: string | number;
}

interface BarChartProps {
    data: ChartDataItem[];
    dataKey: string;
    xAxisKey: string;
    color?: string;
    height?: number;
    maxLabelLength?: number; // Tambahan untuk membatasi panjang teks
}

const BarChart: React.FC<BarChartProps> = ({
    data,
    dataKey,
    xAxisKey,
    color = '#3B82F6',
    height = 400,
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
            <RechartsBarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                    dataKey={xAxisKey}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12 }}
                    tickFormatter={formatTick} // Implementasi truncate di sini
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
            </RechartsBarChart>
        </ResponsiveContainer>
    );
};

export default BarChart;
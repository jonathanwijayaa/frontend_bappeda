import React from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

/**
 * Palet warna siap pakai untuk Demografi Kelurahan (14 kemantren)
 * Gradasi Oranye (#E76F51) → Kuning (#E9C46A)
 */
export const KELURAHAN_COLORS = [
    '#E76F51', // 1
    '#E87A52', // 2
    '#E88554', // 3
    '#E99056', // 4
    '#E99B57', // 5
    '#EAA659', // 6
    '#EAB15A', // 7
    '#EABC5C', // 8
    '#EAC15D', // 9
    '#E9C45E', // 10
    '#E9C460', // 11
    '#E9C462', // 12
    '#E9C465', // 13
    '#E9C46A', // 14
];

interface ChartDataItem {
    name: string;
    value: number;
}

interface PieChartProps {
    data: ChartDataItem[];
    dataKey: string;
    nameKey: string;
    colors?: string[];
    height?: number;
}

const PieChart: React.FC<PieChartProps> = ({
    data,
    dataKey,
    colors,
    height = 300
}) => {
    const COLORS = colors || ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

    return (
        <ResponsiveContainer width="100%" height={height}>
            <RechartsPieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey={dataKey}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
            </RechartsPieChart>
        </ResponsiveContainer>
    );
};

export default PieChart;

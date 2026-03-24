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

interface DonutChartProps {
    data: ChartDataItem[];
    dataKey: string;
    nameKey: string;
    colors?: string[];
    height?: number;
}

const DonutChart: React.FC<DonutChartProps> = ({
    data,
    dataKey,
    colors,
    height = 300
}) => {
    /**
     * Default: Demografi Gender
     * Laki-laki → Slate Blue/Indigo #4A4E69
     * Perempuan → Coral/Rose       #F28482
     */
    const GENDER_COLORS = ['#4A4E69', '#F28482'];

    const COLORS = colors || GENDER_COLORS;

    return (
        <ResponsiveContainer width="100%" height={height}>
            <RechartsPieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey={dataKey}
                    /* Border putih tipis agar antar shade terlihat bersih di atas hijau #008F3B */
                    stroke="#ffffff"
                    strokeWidth={1.5}
                >
                    {data.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                        />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                />
                <Legend iconType="circle" />
            </RechartsPieChart>
        </ResponsiveContainer>
    );
};

export default DonutChart;
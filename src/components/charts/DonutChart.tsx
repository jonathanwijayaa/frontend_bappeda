import React from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ChartDataItem {
    name: string;
    value: number;
    [key: string]: any; 
}

interface DonutChartProps {
    data: ChartDataItem[];
    dataKey: string;
    nameKey: string;
    colors?: string[] | Record<string, string>; 
    height?: number;
}

const DonutChart: React.FC<DonutChartProps> = ({
    data,
    dataKey,
    nameKey,
    colors,
    height = 300
}) => {
    const GENDER_COLOR_MAP: Record<string, string> = {
        'Laki-laki': '#3B82F6',
        'Perempuan': '#F28482'
    };

    const getFillColor = (entry: ChartDataItem, index: number) => {
        const label = entry[nameKey];
        if (colors && !Array.isArray(colors)) return colors[label] || '#8884d8';
        if (GENDER_COLOR_MAP[label]) return GENDER_COLOR_MAP[label];
        if (colors && Array.isArray(colors)) return colors[index % colors.length];
        return ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'][index % 4];
    };

    // 1. Fungsi untuk merender label persentase di luar/dalam donat
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
        const RADIAN = Math.PI / 180;
        // Atur radius agar teks berada sedikit di luar atau pas di tengah slice
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text 
                x={x} 
                y={y} 
                fill="white" 
                textAnchor="middle" 
                dominantBaseline="central"
                fontSize="12px"
                fontWeight="bold"
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    // 2. Fungsi untuk kustomisasi teks Legenda (Nama + Value)
    const renderLegendText = (value: string, entry: any) => {
        const { payload } = entry;
        // Mencari nilai asli dari data berdasarkan nama di legenda
        return (
            <span style={{ color: '#374151', fontWeight: 500, marginLeft: '5px' }}>
                {value} ({payload.value})
            </span>
        );
    };

    return (
        <ResponsiveContainer width="100%" height={height}>
            <RechartsPieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey={dataKey}
                    nameKey={nameKey}
                    stroke="#ffffff"
                    strokeWidth={1.5}
                    // Tambahkan prop label di sini
                    labelLine={false}
                    label={renderCustomizedLabel}
                >
                    {data.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={getFillColor(entry, index)}
                        />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    // Tooltip akan muncul saat hover menampilkan value asli
                />
                <Legend 
                    iconType="circle" 
                    formatter={renderLegendText} // Tambahkan formatter legenda
                />
            </RechartsPieChart>
        </ResponsiveContainer>
    );
};

export default DonutChart;
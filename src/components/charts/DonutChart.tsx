import React from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ChartDataItem {
    name: string;
    value: number;
    // Tambahkan index signature agar object bisa dibaca dinamis lewat nameKey
    [key: string]: any; 
}

interface DonutChartProps {
    data: ChartDataItem[];
    dataKey: string;
    nameKey: string;
    // colors bisa menerima array (cara lama) atau object mapping
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
    /**
     * Map warna statis berdasarkan label agar tidak bergantung pada indeks array.
     * Laki-laki -> Biru (#3B82F6)
     * Perempuan -> Pink (#F28482)
     */
    const GENDER_COLOR_MAP: Record<string, string> = {
        'Laki-laki': '#3B82F6',
        'Perempuan': '#F28482'
    };

    // Fungsi pembantu untuk menentukan warna berdasarkan nama/label
    const getFillColor = (entry: ChartDataItem, index: number) => {
        const label = entry[nameKey]; // Ambil nilai label (ex: 'Laki-laki' / 'Perempuan')

        // 1. Prioritaskan jika ada colors berbentuk map kustom dari props
        if (colors && !Array.isArray(colors)) {
            return colors[label] || '#8884d8';
        }

        // 2. Gunakan pemetaan default Gender berdasarkan nama label (tanpa Index)
        if (GENDER_COLOR_MAP[label]) {
            return GENDER_COLOR_MAP[label];
        }

        // 3. Fallback: jika komponen ini dipakai grafik lain yang butuh warna dari array
        if (colors && Array.isArray(colors)) {
            return colors[index % colors.length];
        }

        // 4. Default safety fallback colors
        const FALLBACK_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
        return FALLBACK_COLORS[index % FALLBACK_COLORS.length];
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
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey={dataKey}
                    /* Border putih tipis agar antar shade terlihat bersih */
                    stroke="#ffffff"
                    strokeWidth={1.5}
                >
                    {data.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={getFillColor(entry, index)} // Gunakan fungsi map di sini
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
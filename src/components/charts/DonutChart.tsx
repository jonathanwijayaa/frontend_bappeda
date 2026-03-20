import React from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

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
    /** * OPSI 1: GRADASI ORANYE TERAKOTA (AKTIF)
     * Sangat kontras dengan Hijau #008F3B, memberikan kesan enerjik & tajam.
     */
    const ORANGE_SHADES = [
        // '#FFF5ED', // 1 - Terendah
        // '#FDE3D0', // 2
        // '#FAD1B3', // 3
        // '#F7BE96', // 4
        // '#F3AB78', // 5
        '#EF985B', // 6
        '#EB853D', // 7
        '#E77220', // 8
        '#D35F12', // 9
        '#BF4C05'  // 10 - Tertinggi
    ];

    /** * OPSI 2: GRADASI KUNING AMBER 
    /*
    const AMBER_SHADES = [
        '#FEFBEB', // 1 - Terendah
        '#FEF5C8', // 2
        '#FDEF9F', // 3
        '#FCE976', // 4
        '#FBE34D', // 5
        '#F9D62D', // 6
        '#E8C024', // 7
        '#D6A91B', // 8
        '#C59312', // 9
        '#B47D09'  // 10 - Tertinggi
    ];
    */

    const COLORS = colors || ORANGE_SHADES;

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
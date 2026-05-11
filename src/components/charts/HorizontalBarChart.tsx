import React from 'react';
import { 
    BarChart as RechartsBarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    LabelList 
} from 'recharts';

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
    maxLabelLength?: number;
}

const HorizontalBarChart: React.FC<HorizontalBarChartProps> = ({
    data,
    dataKey,
    xAxisKey,
    color = '#F4A261', 
    height = 300,
    maxLabelLength = 15
}) => {
    
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
                margin={{ top: 5, right: 45, left: 20, bottom: 5 }} // Right margin ditambah untuk label angka
            >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" hide /> {/* Sumbu X disembunyikan agar bersih seperti contoh gambar */}
                <YAxis
                    dataKey={xAxisKey}
                    type="category"
                    tick={{ fontSize: 12, fill: '#4B5563' }}
                    width={100}
                    tickFormatter={formatTick}
                    axisLine={false}
                    tickLine={false}
                />
                
                {/* Tooltip dengan gaya yang sama seperti Donut Chart */}
                <Tooltip 
                    cursor={{ fill: 'transparent' }} // Menghilangkan highlight kotak saat hover
                    contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        fontSize: '12px'
                    }}
                />

                <Bar 
                    dataKey={dataKey} 
                    fill={color} 
                    radius={[0, 4, 4, 0]} 
                    barSize={25}
                >
                    {/* Menampilkan label angka di ujung bar secara statis */}
                    <LabelList 
                        dataKey={dataKey} 
                        position="right" 
                        style={{ fill: color, fontWeight: 'bold', fontSize: '12px' }} 
                        formatter={(value: number) => `${value}`}
                    />
                </Bar>
            </RechartsBarChart>
        </ResponsiveContainer>
    );
};

export default HorizontalBarChart;
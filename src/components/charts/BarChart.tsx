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
    [key: string]: string | number;
}

interface BarChartProps {
    data: ChartDataItem[];
    dataKey: string;
    xAxisKey: string;
    color?: string;
    height?: number;
    maxLabelLength?: number;
}

const BarChart: React.FC<BarChartProps> = ({
    data,
    dataKey,
    xAxisKey,
    color = '#3B82F6',
    height = 400,
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
                margin={{ top: 30, right: 30, left: 20, bottom: 60 }}
            >
                {/* Garis bantu horizontal saja agar lebih bersih */}
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                
                <XAxis
                    dataKey={xAxisKey}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12, fill: '#4B5563' }}
                    tickFormatter={formatTick}
                    axisLine={false}
                    tickLine={false}
                />
                
                {/* Sembunyikan YAxis jika angka sudah ada di atas bar, atau biarkan jika ingin referensi skala */}
                <YAxis hide />

                <Tooltip 
                    cursor={{ fill: '#F3F4F6', opacity: 0.4 }} // Highlight halus saat hover
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
                    radius={[4, 4, 0, 0]} // Lengkungan di sisi atas saja
                    barSize={40}
                >
                    {/* Menampilkan label angka tepat di atas batang */}
                    <LabelList 
                        dataKey={dataKey} 
                        position="top" 
                        style={{ fill: '#4B5563', fontWeight: 'bold', fontSize: '13px' }} 
                        offset={10} // Jarak antara angka dan ujung batang
                    />
                </Bar>
            </RechartsBarChart>
        </ResponsiveContainer>
    );
};

export default BarChart;
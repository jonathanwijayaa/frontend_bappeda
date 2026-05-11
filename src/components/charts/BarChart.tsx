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
        margin={{ top: 30, right: 30, left: 10, bottom: 60 }}
    >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
        
        <XAxis
            dataKey={xAxisKey}
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 12, fill: '#4B5563' }}
            tickFormatter={formatTick}
            axisLine={{ stroke: '#E5E7EB' }}
            tickLine={false}
        />
        
        {/* Sumbu Y sekarang muncul kembali */}
        <YAxis 
            tick={{ fontSize: 11, fill: '#9CA3AF' }} 
            axisLine={{ stroke: '#E5E7EB' }}
            tickLine={false}
        />

        <Tooltip 
            cursor={{ fill: '#F3F4F6', opacity: 0.4 }}
            contentStyle={{
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                fontSize: '16px'
            }}
        />

        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} barSize={40}>
            <LabelList 
                dataKey={dataKey} 
                position="top" 
                style={{ fill: '#4B5563', fontWeight: 'bold', fontSize: '16px' }} 
                offset={10}
            />
        </Bar>
    </RechartsBarChart>
</ResponsiveContainer>
    );
};

export default BarChart;
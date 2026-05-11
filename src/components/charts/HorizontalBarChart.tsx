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
        margin={{ top: 5, right: 50, left: 20, bottom: 20 }} // Tambah margin bawah untuk label XAxis
    >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
        
        {/* Sumbu X sekarang muncul kembali */}
        <XAxis 
            type="number" 
            tick={{ fontSize: 11, fill: '#9CA3AF' }} 
            axisLine={{ stroke: '#E5E7EB' }}
        /> 
        
        <YAxis
            dataKey={xAxisKey}
            type="category"
            tick={{ fontSize: 12, fill: '#4B5563' }}
            width={100}
            tickFormatter={formatTick}
            axisLine={{ stroke: '#E5E7EB' }}
            tickLine={false}
        />
        
        <Tooltip 
            cursor={{ fill: 'transparent' }}
            contentStyle={{
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                fontSize: '12px'
            }}
        />

        <Bar dataKey={dataKey} fill={color} radius={[0, 4, 4, 0]} barSize={25}>
            <LabelList 
                dataKey={dataKey} 
                position="right" 
                style={{ fill: color, fontWeight: 'bold', fontSize: '12px' }} 
                offset={10}
            />
        </Bar>
    </RechartsBarChart>
</ResponsiveContainer>
    );
};

export default HorizontalBarChart;
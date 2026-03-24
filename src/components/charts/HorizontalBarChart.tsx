import React from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartDataItem {
    name: string;
    value: number;
}

interface HorizontalBarChartProps {
    data: ChartDataItem[];
    dataKey: string;
    yAxisKey: string;
    color?: string;
    height?: number;
}

const HorizontalBarChart: React.FC<HorizontalBarChartProps> = ({
    data,
    dataKey,
    yAxisKey,
    color = '#F4A261', // Oranye Amber – Kader & OPD
    height = 300
}) => {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <RechartsBarChart
                data={data}
                layout="horizontal"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                    dataKey={yAxisKey}
                    type="category"
                    tick={{ fontSize: 12 }}
                    width={100}
                />
                <Tooltip />
                <Bar dataKey={dataKey} fill={color} radius={[0, 4, 4, 0]} />
            </RechartsBarChart>
        </ResponsiveContainer>
    );
};

export default HorizontalBarChart;

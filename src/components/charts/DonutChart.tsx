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
    const COLORS = colors || ['#0EA5E9', '#06B6D4', '#14B8A6'];

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

export default DonutChart;

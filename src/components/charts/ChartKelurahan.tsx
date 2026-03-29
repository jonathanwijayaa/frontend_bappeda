import React from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * Palet warna siap pakai untuk Demografi Kelurahan (14 kemantren)
 * Gradasi Oranye (#E76F51) → Kuning (#E9C46A)
 */
// export const KELURAHAN_COLORS = [
//     '#E76F51', // 1
//     // '#E87A52', // 2
//     '#E88554', // 3
//     // '#E99056', // 4
//     '#E99B57', // 5
//     // '#EAA659', // 6
//     '#EAB15A', // 7
//     // '#EABC5C', // 8
//     '#EAC15D', // 9
//     // '#E9C45E', // 10
//     '#E9C460', // 11
//     // '#E9C462', // 12
//     '#E9C465', // 13
//     // '#E9C46A', // 14
// ];

interface ChartDataItem {
    name: string;
    value: number;
}

interface ChartKelurahan {
    data: ChartDataItem[];
    dataKey: string;
    yAxisKey: string;
    color?: string;
    height?: number;
}

const ChartKelurahan: React.FC<ChartKelurahan> = ({
    data,
    dataKey,
    yAxisKey,
    color='E76F51',
    height = 300
}) => {
    // const COLORS = colors || KELURAHAN_COLORS;

    return (
        <ResponsiveContainer width="100%" height={height}>
            <RechartsBarChart
            data={data}
                layout="horizontal"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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

export default ChartKelurahan;

import React from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";

interface ChartDataItem {
  [key: string]: number | string;
  name: string;
}

interface BarChartProps {
  color?: string;
  data: ChartDataItem[];
  dataKey: string;
  height?: number;
  maxLabelLength?: number;
  xAxisKey: string;
}

const BarChart: React.FC<BarChartProps> = ({
  color = "#3B82F6",
  data,
  dataKey,
  height = 400,
  maxLabelLength = 15,
  xAxisKey,
}) => {
  const formatTick = (value: string) => {
    if (typeof value === "string" && value.length > maxLabelLength) {
      return `${value.substring(0, maxLabelLength)}...`;
    }
    return value;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ bottom: 60, left: 10, right: 30, top: 30 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />

        <XAxis
          dataKey={xAxisKey}
          angle={-45}
          textAnchor="end"
          height={80}
          tick={{ fill: "#4B5563", fontSize: 12 }}
          tickFormatter={formatTick}
          axisLine={{ stroke: "#E5E7EB" }}
          tickLine={false}
        />

        {/* Sumbu Y sekarang muncul kembali */}
        <YAxis
          tick={{ fill: "#9CA3AF", fontSize: 11 }}
          axisLine={{ stroke: "#E5E7EB" }}
          tickLine={false}
        />

        <Tooltip
          cursor={{ fill: "#F3F4F6", opacity: 0.4 }}
          contentStyle={{
            border: "none",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            fontSize: "16px",
          }}
        />

        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} barSize={40}>
          <LabelList
            dataKey={dataKey}
            position="top"
            style={{ fill: "#4B5563", fontSize: "16px", fontWeight: "bold" }}
            offset={10}
          />
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

export default BarChart;

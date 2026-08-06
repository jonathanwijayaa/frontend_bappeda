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
  name: string;
  value: number;
}

interface HorizontalBarChartProps {
  color?: string;
  data: ChartDataItem[];
  dataKey: string;
  height?: number;
  maxLabelLength?: number;
  xAxisKey: string;
}

const HorizontalBarChart: React.FC<HorizontalBarChartProps> = ({
  color = "#F4A261",
  data,
  dataKey,
  height = 300,
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
      <RechartsBarChart
        data={data}
        layout="vertical"
        margin={{ bottom: 20, left: 20, right: 50, top: 5 }} // Tambah margin bawah untuk label XAxis
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />

        {/* Sumbu X sekarang muncul kembali */}
        <XAxis
          type="number"
          tick={{ fill: "#9CA3AF", fontSize: 11 }}
          axisLine={{ stroke: "#E5E7EB" }}
        />

        <YAxis
          dataKey={xAxisKey}
          type="category"
          tick={{ fill: "#4B5563", fontSize: 12 }}
          width={100}
          tickFormatter={formatTick}
          axisLine={{ stroke: "#E5E7EB" }}
          tickLine={false}
        />

        <Tooltip
          cursor={{ fill: "transparent" }}
          contentStyle={{
            border: "none",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            fontSize: "16px",
          }}
        />

        <Bar dataKey={dataKey} fill={color} radius={[0, 4, 4, 0]} barSize={25}>
          <LabelList
            dataKey={dataKey}
            position="right"
            style={{ fill: color, fontSize: "16px", fontWeight: "bold" }}
            offset={10}
          />
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

export default HorizontalBarChart;

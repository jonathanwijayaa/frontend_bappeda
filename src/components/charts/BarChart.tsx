// src/components/charts/BarChart.tsx
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

export interface ChartDataItem {
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
  height = 360,
  maxLabelLength = 14,
  xAxisKey,
}) => {
  const formatTick = (value: string) => {
    if (typeof value === "string" && value.length > maxLabelLength) {
      return `${value.substring(0, maxLabelLength)}...`;
    }
    return value;
  };

  // Dinamis: perkecil bar dan font jika data banyak agar tidak tumpang tindih
  const isCrowded = data.length > 12;
  const barSize = data.length <= 5 ? 36 : data.length <= 10 ? 28 : 22;
  const labelFontSize = isCrowded ? "11px" : "13px";

  // Hitung lebar minimal grafik agar jika di-scroll horizontal tidak menciut
  const dynamicMinWidth = data.length > 10 ? `${data.length * 56}px` : "100%";

  return (
    <div className="w-full overflow-x-auto pb-2 select-none">
      <div style={{ minWidth: dynamicMinWidth, width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart
            data={data}
            margin={{ bottom: 50, left: 0, right: 20, top: 25 }}
            barCategoryGap={isCrowded ? "12%" : "20%"}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />

            <XAxis
              dataKey={xAxisKey}
              angle={-40}
              textAnchor="end"
              interval={0}
              height={70}
              tick={{ fill: "#4B5563", fontSize: 11 }}
              tickFormatter={formatTick}
              axisLine={{ stroke: "#E5E7EB" }}
              tickLine={false}
            />

            <YAxis
              allowDecimals={false}
              tick={{ fill: "#9CA3AF", fontSize: 11 }}
              axisLine={{ stroke: "#E5E7EB" }}
              tickLine={false}
              width={35}
            />

            <Tooltip
              cursor={{ fill: "#F9FAFB" }}
              contentStyle={{
                border: "none",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                fontSize: "13px",
                padding: "8px 12px",
              }}
            />

            <Bar
              dataKey={dataKey}
              fill={color}
              radius={[4, 4, 0, 0]}
              barSize={barSize}
            >
              <LabelList
                dataKey={dataKey}
                position="top"
                style={{
                  fill: "#4B5563",
                  fontSize: labelFontSize,
                  fontWeight: 600,
                }}
                offset={6}
              />
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BarChart;
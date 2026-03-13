"use client";

import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";

type BarChartProps = {
  data: Array<{
    [key: string]: string | number;
  }>;
  categories: Array<{
    key: string;
    label: string;
    color: string;
  }>;
  height?: number;
  className?: string;
};

type BarTooltipProps = {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
  }>;
  label?: string;
  categories: BarChartProps["categories"];
};

export const CustomBarTooltip = ({
  active,
  payload,
  label,
  categories,
}: BarTooltipProps) => {
  if (!active || !payload) return null;

  return (
    <div className="rounded-lg border bg-white p-2 shadow-sm">
      <p className="text-xs font-medium text-gray-600 mb-1">{label}</p>
      {payload.map((entry, index) => {
        const category = categories.find((c) => c.key === entry.dataKey);
        return (
          <div key={index} className="flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: category?.color }}
            />
            <p className="text-xs font-medium text-gray-900">
              {category?.label}:{" "}
              {entry.dataKey === "revenue"
                ? `$${entry.value.toLocaleString()}`
                : entry.value}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export function BarChart({
  data,
  categories,
  height = 300,
  className,
}: BarChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart data={data}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            fontSize={12}
            tickMargin={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={12}
            tickMargin={8}
            tickFormatter={(value) => `$${value / 1000}k`}
          />
          <Tooltip
            content={<CustomBarTooltip categories={categories} />}
            cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
            wrapperStyle={{ outline: "none" }}
          />
          {categories.map((category) => (
            <Bar
              key={category.key}
              dataKey={category.key}
              fill={category.color}
              radius={[4, 4, 0, 0]}
              barSize={30}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

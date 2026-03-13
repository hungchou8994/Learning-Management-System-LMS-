"use client";

import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  ResponsiveContainer,
} from "recharts";

type AreaChartProps = {
  data: Array<{
    [key: string]: string | number;
  }>;
  categories: Array<{
    key: string;
    label: string;
    color: string;
    gradientId: string;
  }>;
  height?: number;
  className?: string;
  stacked?: boolean;
};

type AreaTooltipProps = {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
  }>;
  label?: string;
  categories: AreaChartProps["categories"];
};

export const CustomAreaTooltip = ({
  active,
  payload,
  label,
  categories,
}: AreaTooltipProps) => {
  if (!active || !payload) return null;

  return (
    <div className="rounded-lg border bg-white p-2 shadow-sm">
      <p className="text-xs font-medium text-gray-600 mb-1">
        {new Date(label || "").toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}
      </p>
      {payload.map((entry, index) => {
        const category = categories.find((c) => c.key === entry.dataKey);
        return (
          <div key={index} className="flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: category?.color }}
            />
            <p className="text-xs font-medium text-gray-900">
              {category?.label}: {entry.value}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export function AreaChart({
  data,
  categories,
  height = 300,
  className,
  stacked = false,
}: AreaChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsAreaChart data={data}>
          <defs>
            {categories.map((category) => (
              <linearGradient
                key={category.gradientId}
                id={category.gradientId}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={category.color}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={category.color}
                  stopOpacity={0.1}
                />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            className="text-xs font-medium"
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
            }}
            minTickGap={32}
          />
          {categories.map((category) => (
            <Area
              key={category.key}
              type="monotone"
              dataKey={category.key}
              stroke={category.color}
              fill={`url(#${category.gradientId})`}
              stackId={stacked ? "1" : undefined}
            />
          ))}
          <Tooltip
            content={<CustomAreaTooltip categories={categories} />}
            cursor={false}
            wrapperStyle={{ outline: "none" }}
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}

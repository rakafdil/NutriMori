"use client";
import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#10b981", "#84cc16", "#fbbf24"];

interface MacroDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

interface MacronutrientChartProps {
  data: MacroDataPoint[];
  dietScore: number | string;
}

const MacronutrientChart: React.FC<MacronutrientChartProps> = ({
  data,
  dietScore,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
      <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-6">
        Macronutrients Ratio
      </h3>
      <div className="h-[300px] w-full flex items-center justify-center relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={80}
              outerRadius={110}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                borderRadius: "8px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold text-gray-800 dark:text-white">
            {dietScore}
          </span>
          <span className="text-sm text-gray-400">Diet Score</span>
        </div>
      </div>
      <div className="flex justify-center gap-6 mt-4">
        {data.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {entry.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MacronutrientChart;

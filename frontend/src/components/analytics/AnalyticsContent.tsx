"use client";
import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Calendar, Loader2 } from "lucide-react";
import { useHabitInsights } from "@/hooks/useHabitInsights";
import { HabitInsightsPeriod } from "@/types/habitInsights";

const COLORS = ["#10b981", "#84cc16", "#fbbf24"];

const PERIOD_LABELS: Record<HabitInsightsPeriod, string> = {
  weekly: "Last 7 Days",
  monthly: "Last 30 Days",
  yearly: "Last Year",
  overall: "All Time",
};

const AnalyticsContent: React.FC = () => {
  const { data, isLoading, error, period, setPeriod } = useHabitInsights({
    initialPeriod: "weekly",
  });

  const handlePeriodChange = (newPeriod: HabitInsightsPeriod) => {
    setPeriod(newPeriod);
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-gray-500 dark:text-gray-400">
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/30 p-6 rounded-2xl border border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">Error: {error}</p>
        </div>
      </div>
    );
  }

  const calorieData = data?.calorieIntake || [];
  const categoryData = data?.macronutrients || [];
  const mealTiming = data?.mealTiming || [];
  const aiPattern = data?.aiPatternDiscovery;
  const dietScore = data?.dietScore || "N/A";

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-24">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Weekly Analytics
        </h2>
        <div className="relative">
          <select
            value={period}
            onChange={(e) =>
              handlePeriodChange(e.target.value as HabitInsightsPeriod)
            }
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-4 py-2 pr-8 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-colors appearance-none cursor-pointer"
          >
            {Object.entries(PERIOD_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <Calendar className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
        </div>
      </div>

      {/* AI Pattern Report */}
      {aiPattern && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-4 transition-colors">
          <div className="p-3 bg-white dark:bg-indigo-900/50 rounded-full shadow-sm">
            <span className="text-2xl">🧠</span>
          </div>
          <div>
            <h3 className="font-bold text-indigo-900 dark:text-indigo-200 text-lg mb-1">
              {aiPattern.title || "AI Pattern Discovery"}
            </h3>
            <p className="text-indigo-800/80 dark:text-indigo-300/80 leading-relaxed">
              {aiPattern.description}
              {aiPattern.highlights?.map((highlight, index) => (
                <span
                  key={index}
                  className="font-semibold text-indigo-900 dark:text-indigo-200"
                >
                  {" "}
                  {highlight}
                </span>
              ))}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calorie Trend */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-6">
            Calorie Intake
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={calorieData}>
                <defs>
                  <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#374151"
                  strokeOpacity={0.1}
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--tw-bg-opacity, #fff)",
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                  itemStyle={{ color: "#374151" }}
                  cursor={{
                    stroke: "#10b981",
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cal"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorCal)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Macro Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-6">
            Macronutrients Ratio
          </h3>
          <div className="h-[300px] w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
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
            {categoryData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {entry.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h3 className="font-bold text-gray-700 dark:text-gray-200">
              Meal Timing Heatmap
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Kapan kamu biasanya makan kalori terbesar.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 h-32">
          {mealTiming.length > 0
            ? mealTiming.map((dayData, i) => (
                <div key={i} className="flex flex-col gap-1 h-full">
                  {dayData.slots.map((slot, j) => {
                    const maxCalories = Math.max(
                      ...mealTiming.flatMap((d) =>
                        d.slots.map((s) => s.calories)
                      )
                    );
                    const opacity =
                      maxCalories > 0 ? slot.calories / maxCalories : 0.1;
                    return (
                      <div
                        key={j}
                        className="flex-1 rounded-sm bg-emerald-500 transition-all hover:scale-105"
                        style={{ opacity: opacity < 0.1 ? 0.1 : opacity }}
                        title={`${dayData.dayName}, Slot ${slot.slot}: ${slot.calories} kcal`}
                      />
                    );
                  })}
                </div>
              ))
            : [...Array(7)].map((_, i) => (
                <div key={i} className="flex flex-col gap-1 h-full">
                  {[...Array(5)].map((_, j) => (
                    <div
                      key={j}
                      className="flex-1 rounded-sm bg-gray-200 dark:bg-gray-700"
                    />
                  ))}
                </div>
              ))}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          {mealTiming.length > 0
            ? mealTiming.map((day) => <span key={day.day}>{day.dayName}</span>)
            : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <span key={day}>{day}</span>
              ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsContent;

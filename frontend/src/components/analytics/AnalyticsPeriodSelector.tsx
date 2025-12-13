"use client";
import React from "react";
import { Calendar } from "lucide-react";
import { HabitInsightsPeriod } from "@/types/habitInsights";

const PERIOD_LABELS: Record<HabitInsightsPeriod, string> = {
  weekly: "Last 7 Days",
  monthly: "Last 30 Days",
  yearly: "Last Year",
  overall: "All Time",
};

interface AnalyticsPeriodSelectorProps {
  period: HabitInsightsPeriod;
  onPeriodChange: (period: HabitInsightsPeriod) => void;
}

const AnalyticsPeriodSelector: React.FC<AnalyticsPeriodSelectorProps> = ({
  period,
  onPeriodChange,
}) => {
  return (
    <div className="relative">
      <select
        value={period}
        onChange={(e) => onPeriodChange(e.target.value as HabitInsightsPeriod)}
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
  );
};

export default AnalyticsPeriodSelector;

"use client";
import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { HabitInsightsPeriod } from "@/types/habitInsights";

// Components
import AnalyticsPeriodSelector from "./AnalyticsPeriodSelector";
import {
  CalorieChart,
  MacronutrientChart,
  MealTimingHeatmap,
  AIPatternCard,
} from "./charts";

// Data
import { dummyAnalyticsData } from "./data/dummyAnalyticsData";

// Set to true to use real API, false for dummy data
const USE_REAL_DATA = false;

const AnalyticsContent: React.FC = () => {
  const [period, setPeriod] = useState<HabitInsightsPeriod>("weekly");
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);

  // Use dummy data or real data based on flag
  const data = USE_REAL_DATA ? null : dummyAnalyticsData;

  // Uncomment below to use real API
  // const { data, isLoading, error, period, setPeriod } = useHabitInsights({
  //   initialPeriod: "weekly",
  // });

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
  const macroData = data?.macronutrients || [];
  const mealTiming = data?.mealTiming || [];
  const aiPattern = data?.aiPatternDiscovery;
  const dietScore = data?.dietScore ?? "N/A";

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Weekly Analytics
        </h2>
        <AnalyticsPeriodSelector
          period={period}
          onPeriodChange={handlePeriodChange}
        />
      </div>

      {/* AI Pattern Report */}
      {aiPattern && <AIPatternCard pattern={aiPattern} />}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CalorieChart data={calorieData} />
        <MacronutrientChart data={macroData} dietScore={dietScore} />
      </div>

      {/* Heatmap */}
      <MealTimingHeatmap data={mealTiming} />
    </div>
  );
};

export default AnalyticsContent;

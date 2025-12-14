"use client";
import React from "react";
import {
  Loader2,
  Calendar,
  Flame,
  UtensilsCrossed,
  HeartPulse,
  CheckCircle2,
  AlertCircle,
  Info,
  Lightbulb,
  TrendingUp,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { HabitInsightsPeriod } from "@/types/habitInsights";
import { useHabitInsights } from "@/hooks/useHabitInsights";
import AnalyticsPeriodSelector from "./AnalyticsPeriodSelector";

const AnalyticsContent: React.FC = () => {
  // Menggunakan hook useHabitInsights untuk mengambil data real dari database
  const {
    data,
    isLoading,
    error,
    period,
    setPeriod,
    refetch,
    refreshInsights,
  } = useHabitInsights("weekly");

  const handlePeriodChange = (newPeriod: HabitInsightsPeriod) =>
    setPeriod(newPeriod);

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-gray-500 dark:text-gray-400">
            Menganalisis data nutrisi...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/30 p-6 rounded-2xl border border-red-200 dark:border-red-800 flex flex-col items-center gap-4">
          <p className="text-red-600 dark:text-red-400">
            Gagal memuat analitik: {error || "Unknown error"}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 text-sm bg-red-100 dark:bg-red-900/50 hover:bg-red-200 text-red-700 dark:text-red-300 rounded-lg transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const {
    dateRange,
    daysAnalyzed,
    totalMeals,
    averageCalories,
    healthScore,
    summary,
    patterns,
    recommendations,
  } = data;

  // Dynamic colors for Health Score
  const getScoreColor = (score: number) => {
    if (score >= 80)
      return "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400";
    if (score >= 60)
      return "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400";
    return "text-rose-600 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400";
  };

  const scoreColorClass = getScoreColor(healthScore);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-24">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
            <Calendar className="w-4 h-4" />
            <span>
              {dateRange?.start} - {dateRange?.end}
            </span>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight">
            Analitik Nutrisi
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refreshInsights()}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-95"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Analisis AI</span>
          </button>

          <AnalyticsPeriodSelector
            period={period}
            onPeriodChange={handlePeriodChange}
          />
        </div>
      </div>

      {/* Stats Grid - Colorful & Interactive */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Days Analyzed */}
        <div className="group relative overflow-hidden rounded-2xl border border-blue-100 dark:border-blue-900 bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600 dark:text-blue-400">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Hari Dianalisis
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {daysAnalyzed}{" "}
            <span className="text-sm font-normal text-gray-400">hari</span>
          </p>
        </div>

        {/* Total Meals */}
        <div className="group relative overflow-hidden rounded-2xl border border-orange-100 dark:border-orange-900 bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-orange-50 dark:bg-orange-900/20 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-orange-100 dark:bg-orange-900/40 rounded-xl text-orange-600 dark:text-orange-400">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Makan
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {totalMeals}{" "}
            <span className="text-sm font-normal text-gray-400">kali</span>
          </p>
        </div>

        {/* Avg Calories */}
        <div className="group relative overflow-hidden rounded-2xl border border-rose-100 dark:border-rose-900 bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-rose-50 dark:bg-rose-900/20 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-rose-100 dark:bg-rose-900/40 rounded-xl text-rose-600 dark:text-rose-400">
              <Flame className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Rata-rata Kalori
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {averageCalories}{" "}
            <span className="text-sm font-normal text-gray-400">kkal</span>
          </p>
        </div>

        {/* Health Score */}
        <div className="group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${scoreColorClass}`}>
                <HeartPulse className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Health Score
              </span>
            </div>
          </div>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {healthScore}
            </p>
            <span className="text-sm text-gray-400 mb-1.5">/ 100</span>
          </div>
          <div className="mt-3 h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                healthScore >= 80
                  ? "bg-emerald-500"
                  : healthScore >= 60
                  ? "bg-amber-500"
                  : "bg-rose-500"
              }`}
              style={{ width: `${Math.min(healthScore, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content: Summary & Patterns */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Summary Card */}
          <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900 bg-gradient-to-br from-white to-indigo-50/30 dark:from-gray-900 dark:to-indigo-900/10 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 rounded-2xl text-indigo-600 dark:text-indigo-400 shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Ringkasan AI
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {summary}
                </p>
              </div>
            </div>
          </div>

          {/* Patterns List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gray-500" />
              Pola Terdeteksi
            </h3>

            {patterns?.length ? (
              <div className="grid gap-3">
                {patterns.map((p, idx) => {
                  const isPositive = p.type === "positive";
                  const isNegative = p.type === "negative";

                  return (
                    <div
                      key={`${p.message}-${idx}`}
                      className={`
                        relative overflow-hidden rounded-xl border p-4 transition-all duration-300 hover:shadow-md
                        ${
                          isPositive
                            ? "bg-emerald-50/50 border-emerald-100 hover:border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-900/30"
                            : isNegative
                            ? "bg-rose-50/50 border-rose-100 hover:border-rose-200 dark:bg-rose-900/10 dark:border-rose-900/30"
                            : "bg-blue-50/50 border-blue-100 hover:border-blue-200 dark:bg-blue-900/10 dark:border-blue-900/30"
                        }
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 shrink-0 ${
                            isPositive
                              ? "text-emerald-600"
                              : isNegative
                              ? "text-rose-600"
                              : "text-blue-600"
                          }`}
                        >
                          {isPositive ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : isNegative ? (
                            <AlertCircle className="w-5 h-5" />
                          ) : (
                            <Info className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-xs font-bold uppercase tracking-wider ${
                                isPositive
                                  ? "text-emerald-700"
                                  : isNegative
                                  ? "text-rose-700"
                                  : "text-blue-700"
                              }`}
                            >
                              {p.type}
                            </span>
                            {p.impact && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-white/50 dark:bg-black/20 text-gray-500 border border-gray-100 dark:border-gray-700">
                                {p.impact} Impact
                              </span>
                            )}
                          </div>
                          <p className="text-gray-800 dark:text-gray-200 font-medium">
                            {p.message}
                          </p>
                          {p.daysDetected && p.daysDetected.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {p.daysDetected.map((day) => (
                                <span
                                  key={day}
                                  className="text-xs px-2 py-1 rounded-md bg-white/60 dark:bg-black/20 text-gray-600 dark:text-gray-400"
                                >
                                  {day}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                <p className="text-gray-500 dark:text-gray-400">
                  Belum ada pola signifikan yang terdeteksi.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recommendations Sidebar */}
        <div className="rounded-2xl border border-amber-100 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-900/10 p-6 h-fit">
          <div className="flex items-center gap-2 mb-5">
            <Lightbulb className="w-5 h-5 text-amber-500 fill-amber-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Rekomendasi
            </h3>
          </div>

          <div className="space-y-4">
            {recommendations?.map((r, idx) => (
              <div
                key={idx}
                className="group flex gap-3 p-3 rounded-xl bg-white dark:bg-gray-900 border border-amber-100 dark:border-amber-900/30 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="mt-1 shrink-0 h-5 w-5 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-xs group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  {idx + 1}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {r}
                </p>
              </div>
            ))}

            {(!recommendations || recommendations.length === 0) && (
              <p className="text-sm text-gray-500 italic">
                Belum ada rekomendasi tersedia.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsContent;

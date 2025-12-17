"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Loader2, Sparkles, Calendar, RefreshCw } from "lucide-react";
import { useHabitInsights } from "@/hooks/useHabitInsights";

const LOADING_TIMEOUT_MS = 15000; // Increased to 15 seconds

const DailyInsight: React.FC = () => {
  const { data, isLoading, error, refreshInsights, setCustomDateRange } =
    useHabitInsights();
  const [todayDate, setTodayDate] = useState<string>("");
  const [loadingTooLong, setLoadingTooLong] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Format today's date in Indonesian locale
    const now = new Date();
    const formatted = now.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    setTodayDate(formatted);
    const todayIso = now.toISOString().split("T")[0];
    setCustomDateRange({ startDate: todayIso, endDate: todayIso });
  }, []);

  // Detect if loading takes too long
  useEffect(() => {
    if (!isLoading) {
      setLoadingTooLong(false);
      return;
    }

    const timeout = setTimeout(() => {
      if (isLoading) {
        setLoadingTooLong(true);
      }
    }, LOADING_TIMEOUT_MS);

    return () => clearTimeout(timeout);
  }, [isLoading]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setLoadingTooLong(false);
    try {
      await refreshInsights();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshInsights]);

  const insight =
    data?.summary ||
    (error
      ? "Gagal memuat insight."
      : "Mulai catat makananmu untuk mendapatkan insight harian.");

  return (
    <div className="bg-linear-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-900/20 dark:to-teal-900/10 border border-emerald-100 dark:border-emerald-900/50 p-6 rounded-3xl relative overflow-hidden">
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-200/30 dark:bg-emerald-500/10 rounded-full blur-2xl"></div>
      <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-teal-200/20 dark:bg-teal-500/10 rounded-full blur-2xl"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold">
            <Sparkles className="w-4 h-4" />
            Insight Today
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
              className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors disabled:opacity-50"
              title="Refresh insight"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ${
                  isRefreshing ? "animate-spin" : ""
                }`}
              />
            </button>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-500">
              <Calendar className="w-3 h-3" />
              <span>{todayDate}</span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="py-2 space-y-3">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
              <span className="text-emerald-700 dark:text-emerald-300 text-sm">
                Menganalisis pola makan...
              </span>
            </div>
            {loadingTooLong && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-600 dark:text-amber-400">
                  Loading terlalu lama?
                </span>
                <button
                  onClick={handleRefresh}
                  className="px-3 py-1 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                >
                  Coba Lagi
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-emerald-900 dark:text-emerald-100 text-lg font-medium leading-relaxed">
            "{insight}"
          </p>
        )}

        {data?.healthScore !== undefined && !isLoading && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs text-emerald-600 dark:text-emerald-400">
              Health Score:
            </span>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-16 bg-emerald-200 dark:bg-emerald-900/50 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    data.healthScore >= 80
                      ? "bg-emerald-500"
                      : data.healthScore >= 60
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  }`}
                  style={{ width: `${Math.min(data.healthScore, 100)}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                {data.healthScore}/100
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyInsight;

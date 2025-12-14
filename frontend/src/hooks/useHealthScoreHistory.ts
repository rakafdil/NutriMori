// hooks/useHealthScoreHistory.ts
import { useState, useEffect, useCallback } from "react";
import { habitInsightsService } from "@/services/habit-insight.service";
import { HealthScoreHistoryData, TrendType } from "@/types/habitInsights";

export const useHealthScoreHistory = (initialMonths: number = 6) => {
  const [data, setData] = useState<HealthScoreHistoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [months, setMonths] = useState<number>(initialMonths);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await habitInsightsService.getHealthScoreHistory(months);
      setData(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memuat riwayat health score"
      );
    } finally {
      setIsLoading(false);
    }
  }, [months]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Helper untuk mendapatkan trend keseluruhan
  const getOverallTrend = useCallback((): TrendType => {
    if (!data || data.history.length < 2) return "stable";
    const recentTrends = data.history.slice(-3).map((h) => h.trend);
    const increasingCount = recentTrends.filter(
      (t) => t === "increasing"
    ).length;
    const decreasingCount = recentTrends.filter(
      (t) => t === "decreasing"
    ).length;

    if (increasingCount > decreasingCount) return "increasing";
    if (decreasingCount > increasingCount) return "decreasing";
    return "stable";
  }, [data]);

  return {
    data,
    isLoading,
    error,
    months,
    setMonths,
    refetch: fetchHistory,
    overallTrend: getOverallTrend(),
  };
};

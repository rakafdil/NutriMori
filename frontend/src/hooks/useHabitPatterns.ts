// hooks/useHabitPatterns.ts
import { useState, useEffect, useCallback } from "react";
import { habitInsightsService } from "@/services/habit-insight.service";
import {
  PatternSummaryData,
  HabitInsightsPeriod,
  PatternType,
} from "@/types/habitInsights";

export const useHabitPatterns = (
  initialPeriod: HabitInsightsPeriod = "monthly"
) => {
  const [data, setData] = useState<PatternSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<HabitInsightsPeriod>(initialPeriod);

  const fetchPatterns = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await habitInsightsService.getPatternSummary(period);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat pola");
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchPatterns();
  }, [fetchPatterns]);

  // Helper untuk mendapatkan pola berdasarkan tipe
  const getPatternsByType = useCallback(
    (type: PatternType) => {
      return data?.patterns.filter((p) => p.type === type) || [];
    },
    [data]
  );

  return {
    data,
    isLoading,
    error,
    period,
    setPeriod,
    refetch: fetchPatterns,
    positivePatterns: getPatternsByType("positive"),
    negativePatterns: getPatternsByType("negative"),
    neutralPatterns: getPatternsByType("neutral"),
  };
};

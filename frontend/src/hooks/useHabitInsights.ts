// hooks/useHabitInsights.ts
import { useState, useEffect, useCallback } from "react";
import { habitInsightsService } from "@/services/habit-insight.service";
import {
  HabitInsightsResponse,
  HabitInsightsPeriod,
  HabitInsightsQueryParams,
} from "@/types/habitInsights";

export const useHabitInsights = (
  initialPeriod: HabitInsightsPeriod = "weekly"
) => {
  const [data, setData] = useState<HabitInsightsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<HabitInsightsPeriod>(initialPeriod);
  const [customDateRange, setCustomDateRange] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  const fetchInsights = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: HabitInsightsQueryParams = {
        period,
        ...customDateRange,
      };
      const response = await habitInsightsService.getHabitInsights(params);
      setData(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memuat habit insights"
      );
    } finally {
      setIsLoading(false);
    }
  }, [period, customDateRange]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const refreshInsights = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await habitInsightsService.refreshHabitInsights(period);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal refresh insights");
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  return {
    data,
    isLoading,
    error,
    period,
    setPeriod,
    customDateRange,
    setCustomDateRange,
    refetch: fetchInsights,
    refreshInsights,
  };
};

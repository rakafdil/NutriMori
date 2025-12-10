import { useState, useEffect, useCallback } from "react";
import { habitInsightsService } from "@/services/habit-insight.service";
import {
  HabitInsightsParams,
  HabitInsightsResponse,
  HabitInsightsPeriod,
} from "@/types/habitInsights";

interface UseHabitInsightsOptions {
  initialPeriod?: HabitInsightsPeriod;
  startDate?: string;
  endDate?: string;
}

interface UseHabitInsightsReturn {
  data: HabitInsightsResponse["data"] | null;
  isLoading: boolean;
  error: string | null;
  period: HabitInsightsPeriod;
  setPeriod: (period: HabitInsightsPeriod) => void;
  setDateRange: (startDate: string, endDate: string) => void;
  refetch: () => Promise<void>;
}

export const useHabitInsights = (
  options: UseHabitInsightsOptions = {}
): UseHabitInsightsReturn => {
  const { initialPeriod = "weekly", startDate, endDate } = options;

  const [data, setData] = useState<HabitInsightsResponse["data"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<HabitInsightsPeriod>(initialPeriod);
  const [dateRange, setDateRangeState] = useState<{
    startDate?: string;
    endDate?: string;
  }>({ startDate, endDate });

  // note: token reading removed — backend sets httpOnly cookie so frontend JS cannot read it.
  // habitInsightsService will use credentials: 'include' when no local token exists.

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: HabitInsightsParams = {
        period,
        ...dateRange,
      };

      // habitInsightsService will include cookies automatically if necessary
      const response = await habitInsightsService.getHabitInsights(params);

      if (response.success) {
        setData(response.data);
      } else {
        setError(response.message || "Failed to fetch habit insights");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [period, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const setDateRange = (startDate: string, endDate: string) => {
    setDateRangeState({ startDate, endDate });
  };

  return {
    data,
    isLoading,
    error,
    period,
    setPeriod,
    setDateRange,
    refetch: fetchData,
  };
};

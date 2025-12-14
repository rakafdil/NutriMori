// hooks/useHabitInsights.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { habitInsightsService } from "@/services/habit-insight.service";
import {
  HabitInsightsResponse,
  HabitInsightsPeriod,
  HabitInsightsQueryParams,
} from "@/types/habitInsights";
import { AUTH_STORAGE_KEY } from "@/config/apiConfig";

const CACHE_PREFIX = "habit_insights";

const buildCacheKey = (
  period: HabitInsightsPeriod,
  startDate?: string,
  endDate?: string
) => `${CACHE_PREFIX}:${period}:${startDate || ""}:${endDate || ""}`;

export const useHabitInsights = (
  initialPeriod: HabitInsightsPeriod = "weekly"
) => {
  const [data, setData] = useState<HabitInsightsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<HabitInsightsPeriod>(initialPeriod);
  const [customDateRange, setCustomDateRange] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  // Prevent duplicate fetches
  const isFetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);

  const clearAllLocal = useCallback(() => {
    if (typeof window === "undefined") return;
    localStorage.clear();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Clear if already logged out on mount
    if (!localStorage.getItem(AUTH_STORAGE_KEY)) {
      clearAllLocal();
    }
    const handleStorage = (e: StorageEvent) => {
      if (e.key === AUTH_STORAGE_KEY && !e.newValue) {
        clearAllLocal();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [clearAllLocal]);

  const fetchInsights = useCallback(
    async (skipCache = false) => {
      // Prevent duplicate fetches
      if (isFetchingRef.current) return;

      isFetchingRef.current = true;
      setIsLoading(true);
      setError(null);

      const normalizedPeriod = period.toLowerCase() as HabitInsightsPeriod;
      const cacheKey = buildCacheKey(
        normalizedPeriod,
        customDateRange.startDate,
        customDateRange.endDate
      );

      // Try cache first (unless skipCache is true)
      if (!skipCache && typeof window !== "undefined") {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached) as HabitInsightsResponse;
            setData(parsed);
            setIsLoading(false);
            isFetchingRef.current = false;
            return;
          } catch {
            localStorage.removeItem(cacheKey);
          }
        }
      }

      try {
        const params: HabitInsightsQueryParams = {
          period: normalizedPeriod,
          ...customDateRange,
        };
        const response = await habitInsightsService.getHabitInsights(params);
        setData(response);
        if (typeof window !== "undefined") {
          localStorage.setItem(cacheKey, JSON.stringify(response));
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Gagal memuat habit insights"
        );
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    },
    [period, customDateRange]
  );

  const refreshInsights = useCallback(async () => {
    const normalizedPeriod = period.toLowerCase() as HabitInsightsPeriod;
    const cacheKey = buildCacheKey(
      normalizedPeriod,
      customDateRange.startDate,
      customDateRange.endDate
    );

    if (typeof window !== "undefined") {
      localStorage.removeItem(cacheKey);
    }

    await fetchInsights(true);
  }, [period, customDateRange, fetchInsights]);

  // Initial fetch on mount and when period changes
  useEffect(() => {
    // Reset hasFetched when period changes
    hasFetchedRef.current = false;
  }, [period]);

  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchInsights();
    }
  }, [fetchInsights]);

  return {
    data,
    isLoading,
    error,
    period,
    setPeriod,
    customDateRange,
    setCustomDateRange,
    refetch: () => fetchInsights(false),
    refreshInsights,
  };
};

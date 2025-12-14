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
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const buildCacheKey = (
  period: HabitInsightsPeriod,
  startDate?: string,
  endDate?: string
) => `${CACHE_PREFIX}:${period}:${startDate || ""}:${endDate || ""}`;

interface CacheEntry {
  data: HabitInsightsResponse;
  timestamp: number;
}

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

  const mountedRef = useRef(true);
  const fetchIdRef = useRef(0);

  const clearAllLocal = useCallback(() => {
    if (typeof window === "undefined") return;
    // Only clear habit insights cache, not all localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    setData(null);
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
      const currentFetchId = ++fetchIdRef.current;
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
            const entry: CacheEntry = JSON.parse(cached);
            // Check if cache is still valid
            if (Date.now() - entry.timestamp < CACHE_TTL) {
              if (mountedRef.current && currentFetchId === fetchIdRef.current) {
                setData(entry.data);
                setIsLoading(false);
              }
              return;
            } else {
              localStorage.removeItem(cacheKey);
            }
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

        if (mountedRef.current && currentFetchId === fetchIdRef.current) {
          setData(response);
          if (typeof window !== "undefined") {
            const cacheEntry: CacheEntry = {
              data: response,
              timestamp: Date.now(),
            };
            localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
          }
        }
      } catch (err) {
        if (mountedRef.current && currentFetchId === fetchIdRef.current) {
          setError(
            err instanceof Error ? err.message : "Gagal memuat habit insights"
          );
        }
      } finally {
        if (mountedRef.current && currentFetchId === fetchIdRef.current) {
          setIsLoading(false);
        }
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

  // Fetch on mount and when period changes
  useEffect(() => {
    mountedRef.current = true;
    fetchInsights();
    return () => {
      mountedRef.current = false;
    };
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

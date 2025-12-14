import { useState, useCallback } from "react";
import { habitInsightsService } from "@/services/habit-insight.service";
import { HabitInsightsPeriod } from "@/types/habitInsights";

export const useHabitInsightsCache = () => {
  const [isInvalidating, setIsInvalidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invalidateCache = useCallback(
    async (period?: HabitInsightsPeriod): Promise<boolean> => {
      setIsInvalidating(true);
      setError(null);
      try {
        await habitInsightsService.invalidateCache(period);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal menghapus cache");
        return false;
      } finally {
        setIsInvalidating(false);
      }
    },
    []
  );

  const invalidateAllCache = useCallback(async (): Promise<boolean> => {
    return invalidateCache();
  }, [invalidateCache]);

  return {
    invalidateCache,
    invalidateAllCache,
    isInvalidating,
    error,
  };
};

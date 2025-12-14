import { useState, useEffect, useCallback, useRef } from "react";
import {
  FoodLogsService,
  CreateFoodLogDto,
  LogFoodInputDto,
  UpdateFoodLogDto,
  CreateFoodLogItemDto,
} from "@/services/food-logs.service";

// --- Tipe Data State ---
interface FetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ==========================================
// 1. QUERY HOOKS (GET DATA)
// ==========================================

/**
 * Hook untuk mengambil daftar Food Logs berdasarkan rentang tanggal
 */
export const useFoodLogsList = (
  startDate?: Date | string,
  endDate?: Date | string
) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const fetchIdRef = useRef(0);
  const isRefetchingRef = useRef(false);

  const fetchData = useCallback(
    async (isRefetch = false) => {
      // Prevent concurrent fetches
      if (isRefetchingRef.current && !isRefetch) {
        return;
      }

      const currentFetchId = ++fetchIdRef.current;

      if (!isRefetch) {
        setIsLoading(true);
      }
      isRefetchingRef.current = true;
      setError(null);

      try {
        const sDate =
          startDate instanceof Date ? startDate.toISOString() : startDate;
        const eDate = endDate instanceof Date ? endDate.toISOString() : endDate;

        const result = await FoodLogsService.findAll({
          startDate: sDate,
          endDate: eDate,
        });

        // Only update if this is the latest fetch and component is mounted
        if (mountedRef.current && currentFetchId === fetchIdRef.current) {
          setData(result);
          setError(null);
        }
      } catch (err: any) {
        if (mountedRef.current && currentFetchId === fetchIdRef.current) {
          setError(err.message || "Gagal mengambil data");
        }
      } finally {
        if (mountedRef.current && currentFetchId === fetchIdRef.current) {
          setIsLoading(false);
          isRefetchingRef.current = false;
        }
      }
    },
    [startDate, endDate]
  );

  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData(false);
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  return { data, isLoading, error, refetch };
};

/**
 * Hook untuk mengambil Summary Harian (Nutrisi, Kalori, dll)
 */
export const useDailySummary = (date?: Date | string) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const qDate = date instanceof Date ? date.toISOString() : date;
      const result = await FoodLogsService.getDailySummary(qDate);
      if (mountedRef.current) {
        setData(result);
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err.message || "Gagal mengambil summary harian");
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [date]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
};

/**
 * Hook untuk mengambil Streaks user
 */
export const useStreaks = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const fetchIdRef = useRef(0);

  const fetchData = useCallback(async () => {
    const currentFetchId = ++fetchIdRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const result = await FoodLogsService.getStreaks();
      if (mountedRef.current && currentFetchId === fetchIdRef.current) {
        setData(result);
      }
    } catch (err: any) {
      if (mountedRef.current && currentFetchId === fetchIdRef.current) {
        setError(err.message);
      }
    } finally {
      if (mountedRef.current && currentFetchId === fetchIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
};

// ==========================================
// 2. MUTATION HOOKS (ACTION DATA)
// ==========================================

/**
 * Hook untuk melakukan Create, Update, Delete Log
 */
export const useFoodLogActions = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startAction = () => {
    setIsSubmitting(true);
    setError(null);
  };

  const createLog = async (data: CreateFoodLogDto) => {
    startAction();
    try {
      const result = await FoodLogsService.create(data);
      setIsSubmitting(false);
      return { success: true, data: result };
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || "Gagal membuat log");
      return { success: false, error: err };
    }
  };

  const logFoodText = async (input: LogFoodInputDto) => {
    // Determine mealType based on current time and routine
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    let mealType: "breakfast" | "lunch" | "dinner" | "snack" = "snack";
    try {
      const preferences = JSON.parse(
        localStorage.getItem("nutrimori_preferences") || "{}"
      );
      const routine = preferences.routine;
      if (routine) {
        if (currentTime < routine.breakfast) {
          mealType = "breakfast";
        } else if (currentTime < routine.lunch) {
          mealType = "breakfast";
        } else if (currentTime < routine.dinner) {
          mealType = "lunch";
        } else {
          mealType = "dinner";
        }
      }
    } catch (error) {
      console.warn(
        "Failed to parse routine from localStorage, defaulting to snack:",
        error
      );
    }

    const updatedInput = { ...input, mealType };

    startAction();
    try {
      const result = await FoodLogsService.logFood(updatedInput);
      setIsSubmitting(false);
      return { success: true, data: result };
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || "Gagal logging food");
      return { success: false, error: err };
    }
  };

  const logFoodItem = async (input: CreateFoodLogItemDto) => {
    startAction();
    try {
      const result = await FoodLogsService.logFoodItem(input);
      setIsSubmitting(false);
      return { success: true, data: result };
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || "Gagal logging food item");
      return { success: false, error: err };
    }
  };

  const updateLog = async (id: string, data: UpdateFoodLogDto) => {
    startAction();
    try {
      const result = await FoodLogsService.update(id, data);
      setIsSubmitting(false);
      return { success: true, data: result };
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || "Gagal update log");
      return { success: false, error: err };
    }
  };

  const deleteLog = async (id: string) => {
    startAction();
    try {
      await FoodLogsService.remove(id);
      setIsSubmitting(false);
      return { success: true };
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || "Gagal menghapus log");
      return { success: false, error: err };
    }
  };

  const clearError = () => setError(null);

  return {
    createLog,
    logFoodText,
    logFoodItem,
    updateLog,
    deleteLog,
    isSubmitting,
    error,
    clearError,
  };
};

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
  const [data, setData] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    // Cancel any ongoing fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const sDate =
        startDate instanceof Date ? startDate.toISOString() : startDate;
      const eDate = endDate instanceof Date ? endDate.toISOString() : endDate;

      const result = await FoodLogsService.findAll({
        startDate: sDate,
        endDate: eDate,
      });

      if (mountedRef.current) {
        // Only update if we got valid data
        const validData = Array.isArray(result) ? result : [];
        setData(validData);
        setError(null);
        setIsLoading(false);
      }
    } catch (err: any) {
      if (mountedRef.current && err.name !== "AbortError") {
        setError(err.message || "Gagal mengambil data");
        setIsLoading(false);
        // Don't clear data on error - keep showing old data
      }
    }
  }, [startDate, endDate]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
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
        setData(result.logs);
        setIsLoading(false);
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err.message || "Gagal mengambil summary harian");
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

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await FoodLogsService.getStreaks();
      if (mountedRef.current) {
        setData(result);
        setIsLoading(false);
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err.message);
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

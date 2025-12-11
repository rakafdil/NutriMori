import { useState, useEffect, useCallback } from "react";
import {
  FoodLogsService,
  CreateFoodLogDto,
  LogFoodInputDto,
  UpdateFoodLogDto,
} from "@/services/food-logs.service"; // Sesuaikan path service Anda

// --- Tipe Data State ---
interface FetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
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
  const [state, setState] = useState<FetchState<any>>({
    data: null,
    isLoading: true,
    error: null,
    refetch: () => {},
  });

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const sDate =
        startDate instanceof Date ? startDate.toISOString() : startDate;
      const eDate = endDate instanceof Date ? endDate.toISOString() : endDate;

      const result = await FoodLogsService.findAll({
        startDate: sDate,
        endDate: eDate,
      });
      setState({
        data: result,
        isLoading: false,
        error: null,
        refetch: fetchData,
      });
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err.message || "Gagal mengambil data",
      }));
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return state;
};

/**
 * Hook untuk mengambil Summary Harian (Nutrisi, Kalori, dll)
 */
export const useDailySummary = (date?: Date | string) => {
  const [state, setState] = useState<FetchState<any>>({
    data: null,
    isLoading: true,
    error: null,
    refetch: () => {},
  });

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const qDate = date instanceof Date ? date.toISOString() : date;
      const result = await FoodLogsService.getDailySummary(qDate);
      setState({
        data: result,
        isLoading: false,
        error: null,
        refetch: fetchData,
      });
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err.message || "Gagal mengambil summary harian",
      }));
    }
  }, [date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return state;
};

/**
 * Hook untuk mengambil Streaks user
 */
export const useStreaks = () => {
  const [state, setState] = useState<FetchState<any>>({
    data: null,
    isLoading: true,
    error: null,
    refetch: () => {},
  });

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await FoodLogsService.getStreaks();
      setState({
        data: result,
        isLoading: false,
        error: null,
        refetch: fetchData,
      });
    } catch (err: any) {
      setState((prev) => ({ ...prev, isLoading: false, error: err.message }));
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return state;
};

// ==========================================
// 2. MUTATION HOOKS (ACTION DATA)
// ==========================================

/**
 * Hook untuk melakukan Create, Update, Delete Log
 * Mengembalikan status loading terpisah (isSubmitting) agar UI tidak freeze
 */
export const useFoodLogActions = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper untuk reset error sebelum request
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
    startAction();
    try {
      const result = await FoodLogsService.logFood(input);
      setIsSubmitting(false);
      return { success: true, data: result };
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || "Gagal logging food");
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

  return {
    createLog,
    logFoodText,
    updateLog,
    deleteLog,
    isSubmitting,
    error,
  };
};

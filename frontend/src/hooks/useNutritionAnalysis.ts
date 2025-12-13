import { useState, useCallback } from "react";
import nutritionAnalyzerService from "@/services/nutrition-analyzer.service";
import { NutritionAnalysisResponse } from "@/types/nutritionAnalyzer";

const ANALYSIS_STORAGE_KEY = "nutrimori_last_analysis";
const HISTORY_STORAGE_KEY = "nutrimori_analysis_history";

export const useNutritionAnalysis = () => {
  const [currentAnalysis, setCurrentAnalysis] =
    useState<NutritionAnalysisResponse | null>(null);
  const [history, setHistory] = useState<NutritionAnalysisResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Create new analysis
  const createAnalysis = useCallback(async (foodLogId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await nutritionAnalyzerService.createAnalysis({ foodLogId });

      if (data) {
        setCurrentAnalysis(data);
        // Cache the latest analysis
        localStorage.setItem(ANALYSIS_STORAGE_KEY, JSON.stringify(data));

        // Optimistically update history (add new one to top)
        setHistory((prev) => {
          const newHistory = [data, ...prev];
          localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
          return newHistory;
        });
      }
      return data;
    } catch (err) {
      const error =
        err instanceof Error
          ? err
          : new Error("Failed to create nutrition analysis");
      setError(error);
      console.error("Failed to create nutrition analysis:", err);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch specific analysis by Food Log ID
  const fetchAnalysisById = useCallback(
    async (foodLogId: string) => {
      setLoading(true);
      setError(null);
      try {
        // First check if it's already in history to save network call (Optional optimization)
        const cachedItem = history.find((item) => item.foodLogId === foodLogId);
        if (cachedItem) {
          setCurrentAnalysis(cachedItem);
          localStorage.setItem(
            ANALYSIS_STORAGE_KEY,
            JSON.stringify(cachedItem)
          );
          setLoading(false);
          return cachedItem;
        }

        const data = await nutritionAnalyzerService.getAnalysisByFoodLogId(
          foodLogId
        );
        if (data) {
          setCurrentAnalysis(data);
          localStorage.setItem(ANALYSIS_STORAGE_KEY, JSON.stringify(data));
        }
        return data;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to fetch analysis");
        setError(error);
        console.error("Failed to fetch analysis:", err);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [history]
  );

  // Fetch analysis history
  const fetchHistory = useCallback(async (limit: number = 10) => {
    setLoading(true);
    setError(null);
    try {
      const data = await nutritionAnalyzerService.getAnalysisHistory(limit);
      if (data) {
        setHistory(data);
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(data));
      }
      return data;
    } catch (err) {
      const error =
        err instanceof Error
          ? err
          : new Error("Failed to fetch analysis history");
      setError(error);
      console.error("Failed to fetch analysis history:", err);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data from localStorage (Cache)
  const loadFromCache = useCallback(() => {
    try {
      // Load last viewed analysis
      const storedAnalysis = localStorage.getItem(ANALYSIS_STORAGE_KEY);
      if (storedAnalysis) {
        const parsedAnalysis = JSON.parse(storedAnalysis);
        setCurrentAnalysis(parsedAnalysis);
      }

      // Load history
      const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory);
        setHistory(Array.isArray(parsedHistory) ? parsedHistory : []);
      }
    } catch (error) {
      console.error("Error parsing cached nutrition data", error);
    }
  }, []);

  // Clear current analysis (reset view)
  const clearCurrentAnalysis = useCallback(() => {
    setCurrentAnalysis(null);
    localStorage.removeItem(ANALYSIS_STORAGE_KEY);
  }, []);

  return {
    currentAnalysis,
    history,
    loading,
    error,
    createAnalysis,
    fetchAnalysisById,
    fetchHistory,
    loadFromCache,
    clearCurrentAnalysis,
  };
};

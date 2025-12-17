"use client";
import { useUser } from "@/context";
import {
  useDailySummary,
  useFoodLogActions,
  useFoodLogsList,
  useStreaks,
} from "@/hooks/useFoodLogs";
import { useNutritionAnalysis } from "@/hooks/useNutritionAnalysis";
import { useProfile } from "@/hooks/useProfile";
import { matchFoods, VerifiedFood } from "@/services/food-matcher.service";
import { MatchResult, Meal } from "@/types";
import {
  NutritionAnalysisResponse,
  NutritionFacts,
} from "@/types/nutritionAnalyzer";
import { AlertCircle } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import AddMealModal from "./AddMealModal";
import AnalysisResultCard from "./AnalysisResultCard";
import DailyInsight from "./DailyInsight";
import FoodVerificationModal from "./FoodVerificationModal";
import GreetingHeader from "./GreetingHeader";
import MealHistory from "./MealHistory";
import NutritionBreakdown from "./NutritionBreakdown";
import StatsCards from "./StatsCards";
import { useLimitIntakes } from "@/hooks/usePreferences";

// Flow steps
type FlowStep = "idle" | "input" | "verify" | "result";

// Helper to round numbers to avoid floating point precision issues
const roundTo2 = (val: number): number => Math.round(val * 100) / 100;

// Transform API log to Meal
const transformFoodLogToMeal = (log: any): Meal => {
  const nutrition: NutritionFacts = {
    items: [],
    calories: 0,
    protein: "0g",
    carbs: "0g",
    fat: "0g",
    sugar: "0g",
    fiber: "0g",
    sodium: "0mg",
    cholesterol: "0mg",
  };

  if (log.food_log_items && Array.isArray(log.food_log_items)) {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalSodium = 0;

    log.food_log_items.forEach((item: any) => {
      if (item.food_items?.food_nutrients) {
        const nutrients = item.food_items.food_nutrients;
        totalCalories += nutrients.calories || 0;
        totalProtein += parseFloat(nutrients.protein) || 0;
        totalCarbs += parseFloat(nutrients.carbs) || 0;
        totalFat += parseFloat(nutrients.fat) || 0;
        totalSodium += parseFloat(nutrients.sodium) || 0;
      }
    });

    nutrition.calories = roundTo2(totalCalories);
    nutrition.protein = `${roundTo2(totalProtein)}g`;
    nutrition.carbs = `${roundTo2(totalCarbs)}g`;
    nutrition.fat = `${roundTo2(totalFat)}g`;
    nutrition.sodium = `${roundTo2(totalSodium)}mg`;
  }

  return {
    id: log.log_id || log.id,
    name: log.raw_text || "Unknown meal",
    timestamp: new Date(log.created_at),
    nutrition,
    mealType: log.meal_type || "snack",
  };
};

// Helper function to validate UUID
const isValidUUID = (str: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

const DashboardContent: React.FC = () => {
  const { user, isLoading: isUserLoading } = useUser();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  // Flow states
  const [currentStep, setCurrentStep] = useState<FlowStep>("idle");
  const [isProcessing, setIsProcessing] = useState(false);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [analysisResult, setAnalysisResult] =
    useState<NutritionAnalysisResponse | null>(null);
  const [lastRawInput, setLastRawInput] = useState("");
  const [mealAnalyses, setMealAnalyses] = useState<
    Map<string, NutritionAnalysisResponse>
  >(new Map());

  const { fetchProfile } = useProfile();
  const isMountedRef = useRef(true);

  const {
    currentAnalysis,
    loading: analysisLoading,
    createAnalysis,
    fetchAnalysisById,
    loadFromCache,
  } = useNutritionAnalysis();

  const {
    fetchLimitIntakes,
    limitData,
    loading: limitLoading,
  } = useLimitIntakes();

  // Data hooks
  const {
    isLoading: isLoadingLogs,
    data: logsData,
    error: logsError,
    refetch: refetchLogs,
  } = useFoodLogsList();

  // const {
  //   isLoading: isLoadingLogsHistory,
  //   data: logsHistoryData,
  //   error: logsHistoryError,
  //   refetch: refetchLogsHistory,
  // } = useDailySummary();

  const {
    isLoading: isLoadingStreaks,
    data: streaksData,
    refetch: refetchStreaks,
  } = useStreaks();
  const { logFoodText, logFoodItem, isSubmitting, deleteLog, updateLog } =
    useFoodLogActions();

  useEffect(() => {
    isMountedRef.current = true;
    fetchProfile().catch(console.error);
    loadFromCache();
    fetchLimitIntakes();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Transform logs to meals when data changes
  useEffect(() => {
    if (logsData && Array.isArray(logsData) && isMountedRef.current) {
      const transformedMeals = logsData.map(transformFoodLogToMeal);
      setMeals(transformedMeals);
      setHasInitialLoad(true);
    } else if (logsData === null && !isLoadingLogs && !hasInitialLoad) {
      // Only set empty array on initial load if we explicitly got null/empty
      setMeals([]);
      setHasInitialLoad(true);
    }
  }, [logsData, isLoadingLogs, hasInitialLoad]);

  // Fetch analyses for meals - with debounce to prevent excessive calls
  const fetchAnalysesForMeals = useCallback(
    async (mealsList: Meal[]) => {
      if (!isMountedRef.current || mealsList.length === 0) return;

      const newAnalyses = new Map<string, NutritionAnalysisResponse>();

      // Fetch in parallel but limit concurrency
      const batchSize = 3;
      for (let i = 0; i < mealsList.length; i += batchSize) {
        const batch = mealsList.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map(async (meal) => {
            try {
              const analysis = await fetchAnalysisById(meal.id);
              if (analysis) {
                return { mealId: meal.id, analysis };
              }
            } catch (err) {
              console.warn(`Failed to fetch analysis for meal ${meal.id}`);
            }
            return null;
          })
        );

        results.forEach((result) => {
          if (result.status === "fulfilled" && result.value) {
            newAnalyses.set(result.value.mealId, result.value.analysis);
          }
        });
      }
      if (isMountedRef.current) {
        setMealAnalyses(newAnalyses);
      }
    },
    [fetchAnalysisById]
  );

  // Fetch analyses when meals change
  useEffect(() => {
    if (meals.length > 0) {
      fetchAnalysesForMeals(meals);
    }
  }, [meals.length]); // Only trigger when meal count changes

  // Apply analyses to meals
  const mealsWithAnalyses = React.useMemo(() => {
    return meals.map((meal) => {
      const analysis = mealAnalyses.get(meal.id);
      if (analysis) {
        return {
          ...meal,
          nutrition: {
            ...meal.nutrition,
            ...analysis.nutritionFacts,
          },
        };
      }
      return meal;
    });
  }, [meals, mealAnalyses]);

  const formatDateKey = (t: Date | string | number | undefined) => {
    if (!t) return "";
    const d = t instanceof Date ? t : new Date(t as any);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0]; // YYYY-MM-DD
  };

  const todayKey = new Date().toISOString().split("T")[0];

  const todayMeals = mealsWithAnalyses.filter(
    (m) => formatDateKey(m.timestamp) === todayKey
  );

  // Computed values
  const totalCals = todayMeals.reduce(
    (acc, m) => acc + (m.nutrition.calories ?? 0),
    0
  );

  // Handlers
  const handleOpenAddMeal = () => setCurrentStep("input");

  const handleAnalyze = async (input: string) => {
    setIsProcessing(true);
    setLastRawInput(input);
    try {
      const results = await matchFoods(input);
      setMatchResults(results);
      setCurrentStep("verify");
    } catch (err) {
      console.error("Failed to match foods:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = (meal: Meal) => {
    const newText = prompt("Edit meal name:", meal.name);
    if (newText && newText !== meal.name) {
      updateLog(meal.id, { raw_text: newText } as any).then((result) => {
        if (result.success) {
          refetchLogs();
        } else {
          console.error("Failed to update meal:", result.error);
        }
      });
    }
  };

  const handleDelete = async (mealId: string) => {
    const result = await deleteLog(mealId);
    if (result.success) {
      // Wait a bit for DB to sync then refetch
      await new Promise((resolve) => setTimeout(resolve, 300));
      await refetchLogs();
      await refetchStreaks();
    } else {
      console.error("Failed to delete meal:", result.error);
    }
  };

  const handleVerificationConfirm = async (verifiedFoods: VerifiedFood[]) => {
    setIsProcessing(true);
    setCurrentStep("idle");

    try {
      // Step 1: Create the food log
      const res = await logFoodText({ text: lastRawInput } as any);
      const logId = res?.data?.log_id;

      if (!logId) {
        throw new Error("Failed to create food log - no log ID returned");
      }

      console.log("LOG ID DARI BACKEND:", logId);

      // Step 2: Create food log items
      if (verifiedFoods.length > 0) {
        await Promise.all(
          verifiedFoods.map((v) => {
            const foodIdNum = Number(v.selectedFoodId);
            const payload: {
              logId: string;
              qty: number;
              unit: string;
              foodId?: number;
            } = {
              logId: String(logId),
              qty: Number(v.quantity),
              unit: v.unit || "porsi",
            };

            if (!isNaN(foodIdNum) && foodIdNum > 0) {
              payload.foodId = foodIdNum;
            }

            return logFoodItem(payload);
          })
        );
      }

      // Step 3: Longer delay to ensure DB consistency
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Step 4: Run analysis
      const analysis = await createAnalysis(logId);
      setAnalysisResult(analysis);

      // Step 5: Refetch data sequentially to avoid race conditions
      await refetchLogs();
      await refetchStreaks();

      setCurrentStep("result");
    } catch (err) {
      console.error("Failed to log food:", err);
      alert("Failed to save meal. Please try again.");
      // Refetch to ensure UI is in sync with server state
      await refetchLogs();
      await refetchStreaks();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseResult = () => {
    setAnalysisResult(null);
    setMatchResults([]);
    setCurrentStep("idle");
  };

  // Loading state - only show on initial load
  if (isLoadingLogs && !hasInitialLoad) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (logsError && !hasInitialLoad) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400">{logsError}</p>
          <button
            onClick={() => refetchLogs()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 pb-24 font-sans animate-fade-in">
      <GreetingHeader
        username={user?.username || "User"}
        onAddMeal={handleOpenAddMeal}
      />

      <StatsCards
        totalCalories={totalCals}
        caloriesTarget={limitData.max_calories}
        currentStreak={streaksData?.currentStreak || 0}
        longestStreak={streaksData?.longestStreak || 0}
        isLoadingStreaks={isLoadingStreaks}
      />

      <DailyInsight />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-up">
        <div className="lg:col-span-2">
          <MealHistory
            meals={mealsWithAnalyses}
            onAddMeal={handleOpenAddMeal}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isDisabled={isSubmitting || isProcessing}
          />
        </div>

        <div className="lg:col-span-1">
          {analysisResult && currentStep === "result" ? (
            <AnalysisResultCard
              analysis={analysisResult}
              onClose={handleCloseResult}
            />
          ) : (
            <NutritionBreakdown meals={todayMeals} limit={limitData} />
          )}
        </div>
      </div>

      {currentStep === "input" && (
        <AddMealModal
          onAnalyze={handleAnalyze}
          isAnalyzing={isProcessing}
          onClose={() => setCurrentStep("idle")}
        />
      )}

      {currentStep === "verify" && matchResults.length > 0 && (
        <FoodVerificationModal
          matchResults={matchResults}
          onConfirm={handleVerificationConfirm}
          onClose={() => setCurrentStep("idle")}
        />
      )}
    </div>
  );
};

export default DashboardContent;

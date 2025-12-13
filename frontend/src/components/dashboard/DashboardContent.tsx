"use client";
import React, { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { MatchResult, Meal, NutritionInfo } from "@/types";
import { useUser } from "@/context";
import {
  matchFoods,
  generateAnalysis,
  VerifiedFood,
  AnalysisResult,
} from "@/services/food-matcher.service";
import AddMealModal from "./AddMealModal";
import FoodVerificationModal from "./FoodVerificationModal";
import AnalysisResultCard from "./AnalysisResultCard";
import NutritionBreakdown from "./NutritionBreakdown";
import GreetingHeader from "./GreetingHeader";
import StatsCards from "./StatsCards";
import DailyInsight from "./DailyInsight";
import MealHistory from "./MealHistory";
import {
  useFoodLogsList,
  useStreaks,
  useFoodLogActions,
} from "@/hooks/useFoodLogs";
import { useProfile } from "@/hooks/useProfile";

// Flow steps
type FlowStep = "idle" | "input" | "verify" | "result";

// Transform API log to Meal
const transformFoodLogToMeal = (log: any): Meal => {
  const nutrition: NutritionInfo = {
    items: [],
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    sodium: "Normal",
  };

  if (log.food_log_items && Array.isArray(log.food_log_items)) {
    log.food_log_items.forEach((item: any) => {
      if (item.food_items?.food_nutrients) {
        const nutrients = item.food_items.food_nutrients;
        nutrition.calories += nutrients.calories || 0;
        nutrition.protein += nutrients.protein || 0;
        nutrition.carbs += nutrients.carbs || 0;
        nutrition.fats += nutrients.fats || 0;
        if (nutrients.sodium && nutrients.sodium > 500) {
          nutrition.sodium = "High";
        }
      }
    });
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
  const [dailyInsight, setDailyInsight] = useState(
    "Belum ada data makan hari ini. Yuk catat sarapanmu!"
  );

  // Flow states
  const [currentStep, setCurrentStep] = useState<FlowStep>("idle");
  const [isProcessing, setIsProcessing] = useState(false);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [lastRawInput, setLastRawInput] = useState("");

  const { fetchProfile } = useProfile();

  // Data hooks
  const {
    isLoading: isLoadingLogs,
    data: logsData,
    error: logsError,
    refetch: refetchLogs,
  } = useFoodLogsList();
  const { isLoading: isLoadingStreaks, data: streaksData } = useStreaks();
  const { logFoodText, logFoodItem, isSubmitting } = useFoodLogActions();

  useEffect(() => {
    fetchProfile().catch(console.error);
  }, []);

  useEffect(() => {
    if (logsData && Array.isArray(logsData)) {
      setMeals(logsData.map(transformFoodLogToMeal));
    }
  }, [logsData]);

  // Computed values
  const totalCals = meals.reduce(
    (acc, m) => acc + (m.nutrition.calories ?? 0),
    0
  );
  const totalSodium = meals.filter((m) => m.nutrition.sodium === "High").length;

  // Handlers
  const handleOpenAddMeal = () => setCurrentStep("input");

  const handleAnalyze = async (input: string) => {
    setIsProcessing(true);
    setLastRawInput(input);
    const results = await matchFoods(input);
    setMatchResults(results);
    setIsProcessing(false);
    setCurrentStep("verify");
  };

  const handleVerificationConfirm = async (verifiedFoods: VerifiedFood[]) => {
    setIsProcessing(true);
    setCurrentStep("idle");

    try {
      const analysis = await generateAnalysis(
        verifiedFoods,
        user?.id || "anonymous"
      );
      setAnalysisResult(analysis);

      const res = await logFoodText({ text: lastRawInput } as any);
      const logId = res?.data?.log_id;

      // Debugging: Pastikan logId muncul di console browser
      console.log("LOG ID DARI BACKEND:", logId);

      if (logId && verifiedFoods.length > 0) {
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

            // Only include foodId if it's a valid number
            if (!isNaN(foodIdNum) && foodIdNum > 0) {
              payload.foodId = foodIdNum;
            }

            return logFoodItem(payload);
          })
        );
      }

      const newMeal: Meal = {
        id: analysis.foodLogId,
        name: lastRawInput,
        timestamp: new Date(),
        nutrition: {
          items: verifiedFoods.map((f) => ({
            name: f.selectedName,
            quantity: f.quantity,
            unit: f.unit,
          })),
          calories: analysis.nutritionFacts.calories,
          protein: analysis.nutritionFacts.protein,
          carbs: analysis.nutritionFacts.carbs,
          fats: analysis.nutritionFacts.fat,
          sodium: analysis.nutritionFacts.sodium > 500 ? "High" : "Normal",
        },
      };
      setMeals((prev) => [newMeal, ...prev]);

      setIsProcessing(false);
      setCurrentStep("result");
      refetchLogs();
    } catch (err) {
      console.error("Failed to log food:", err);
      setIsProcessing(false);
      // optionally show an error UI / toast here
    }
  };

  const handleCloseResult = () => {
    setAnalysisResult(null);
    setMatchResults([]);
    setCurrentStep("idle");
  };

  if (isLoadingLogs) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (logsError) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400">{logsError}</p>
          <button
            onClick={refetchLogs}
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
      {/* Greeting */}
      <GreetingHeader
        // Karena user diambil langsung dari state awal, "User" hanya muncul jika localStorage kosong
        username={user?.username || "User"}
        onAddMeal={handleOpenAddMeal}
      />

      {/* Stats Cards */}
      <StatsCards
        totalCalories={totalCals}
        totalHighSodium={totalSodium}
        currentStreak={streaksData?.currentStreak || 0}
        longestStreak={streaksData?.longestStreak || 0}
        isLoadingStreaks={isLoadingStreaks}
      />

      {/* Insight */}
      <DailyInsight insight={dailyInsight} />

      {/* Meals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-up">
        <div className="lg:col-span-2">
          <MealHistory
            meals={meals}
            onAddMeal={handleOpenAddMeal}
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
            <NutritionBreakdown meals={meals} />
          )}
        </div>
      </div>

      {/* Modals */}
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

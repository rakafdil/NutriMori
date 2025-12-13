"use client";
import React, { useState, useEffect } from "react";
import {
  Plus,
  Flame,
  Droplets,
  UtensilsCrossed,
  AlertCircle,
  Zap,
  TrendingUp,
} from "lucide-react";
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
import MealCard from "./MealCard";
import NutritionBreakdown from "./NutritionBreakdown";
import {
  useFoodLogsList,
  useStreaks,
  useFoodLogActions,
} from "@/hooks/useFoodLogs";

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
  };
};

const DashboardContent: React.FC = () => {
  const { user } = useUser();
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

  // Data hooks
  const {
    isLoading: isLoadingLogs,
    data: logsData,
    error: logsError,
    refetch: refetchLogs,
  } = useFoodLogsList();
  const { isLoading: isLoadingStreaks, data: streaksData } = useStreaks();
  const { createLog, isSubmitting } = useFoodLogActions();

  useEffect(() => {
    if (logsData && Array.isArray(logsData)) {
      setMeals(logsData.map(transformFoodLogToMeal));
    }
  }, [logsData]);

  const totalCals = meals.reduce(
    (acc, m) => acc + (m.nutrition.calories ?? 0),
    0
  );
  const totalSodium = meals.filter((m) => m.nutrition.sodium === "High").length;

  // Step 1: User submits natural language input
  const handleAnalyze = async (input: string) => {
    setIsProcessing(true);
    setLastRawInput(input);
    const results = await matchFoods(input);
    setMatchResults(results);
    setIsProcessing(false);
    setCurrentStep("verify");
  };

  // Step 2: User confirms verified foods
  const handleVerificationConfirm = async (verifiedFoods: VerifiedFood[]) => {
    setIsProcessing(true);
    setCurrentStep("idle"); // close modal temporarily

    // Generate analysis
    const analysis = await generateAnalysis(
      verifiedFoods,
      user?.id || "anonymous"
    );
    setAnalysisResult(analysis);

    // Save to backend
    await createLog({ mealType: "snack", rawText: lastRawInput } as any);

    // Add to local meals
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
  };

  const handleCloseResult = () => {
    setAnalysisResult(null);
    setMatchResults([]);
    setCurrentStep("idle");
  };

  if (!user) return null;

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
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Selamat pagi, {user.username} 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Hari ini tubuhmu lagi butuh keseimbangan. Let's do this.
          </p>
        </div>
        <button
          onClick={() => setCurrentStep("input")}
          className="bg-gray-900 dark:bg-emerald-600 text-white p-4 rounded-full shadow-lg hover:bg-gray-800 dark:hover:bg-emerald-700 transition md:hidden"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Kalori */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-emerald-100 dark:border-gray-700 flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-bl-full -mr-2 -mt-2" />
          <div className="flex items-start justify-between relative z-10">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              Kalori Hari Ini
            </p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
              {totalCals}{" "}
              <span className="text-sm font-normal text-gray-400">/ 2200</span>
            </p>
          </div>
        </div>

        {/* Sodium */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-orange-100 dark:border-gray-700 flex flex-col justify-between h-32">
          <div className="flex items-start justify-between">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 rounded-lg">
              <Droplets className="w-5 h-5" />
            </div>
            {totalSodium > 1 && (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              Sodium Level
            </p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
              {totalSodium > 1 ? "High" : "Normal"}
            </p>
          </div>
        </div>

        {/* Streaks */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-blue-100 dark:border-gray-700 flex flex-col justify-between h-32">
          <div className="flex items-start justify-between">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            {streaksData?.currentStreak > 0 && (
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                🔥 {streaksData.currentStreak} days
              </span>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              Current Streak
            </p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
              {isLoadingStreaks ? "..." : streaksData?.currentStreak || 0}{" "}
              <span className="text-sm font-normal text-gray-400">
                / best: {streaksData?.longestStreak || 0}
              </span>
            </p>
          </div>
        </div>

        {/* AI Mood */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-800 p-5 rounded-2xl shadow-lg text-white flex flex-col justify-between h-32">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-300" />
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-100">
              AI Mood
            </span>
          </div>
          <p className="text-sm font-medium leading-tight">
            {streaksData?.currentStreak >= 7
              ? "🔥 Amazing! 7+ hari berturut-turut!"
              : streaksData?.currentStreak >= 3
              ? "👍 Great progress!"
              : "💪 Start your streak today!"}
          </p>
        </div>
      </div>

      {/* Insight */}
      <div className="bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50 p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-200/20 dark:bg-emerald-500/10 rounded-full blur-2xl"></div>
        <h3 className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold mb-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          Insight Today
        </h3>
        <p className="text-emerald-900 dark:text-emerald-100 text-lg font-medium">
          "{dailyInsight}"
        </p>
      </div>

      {/* Meals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800 dark:text-white text-lg">
              Riwayat Makan
            </h3>
            <button
              onClick={() => setCurrentStep("input")}
              disabled={isSubmitting || isProcessing}
              className="hidden md:flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/30 px-3 py-1 rounded-lg transition disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> Log Meal
            </button>
          </div>

          {meals.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
              <UtensilsCrossed className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 dark:text-gray-500">
                Belum ada makanan dicatat.
              </p>
              <button
                onClick={() => setCurrentStep("input")}
                className="mt-2 text-emerald-600 dark:text-emerald-400 font-semibold"
              >
                Catat sekarang
              </button>
            </div>
          ) : (
            meals.map((meal) => <MealCard key={meal.id} meal={meal} />)
          )}
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

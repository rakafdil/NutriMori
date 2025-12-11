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
import { Meal, NutritionInfo } from "@/types";
import { useUser } from "@/context";
import {
  analyzeMealDescription,
  generateDailyInsight,
} from "@/services/geminiService";
import AddMealModal from "./AddMealModal";
import MealCard from "./MealCard";
import NutritionBreakdown from "./NutritionBreakdown";
import {
  useFoodLogsList,
  useDailySummary,
  useStreaks,
  useFoodLogActions,
} from "@/hooks/useFoodLogs";

// Helper function to transform API data to Meal format
const transformFoodLogToMeal = (log: any): Meal => {
  // Calculate nutrition from food_log_items if available
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
  const [mealInput, setMealInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dailyInsight, setDailyInsight] = useState<string>(
    "Analyzing your day..."
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [analyzedData, setAnalyzedData] = useState<NutritionInfo | null>(null);

  // Hooks for fetching data
  const {
    isLoading: isLoadingLogs,
    data: logsData,
    error: logsError,
    refetch: refetchLogs,
  } = useFoodLogsList();

  const {
    isLoading: isLoadingStreaks,
    data: streaksData,
    error: streaksError,
  } = useStreaks();

  const { isLoading: isLoadingSummary, data: summaryData } = useDailySummary();

  const { createLog, isSubmitting } = useFoodLogActions();

  // Transform and set meals when data is fetched
  useEffect(() => {
    if (logsData && Array.isArray(logsData)) {
      const transformedMeals = logsData.map(transformFoodLogToMeal);
      setMeals(transformedMeals);
    }
  }, [logsData]);

  // Calculate totals from meals
  const totalCals = meals.reduce(
    (acc, m) => acc + (m.nutrition.calories ?? 0),
    0
  );
  const totalSodium = meals.filter((m) => m.nutrition.sodium === "High").length;

  useEffect(() => {
    if (meals.length > 0) {
      // generateDailyInsight(meals).then(setDailyInsight);
    } else {
      setDailyInsight("Belum ada data makan hari ini. Yuk catat sarapanmu!");
    }
  }, [meals]);

  const handleAnalyze = async () => {
    if (!mealInput) return;
    setIsAnalyzing(true);
    const data = await analyzeMealDescription(mealInput);
    setAnalyzedData(data);
    setIsAnalyzing(false);
  };

  const handleSaveMeal = async () => {
    if (analyzedData && mealInput) {
      // Save to backend
      const result = await createLog({
        mealType: "snack", // You can make this dynamic
        rawText: mealInput,
      } as any);

      if (result.success) {
        // Add to local state optimistically
        const newMeal: Meal = {
          id: result.data?.log_id || Date.now().toString(),
          name: mealInput,
          timestamp: new Date(),
          nutrition: analyzedData,
        };
        setMeals((prev) => [newMeal, ...prev]);

        // Refetch to sync with server
        refetchLogs();
      }

      setMealInput("");
      setAnalyzedData(null);
      setShowAddModal(false);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setMealInput("");
    setAnalyzedData(null);
  };

  if (!user) return null;

  // Loading state
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

  // Error state
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
      {/* Top Section: Greeting */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Selamat pagi, {user.name} 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Hari ini tubuhmu lagi butuh keseimbangan. Let's do this.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gray-900 dark:bg-emerald-600 text-white p-4 rounded-full shadow-lg hover:bg-gray-800 dark:hover:bg-emerald-700 transition md:hidden"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Daily Snapshots */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Kalori Card */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-emerald-100 dark:border-gray-700 flex flex-col justify-between h-32 relative overflow-hidden group transition-colors">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-bl-full -mr-2 -mt-2 transition-transform group-hover:scale-110" />
          <div className="flex items-start justify-between relative z-10">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Flame className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full">
              +12%
            </span>
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

        {/* Sodium Level Card */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-orange-100 dark:border-gray-700 flex flex-col justify-between h-32 transition-colors">
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

        {/* Streaks Card - Updated to use streaksData */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-blue-100 dark:border-gray-700 flex flex-col justify-between h-32 transition-colors">
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

        {/* AI Mood Card */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-800 p-5 rounded-2xl shadow-lg text-white flex flex-col justify-between h-32">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-300" />
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-100">
              AI Mood
            </span>
          </div>
          <p className="text-sm font-medium leading-tight">
            {streaksData?.currentStreak >= 7
              ? "🔥 Amazing! 7+ hari berturut-turut! Keep it up!"
              : streaksData?.currentStreak >= 3
              ? "👍 Great progress! Consistency is key!"
              : "💪 Start your streak today!"}
          </p>
        </div>
      </div>

      {/* AI Insight Section */}
      <div className="bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50 p-6 rounded-3xl relative overflow-hidden transition-colors">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-200/20 dark:bg-emerald-500/10 rounded-full blur-2xl"></div>
        <h3 className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold mb-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          Insight Today
        </h3>
        <p className="text-emerald-900 dark:text-emerald-100 text-lg md:text-xl font-medium leading-relaxed">
          "{dailyInsight}"
        </p>
      </div>

      {/* Meals and Nutrition */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800 dark:text-white text-lg">
              Riwayat Makan
            </h3>
            <button
              onClick={() => setShowAddModal(true)}
              disabled={isSubmitting}
              className="hidden md:flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/30 px-3 py-1 rounded-lg transition disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> Log Meal
            </button>
          </div>

          {meals.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 transition-colors">
              <UtensilsCrossed className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 dark:text-gray-500">
                Belum ada makanan dicatat.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
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
          <NutritionBreakdown meals={meals} />
        </div>
      </div>

      {/* Add Meal Modal */}
      {showAddModal && (
        <AddMealModal
          mealInput={mealInput}
          setMealInput={setMealInput}
          isAnalyzing={isAnalyzing || isSubmitting}
          analyzedData={analyzedData}
          setAnalyzedData={setAnalyzedData}
          onAnalyze={handleAnalyze}
          onSave={handleSaveMeal}
          onClose={() => setShowAddModal(false)}
          onReset={handleCloseModal}
        />
      )}
    </div>
  );
};

export default DashboardContent;

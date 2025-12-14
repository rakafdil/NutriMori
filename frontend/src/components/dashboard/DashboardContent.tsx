"use client";
import React, { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { MatchResult, Meal } from "@/types";
import { useUser } from "@/context";
import { matchFoods, VerifiedFood } from "@/services/food-matcher.service";
import { useNutritionAnalysis } from "@/hooks/useNutritionAnalysis";
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
import {
  NutritionAnalysisResponse,
  NutritionFacts,
} from "@/types/nutritionAnalyzer";

// Flow steps
type FlowStep = "idle" | "input" | "verify" | "result";

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

    nutrition.calories = totalCalories;
    nutrition.protein = `${totalProtein}g`;
    nutrition.carbs = `${totalCarbs}g`;
    nutrition.fat = `${totalFat}g`;
    nutrition.sodium = `${totalSodium}mg`;
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

  // Flow states
  const [currentStep, setCurrentStep] = useState<FlowStep>("idle");
  const [isProcessing, setIsProcessing] = useState(false);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [analysisResult, setAnalysisResult] =
    useState<NutritionAnalysisResponse | null>(null);
  const [lastRawInput, setLastRawInput] = useState("");
  const [mealAnalyses, setMealAnalyses] = useState<
    { mealId: string; analysis: NutritionAnalysisResponse }[]
  >([]);
  const [analysesApplied, setAnalysesApplied] = useState(false);

  const { fetchProfile } = useProfile();

  const {
    currentAnalysis,
    history,
    loading,
    error,
    createAnalysis,
    fetchAnalysisById,
    fetchHistory,
    loadFromCache,
    clearCurrentAnalysis,
  } = useNutritionAnalysis();
  // Data hooks
  const {
    isLoading: isLoadingLogs,
    data: logsData,
    error: logsError,
    refetch: refetchLogs,
  } = useFoodLogsList();
  const { isLoading: isLoadingStreaks, data: streaksData } = useStreaks();
  const { logFoodText, logFoodItem, isSubmitting, deleteLog, updateLog } =
    useFoodLogActions();

  useEffect(() => {
    fetchProfile().catch(console.error);
  }, []);

  useEffect(() => {
    if (logsData && Array.isArray(logsData)) {
      setMeals(logsData.map(transformFoodLogToMeal));
      setAnalysesApplied(false); // Reset when logs change
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
  useEffect(() => {
    if (!analysesApplied && mealAnalyses.length > 0) {
      setMeals((prevMeals) =>
        prevMeals.map((meal) => {
          const analysis = mealAnalyses.find(
            (a) => a.mealId === meal.id
          )?.analysis;
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
        })
      );
      setAnalysesApplied(true);
    }
  }, [mealAnalyses, analysesApplied]);
  useEffect(() => {
    const fetchAllAnalyses = async () => {
      const analyses: {
        mealId: string;
        analysis: NutritionAnalysisResponse;
      }[] = [];
      for (const meal of meals) {
        try {
          const analysis = await fetchAnalysisById(meal.id);
          if (analysis) {
            analyses.push({ mealId: meal.id, analysis });
          }
        } catch (err) {
          console.error(`Failed to fetch analysis for meal ${meal.id}:`, err);
        }
      }
      setMealAnalyses(analyses);
    };

    if (meals.length > 0) {
      fetchAllAnalyses();
    }
  }, [meals, fetchAnalysisById]);

  // useEffect(() => {
  //   if (mealAnalyses.length > 0) {
  //     setMeals((prevMeals) =>
  //       prevMeals.map((meal) => {
  //         const analysis = mealAnalyses.find(
  //           (a) => a.mealId === meal.id
  //         )?.analysis;
  //         if (analysis) {
  //           return {
  //             ...meal,
  //             nutrition: {
  //               ...meal.nutrition,
  //               ...analysis.nutritionFacts, // Update nutrition dengan data analisis
  //             },
  //           };
  //         }
  //         return meal;
  //       })
  //     );
  //   }
  // }, [mealAnalyses]);

  const handleAnalyze = async (input: string) => {
    setIsProcessing(true);
    setLastRawInput(input);
    const results = await matchFoods(input);
    setMatchResults(results);
    setIsProcessing(false);
    setCurrentStep("verify");
  };

  // Tambahkan handleEdit dan handleDelete
  const handleEdit = (meal: Meal) => {
    // Placeholder: Implement edit logic, e.g., open edit modal
    console.log("Edit meal:", meal);
    // TODO: Open edit modal or navigate to edit page
    // Contoh sederhana: prompt untuk text baru, lalu update
    const newText = prompt("Edit meal name:", meal.name);
    if (newText && newText !== meal.name) {
      // Asumsikan update hanya text, sesuaikan dengan UpdateFoodLogDto
      updateLog(meal.id, { raw_text: newText } as any).then((result) => {
        if (result.success) {
          refetchLogs(); // Refresh data setelah update
        } else {
          console.error("Failed to update meal:", result.error);
        }
      });
    }
  };

  const handleDelete = async (mealId: string) => {
    const result = await deleteLog(mealId);
    if (result.success) {
      refetchLogs(); // Refresh data setelah delete
    } else {
      console.error("Failed to delete meal:", result.error);
      // TODO: Show error toast or alert
    }
  };

  const handleVerificationConfirm = async (verifiedFoods: VerifiedFood[]) => {
    setIsProcessing(true);
    setCurrentStep("idle");

    try {
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

      // Now run analysis after all items have been logged
      const analysis = await createAnalysis(logId);
      setAnalysisResult(analysis);

      const newMeal: Meal = {
        id: analysis?.foodLogId ?? String(logId ?? "unknown"),
        name: lastRawInput,
        timestamp: new Date(),
        nutrition: {
          items: verifiedFoods.map((f) => ({
            name: f.selectedName,
            quantity: f.quantity,
            unit: f.unit,
          })),
          calories: analysis?.nutritionFacts.calories || 0,
          protein: analysis?.nutritionFacts.protein || "0g",
          carbs: analysis?.nutritionFacts.carbs || "0g",
          fat: analysis?.nutritionFacts.fat || "0g",
          sugar: analysis?.nutritionFacts.sugar || "0g",
          fiber: analysis?.nutritionFacts.fiber || "0g",
          sodium: analysis?.nutritionFacts.sodium || "0mg",
          cholesterol: analysis?.nutritionFacts.cholesterol || "0mg",
        },
      };
      setMeals((prev) => [newMeal, ...prev]);

      setIsProcessing(false);
      setCurrentStep("result");
      refetchLogs();
    } catch (err) {
      console.error("Failed to log food:", err);
      setIsProcessing(false);
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
      <DailyInsight />

      {/* Meals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-up">
        <div className="lg:col-span-2">
          <MealHistory
            meals={meals}
            onAddMeal={handleOpenAddMeal}
            onEdit={handleEdit} // Pass handleEdit
            onDelete={handleDelete} // Pass handleDelete
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

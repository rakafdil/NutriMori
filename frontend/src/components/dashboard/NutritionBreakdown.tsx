"use client";
import React from "react";
import { Meal } from "@/types";

interface NutritionBreakdownProps {
  meals: Meal[];
}

const NutritionBreakdown: React.FC<NutritionBreakdownProps> = ({ meals }) => {
  const totalProtein = meals.reduce(
    (a, b) => a + (b.nutrition?.protein ?? 0),
    0
  );
  const totalCarbs = meals.reduce((a, b) => a + (b.nutrition?.carbs ?? 0), 0);
  const totalFats = meals.reduce((a, b) => a + (b.nutrition?.fats ?? 0), 0);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 h-full transition-colors">
      <h3 className="font-bold text-gray-800 dark:text-white mb-4">
        Nutrition Breakdown
      </h3>
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Protein</span>
            <span className="font-bold text-gray-800 dark:text-gray-200">
              {totalProtein}g
            </span>
          </div>
          <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 w-[60%]"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Carbs</span>
            <span className="font-bold text-gray-800 dark:text-gray-200">
              {totalCarbs}g
            </span>
          </div>
          <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 w-[45%]"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Fat</span>
            <span className="font-bold text-gray-800 dark:text-gray-200">
              {totalFats}g
            </span>
          </div>
          <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-500 w-[30%]"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NutritionBreakdown;

"use client";
import { Meal } from "@/types";
import React from "react";

interface NutritionBreakdownProps {
  meals: Meal[];
}

const parseNumeric = (v: any): number => {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

// Helper to round numbers to avoid floating point precision issues
const roundTo2 = (val: number): number => Math.round(val * 100) / 100;

const NutritionBreakdown: React.FC<NutritionBreakdownProps> = ({ meals }) => {
  const totalCalories = meals.reduce(
    (a, b) => a + parseNumeric(b.nutrition?.calories),
    0
  );
  const totalProtein = meals.reduce(
    (a, b) => a + parseNumeric(b.nutrition?.protein),
    0
  );
  const totalCarbs = meals.reduce(
    (a, b) => a + parseNumeric(b.nutrition?.carbs),
    0
  );
  const totalFats = meals.reduce(
    (a, b) => a + parseNumeric(b.nutrition?.fat),
    0
  );
  const totalFiber = meals.reduce(
    (a, b) => a + parseNumeric(b.nutrition?.fiber),
    0
  );
  const totalSugar = meals.reduce(
    (a, b) => a + parseNumeric(b.nutrition?.sugar),
    0
  );

  // Contoh persentase berdasarkan rekomendasi harian (sesuaikan dengan kebutuhan)
  const proteinPercent = Math.min((totalProtein / 50) * 100, 100); // Asumsi 50g/hari
  const carbsPercent = Math.min((totalCarbs / 300) * 100, 100); // Asumsi 300g/hari
  const fatPercent = Math.min((totalFats / 70) * 100, 100); // Asumsi 70g/hari

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 h-full transition-colors">
      <h3 className="font-bold text-gray-800 dark:text-white mb-4">
        Nutrition Breakdown
      </h3>
      <div className="space-y-4">
        {/* Calories */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Calories</span>
            <span className="font-bold text-gray-800 dark:text-gray-200">
              {roundTo2(totalCalories)} kcal
            </span>
          </div>
          <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{
                width: `${Math.min((totalCalories / 2000) * 100, 100)}%`,
              }} // Asumsi 2000 kcal/hari
            ></div>
          </div>
        </div>
        {/* Protein */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Protein</span>
            <span className="font-bold text-gray-800 dark:text-gray-200">
              {roundTo2(totalProtein)}g
            </span>
          </div>
          <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${proteinPercent}%` }}
            ></div>
          </div>
        </div>
        {/* Carbs */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Carbs</span>
            <span className="font-bold text-gray-800 dark:text-gray-200">
              {roundTo2(totalCarbs)}g
            </span>
          </div>
          <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 transition-all duration-300"
              style={{ width: `${carbsPercent}%` }}
            ></div>
          </div>
        </div>
        {/* Fat */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Fat</span>
            <span className="font-bold text-gray-800 dark:text-gray-200">
              {roundTo2(totalFats)}g
            </span>
          </div>
          <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-500 transition-all duration-300"
              style={{ width: `${fatPercent}%` }}
            ></div>
          </div>
        </div>
        {/* Fiber */}
        {totalFiber > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Fiber</span>
              <span className="font-bold text-gray-800 dark:text-gray-200">
                {roundTo2(totalFiber)}g
              </span>
            </div>
            <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all duration-300"
                style={{ width: `${Math.min((totalFiber / 25) * 100, 100)}%` }} // Asumsi 25g/hari
              ></div>
            </div>
          </div>
        )}
        {/* Sugar */}
        {totalSugar > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Sugar</span>
              <span className="font-bold text-gray-800 dark:text-gray-200">
                {roundTo2(totalSugar)}g
              </span>
            </div>
            <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all duration-300"
                style={{ width: `${Math.min((totalSugar / 50) * 100, 100)}%` }} // Asumsi 50g/hari
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
// ...existing code...

export default NutritionBreakdown;

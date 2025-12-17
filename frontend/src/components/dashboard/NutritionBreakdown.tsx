"use client";
import { Meal } from "@/types";
import { LimitIntakes } from "@/types/user";
import React from "react";

interface NutritionBreakdownProps {
  meals: Meal[];
  limit: LimitIntakes;
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

const roundTo2 = (val: number): number => Math.round(val * 100) / 100;

const NutritionBreakdown: React.FC<NutritionBreakdownProps> = ({
  meals,
  limit,
}) => {
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

  const caloriesPercent = Math.min(
    (totalCalories / limit.max_calories) * 100,
    100
  );
  const proteinPercent = Math.min(
    (totalProtein / limit.max_protein) * 100,
    100
  );
  const carbsPercent = Math.min((totalCarbs / limit.max_carbs) * 100, 100);
  const fatPercent = Math.min((totalFats / limit.max_fat) * 100, 100);
  const fiberPercent = Math.min((totalFiber / limit.max_fiber) * 100, 100);
  const sugarPercent = Math.min((totalSugar / limit.max_sugar) * 100, 100);

  const clampPos = (p: number) => `${Math.min(Math.max(p, 2), 98)}%`;

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

          {/* outer wrapper (no overflow-hidden) so tooltip is not clipped */}
          <div className="relative group">
            <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${caloriesPercent}%` }}
                title={`${roundTo2(caloriesPercent)}%`}
              />
            </div>

            <div
              className="absolute -top-7 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-gray-900 text-white px-2 py-1 rounded pointer-events-none z-10"
              style={{ left: `calc(${clampPos(caloriesPercent)} - 16px)` }}
            >
              {roundTo2(caloriesPercent)}%
            </div>
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

          <div className="relative group">
            <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${proteinPercent}%` }}
                title={`${roundTo2(proteinPercent)}%`}
              />
            </div>

            <div
              className="absolute -top-7 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-gray-900 text-white px-2 py-1 rounded pointer-events-none z-10"
              style={{ left: `calc(${clampPos(proteinPercent)} - 16px)` }}
            >
              {roundTo2(proteinPercent)}%
            </div>
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

          <div className="relative group">
            <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 transition-all duration-300"
                style={{ width: `${carbsPercent}%` }}
                title={`${roundTo2(carbsPercent)}%`}
              />
            </div>

            <div
              className="absolute -top-7 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-gray-900 text-white px-2 py-1 rounded pointer-events-none z-10"
              style={{ left: `calc(${clampPos(carbsPercent)} - 16px)` }}
            >
              {roundTo2(carbsPercent)}%
            </div>
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

          <div className="relative group">
            <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-500 transition-all duration-300"
                style={{ width: `${fatPercent}%` }}
                title={`${roundTo2(fatPercent)}%`}
              />
            </div>

            <div
              className="absolute -top-7 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-gray-900 text-white px-2 py-1 rounded pointer-events-none z-10"
              style={{ left: `calc(${clampPos(fatPercent)} - 16px)` }}
            >
              {roundTo2(fatPercent)}%
            </div>
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

            <div className="relative group">
              <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all duration-300"
                  style={{ width: `${fiberPercent}%` }}
                  title={`${roundTo2(fiberPercent)}%`}
                />
              </div>

              <div
                className="absolute -top-7 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-gray-900 text-white px-2 py-1 rounded pointer-events-none z-10"
                style={{ left: `calc(${clampPos(fiberPercent)} - 16px)` }}
              >
                {roundTo2(fiberPercent)}%
              </div>
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

            <div className="relative group">
              <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-300"
                  style={{ width: `${sugarPercent}%` }}
                  title={`${roundTo2(sugarPercent)}%`}
                />
              </div>

              <div
                className="absolute -top-7 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-gray-900 text-white px-2 py-1 rounded pointer-events-none z-10"
                style={{ left: `calc(${clampPos(sugarPercent)} - 16px)` }}
              >
                {roundTo2(sugarPercent)}%
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default NutritionBreakdown;

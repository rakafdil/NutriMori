"use client";
import { Meal } from "@/types";
import { LimitIntakes } from "@/types/user";
import React from "react";

interface NutritionBreakdownProps {
  meals: Meal[];
  limit: LimitIntakes;
}

const parseNumeric = (v: unknown): number => {
  const n =
    typeof v === "number"
      ? v
      : typeof v === "string"
      ? parseFloat(v.replace(/[^\d.-]/g, ""))
      : 0;

  return Number.isFinite(n) ? n : 0;
};

const round2 = (n: number) => Math.round(n * 100) / 100;
const clampPercent = (p: number) => Math.min(Math.max(p, 2), 98);

const NutritionBreakdown: React.FC<NutritionBreakdownProps> = ({
  meals,
  limit,
}) => {
  const totals = meals.reduce(
    (acc, m) => {
      const n = m.nutrition;
      acc.calories += parseNumeric(n?.calories);
      acc.protein += parseNumeric(n?.protein);
      acc.carbs += parseNumeric(n?.carbs);
      acc.fat += parseNumeric(n?.fat);
      acc.fiber += parseNumeric(n?.fiber);
      acc.sugar += parseNumeric(n?.sugar);
      return acc;
    },
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
    }
  );

  const nutrients = [
    {
      key: "calories",
      label: "Calories",
      unit: "kcal",
      color: "bg-green-500",
      limit: limit.max_calories,
    },
    {
      key: "protein",
      label: "Protein",
      unit: "g",
      color: "bg-blue-500",
      limit: limit.max_protein,
    },
    {
      key: "carbs",
      label: "Carbs",
      unit: "g",
      color: "bg-orange-500",
      limit: limit.max_carbs,
    },
    {
      key: "fat",
      label: "Fat",
      unit: "g",
      color: "bg-yellow-500",
      limit: limit.max_fat,
    },
    {
      key: "fiber",
      label: "Fiber",
      unit: "g",
      color: "bg-purple-500",
      limit: limit.max_fiber,
    },
    {
      key: "sugar",
      label: "Sugar",
      unit: "g",
      color: "bg-red-500",
      limit: limit.max_sugar,
    },
  ] as const;

  const clampPos = (p: number) => `${Math.min(Math.max(p, 2), 98)}%`;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <h3 className="font-bold text-gray-800 dark:text-white mb-4">
        Nutrition Breakdown
      </h3>
      <div className="space-y-4">
        {nutrients.map(({ key, label, unit, color, limit }) => {
          const value = totals[key];

          const percent = Math.min((value / limit) * 100, 100);
          const percentFull = (value / limit) * 100;

          return (
            <div key={key} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span
                  className={`${
                    percent >= 100
                      ? "text-red-500 dark:text-red-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {label}
                </span>
                <span
                  className={`font-bold ${
                    percent >= 100
                      ? "text-red-800 dark:text-red-200"
                      : "text-gray-800 dark:text-gray-200"
                  }`}
                >
                  {round2(value)}
                  {unit}
                </span>
              </div>

              <div className="relative group">
                <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} transition-all duration-300`}
                    style={{ width: `${percent}%` }}
                    title={`${round2(percent)}%`}
                  />
                </div>

                <div
                  className={`absolute -top-7 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-gray-900 ${
                    percentFull > 100 ? "text-red-600" : "text-white"
                  } px-2 py-1 rounded pointer-events-none z-10`}
                  style={{ left: `calc(${clampPercent(percentFull)}% - 16px)` }}
                >
                  {round2(percentFull)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default NutritionBreakdown;

"use client";
import React from "react";
import { Meal } from "@/types";

interface MealCardProps {
  meal: Meal;
}

const MealCard: React.FC<MealCardProps> = ({ meal }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between hover:shadow-md transition">
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg
            ${
              meal.nutrition.healthScore === "Green"
                ? "bg-green-100 dark:bg-green-900/30"
                : meal.nutrition.healthScore === "Yellow"
                ? "bg-yellow-100 dark:bg-yellow-900/30"
                : "bg-red-100 dark:bg-red-900/30"
            }
          `}
        >
          {meal.nutrition.healthScore === "Green"
            ? "🥗"
            : meal.nutrition.healthScore === "Yellow"
            ? "🍛"
            : "🍔"}
        </div>
        <div>
          <h4 className="font-bold text-gray-800 dark:text-gray-100">
            {meal.name}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {meal.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            • {meal.nutrition.summary}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-gray-800 dark:text-gray-100">
          {meal.nutrition.calories} kcal
        </p>
        <p
          className={`text-xs font-medium ${
            meal.nutrition.sodium === "High"
              ? "text-red-500 dark:text-red-400"
              : "text-emerald-500 dark:text-emerald-400"
          }`}
        >
          {meal.nutrition.sodium} Sodium
        </p>
      </div>
    </div>
  );
};

export default MealCard;

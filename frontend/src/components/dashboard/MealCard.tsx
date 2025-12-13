"use client";
import React from "react";
import { Clock, Flame } from "lucide-react";
import { Meal } from "@/types";

interface MealCardProps {
  meal: Meal;
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const MealCard: React.FC<MealCardProps> = ({ meal }) => {
  const { name, timestamp, nutrition } = meal;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800 dark:text-white">
            {name}
          </h4>
          <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
            <Clock className="w-3 h-3" />
            {formatTime(timestamp)}
          </div>
        </div>
        <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-lg">
          <Flame className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
            {nutrition.calories} kcal
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs text-center">
        <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded-lg">
          <p className="font-semibold text-gray-700 dark:text-gray-300">
            {nutrition.protein}g
          </p>
          <p className="text-gray-400">Protein</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded-lg">
          <p className="font-semibold text-gray-700 dark:text-gray-300">
            {nutrition.carbs}g
          </p>
          <p className="text-gray-400">Karbo</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded-lg">
          <p className="font-semibold text-gray-700 dark:text-gray-300">
            {nutrition.fats}g
          </p>
          <p className="text-gray-400">Lemak</p>
        </div>
      </div>

      {nutrition.sodium === "High" && (
        <div className="mt-2 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded inline-block">
          ⚠️ Sodium tinggi
        </div>
      )}
    </div>
  );
};

export default MealCard;

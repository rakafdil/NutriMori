"use client";
import React from "react";
import { Flame, Droplets, AlertCircle, Zap, TrendingUp } from "lucide-react";

interface StatsCardsProps {
  totalCalories: number;
  caloriesTarget?: number;
  totalHighSodium: number;
  currentStreak: number;
  longestStreak: number;
  isLoadingStreaks: boolean;
}

const StatsCards: React.FC<StatsCardsProps> = ({
  totalCalories,
  caloriesTarget = 2200,
  totalHighSodium,
  currentStreak,
  longestStreak,
  isLoadingStreaks,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            {totalCalories}{" "}
            <span className="text-sm font-normal text-gray-400">
              / {caloriesTarget}
            </span>
          </p>
        </div>
      </div>

      {/* Sodium */}
      {/* <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-orange-100 dark:border-gray-700 flex flex-col justify-between h-32">
        <div className="flex items-start justify-between">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 rounded-lg">
            <Droplets className="w-5 h-5" />
          </div>
          {totalHighSodium > 1 && (
            <AlertCircle className="w-4 h-4 text-red-500" />
          )}
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Sodium Level
          </p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">
            {totalHighSodium > 1 ? "High" : "Normal"}
          </p>
        </div>
      </div> */}

      {/* Streaks */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-blue-100 dark:border-gray-700 flex flex-col justify-between h-32">
        <div className="flex items-start justify-between">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg">
            <TrendingUp className="w-5 h-5" />
          </div>
          {currentStreak > 0 && (
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
              🔥 {currentStreak} days
            </span>
          )}
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Current Streak
          </p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">
            {isLoadingStreaks ? "..." : currentStreak}{" "}
            <span className="text-sm font-normal text-gray-400">
              / best: {longestStreak}
            </span>
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-800 p-5 rounded-2xl shadow-lg text-white flex flex-col gap-4 h-32 justify-center hover:scale-105 transition-all duration-300 cursor-pointer group">
        <p
          className={`text-2xl font-medium leading-tight group-hover:text-yellow-100 transition-colors duration-300 ${
            currentStreak >= 7 ? "animate-pulse" : ""
          }`}
        >
          {currentStreak >= 7
            ? "🔥 Amazing! 7+ hari berturut-turut!"
            : currentStreak >= 3
            ? "👍 Great progress!"
            : "💪 Start your streak today!"}
        </p>
      </div>
    </div>
  );
};

export default StatsCards;

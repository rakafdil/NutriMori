"use client";
import React from "react";

interface MealSlot {
  slot: number;
  calories: number;
}

interface DayMealTiming {
  day: number;
  dayName: string;
  slots: MealSlot[];
}

interface MealTimingHeatmapProps {
  data: DayMealTiming[];
}

const EMPTY_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MealTimingHeatmap: React.FC<MealTimingHeatmapProps> = ({ data }) => {
  const maxCalories =
    data.length > 0
      ? Math.max(...data.flatMap((d) => d.slots.map((s) => s.calories)))
      : 0;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h3 className="font-bold text-gray-700 dark:text-gray-200">
            Meal Timing Heatmap
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Kapan kamu biasanya makan kalori terbesar.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 h-32">
        {data.length > 0
          ? data.map((dayData, i) => (
              <div key={i} className="flex flex-col gap-1 h-full">
                {dayData.slots.map((slot, j) => {
                  const opacity =
                    maxCalories > 0 ? slot.calories / maxCalories : 0.1;
                  return (
                    <div
                      key={j}
                      className="flex-1 rounded-sm bg-emerald-500 transition-all hover:scale-105 cursor-pointer"
                      style={{ opacity: opacity < 0.1 ? 0.1 : opacity }}
                      title={`${dayData.dayName}, Slot ${slot.slot}: ${slot.calories} kcal`}
                    />
                  );
                })}
              </div>
            ))
          : [...Array(7)].map((_, i) => (
              <div key={i} className="flex flex-col gap-1 h-full">
                {[...Array(5)].map((_, j) => (
                  <div
                    key={j}
                    className="flex-1 rounded-sm bg-gray-200 dark:bg-gray-700"
                  />
                ))}
              </div>
            ))}
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-2">
        {data.length > 0
          ? data.map((day) => <span key={day.day}>{day.dayName}</span>)
          : EMPTY_DAYS.map((day) => <span key={day}>{day}</span>)}
      </div>
    </div>
  );
};

export default MealTimingHeatmap;

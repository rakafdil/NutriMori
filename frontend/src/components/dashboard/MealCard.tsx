"use client";
import React, { useState } from "react";
import { Clock, Flame, Edit, Trash2, X } from "lucide-react";
import { Meal } from "@/types";

interface MealCardProps {
  meal: Meal;
  onEdit?: (meal: Meal) => void;
  onDelete?: (mealId: string) => void;
}

const formatTime = (date: Date): string => {
  return date
    .toLocaleString("id-ID", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(",", " •");
};

const MealCard: React.FC<MealCardProps> = ({ meal, onEdit, onDelete }) => {
  const { id, name, timestamp, nutrition } = meal;
  const [isFlipped, setIsFlipped] = useState(false);

  const handleEdit = () => onEdit && onEdit(meal);
  const handleDelete = () => onDelete && onDelete(String(id));

  const ts = timestamp instanceof Date ? timestamp : new Date(timestamp as any);

  return (
    <div className="relative w-full" style={{ perspective: 1000 }}>
      <div
        onClick={() => setIsFlipped((s) => !s)}
        className="cursor-pointer"
        aria-pressed={isFlipped}
      >
        <div
          style={{
            transformStyle: "preserve-3d",
            transition: "transform 500ms",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
          className="relative"
        >
          {/* Front */}
          <div
            className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 dark:text-white">
                  {name}
                </h4>
                <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(ts)}
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
                  {nutrition.fat}g
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

          {/* Back */}
          <div
            className="absolute inset-0 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center"
            style={{
              transform: "rotateY(180deg)",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            <div className="mb-3 text-center">
              <h4 className="font-semibold text-gray-800 dark:text-white">
                {name}
              </h4>
              <p className="text-xs text-gray-400 mt-1">{formatTime(ts)}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit();
                }}
                className="px-3 py-2 bg-emerald-600 text-white rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition"
              >
                <Edit className="w-4 h-4" /> Edit
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="px-3 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2 hover:bg-red-700 transition"
              >
                <Trash2 className="w-4 h-4" /> Hapus
              </button>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsFlipped(false);
              }}
              className="mt-3 p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-900 transition"
              aria-label="Close actions"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealCard;

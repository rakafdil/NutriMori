"use client";
import React from "react";
import { Zap } from "lucide-react";
import { NutritionInfo } from "@/types";

interface AddMealModalProps {
  mealInput: string;
  setMealInput: (value: string) => void;
  isAnalyzing: boolean;
  analyzedData: NutritionInfo | null;
  onAnalyze: () => void;
  onSave: () => void;
  onClose: () => void;
  onReset: () => void;
}

const AddMealModal: React.FC<AddMealModalProps> = ({
  mealInput,
  setMealInput,
  isAnalyzing,
  analyzedData,
  onAnalyze,
  onSave,
  onClose,
  onReset,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 dark:bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-fade-in-up border dark:border-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold dark:text-white">Catat Makanan</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <textarea
          className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 min-h-[100px] focus:outline-emerald-500 mb-4 dark:text-white"
          placeholder="Contoh: Nasi goreng ayam dengan telur mata sapi dan kerupuk..."
          value={mealInput}
          onChange={(e) => setMealInput(e.target.value)}
        />

        {!analyzedData ? (
          <button
            onClick={onAnalyze}
            disabled={isAnalyzing || !mealInput}
            className="w-full bg-black dark:bg-emerald-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-emerald-700 disabled:opacity-50 transition"
          >
            {isAnalyzing ? (
              <>
                Analyzing <span className="animate-spin">⏳</span>
              </>
            ) : (
              <>
                Analyze with AI <Zap className="w-4 h-4 text-yellow-400" />
              </>
            )}
          </button>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50 p-4 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-emerald-900 dark:text-emerald-300 text-lg">
                  {analyzedData.calories} kcal
                </span>
                <span
                  className={`px-2 py-1 rounded text-xs font-bold ${
                    analyzedData.healthScore === "Green"
                      ? "bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : analyzedData.healthScore === "Yellow"
                      ? "bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      : "bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}
                >
                  {analyzedData.healthScore === "Green"
                    ? "Healthy Choice"
                    : "Consume Moderately"}
                </span>
              </div>
              <p className="text-sm text-emerald-800 dark:text-emerald-300 mb-3">
                {analyzedData.summary}
              </p>
              <div className="grid grid-cols-3 gap-2 text-center text-xs text-gray-600 dark:text-gray-300">
                <div className="bg-white dark:bg-gray-800 p-2 rounded">
                  Prot: {analyzedData.protein}g
                </div>
                <div className="bg-white dark:bg-gray-800 p-2 rounded">
                  Carb: {analyzedData.carbs}g
                </div>
                <div className="bg-white dark:bg-gray-800 p-2 rounded">
                  Fat: {analyzedData.fats}g
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onReset}
                className="flex-1 py-3 text-gray-500 dark:text-gray-400 font-medium"
              >
                Reset
              </button>
              <button
                onClick={onSave}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none"
              >
                Save Meal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddMealModal;

"use client";
import React from "react";
import { AlertTriangle, CheckCircle, Flame, Zap } from "lucide-react";
import { NutritionAnalysisResponse } from "@/types/nutritionAnalyzer";

interface AnalysisResultCardProps {
  analysis: NutritionAnalysisResponse;
  onClose: () => void;
}

const AnalysisResultCard: React.FC<AnalysisResultCardProps> = ({
  analysis,
  onClose,
}) => {
  const {
    nutritionFacts,
    micronutrients,
    healthTags,
    warnings = [],
    analysisNotes,
  } = analysis;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold dark:text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" /> Hasil Analisis
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          ✕
        </button>
      </div>

      {/* Main nutrition */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-xl text-center">
          <Flame className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
            {nutritionFacts.calories}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">kcal</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-xl text-center">
          <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
            {nutritionFacts.protein}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Protein</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/30 p-3 rounded-xl text-center">
          <p className="text-xl font-bold text-orange-700 dark:text-orange-300">
            {nutritionFacts.carbs}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Karbo</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-xl text-center">
          <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
            {nutritionFacts.fat}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Lemak</p>
        </div>
      </div>

      {/* Additional nutrition */}
      <div className="grid grid-cols-4 gap-2 text-xs text-center mb-4">
        <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded-lg">
          <p className="font-semibold dark:text-white">
            {nutritionFacts.fiber}
          </p>
          <p className="text-gray-400">Serat</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded-lg">
          <p className="font-semibold dark:text-white">
            {nutritionFacts.sugar}
          </p>
          <p className="text-gray-400">Gula</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded-lg">
          <p className="font-semibold dark:text-white">
            {nutritionFacts.sodium}
          </p>
          <p className="text-gray-400">Sodium</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded-lg">
          <p className="font-semibold dark:text-white">
            {nutritionFacts.cholesterol}
          </p>
          <p className="text-gray-400">Kolesterol</p>
        </div>
      </div>

      {/* Micronutrients */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
          Mikronutrien
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(micronutrients).map(([key, value]) => (
            <span
              key={key}
              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs dark:text-gray-300"
            >
              {key.replace("_", " ")}: {value}
            </span>
          ))}
        </div>
      </div>

      {/* Health tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {healthTags.map((tag) => (
          <span
            key={tag}
            className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-medium"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Warnings */}
      {warnings && warnings.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">
          {warnings.map((w, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm"
            >
              <AlertTriangle className="w-4 h-4" />
              {w}
            </div>
          ))}
        </div>
      )}

      {analysisNotes && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
          {analysisNotes}
        </p>
      )}
    </div>
  );
};

export default AnalysisResultCard;

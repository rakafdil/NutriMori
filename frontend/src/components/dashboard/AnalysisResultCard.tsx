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

  // Helper to check if value is empty or zero
  const isEmptyOrZero = (value: string | number | undefined) => {
    if (value === undefined || value === null) return true;
    if (typeof value === "string")
      return (
        value.trim() === "" ||
        value === "0" ||
        value === "0g" ||
        value === "0mg"
      );
    if (typeof value === "number") return value === 0;
    return false;
  };

  // Helper to format numeric values to 2 decimal places, handling units
  const formatValue = (value: string | number | undefined) => {
    if (typeof value === "number") {
      return value.toFixed(2);
    }
    if (typeof value === "string") {
      const match = value.match(/^(\d+(\.\d+)?)(.*)$/);
      if (match) {
        const num = parseFloat(match[1]);
        if (!isNaN(num)) {
          return num.toFixed(2) + match[3];
        }
      }
    }
    return value;
  };

  // Helper to get display value with appropriate unit
  const getDisplayValue = (
    label: string,
    value: string | number | undefined
  ) => {
    const formatted = formatValue(value);
    if (label === "Serat" || label === "Gula") {
      return formatted + "g";
    }
    if (label === "Sodium" || label === "Kolesterol") {
      return formatted + "mg";
    }
    return formatted;
  };

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

      {/* Main nutrition - tampilkan jika ada nilai */}
      {(nutritionFacts.calories ||
        nutritionFacts.protein ||
        nutritionFacts.carbs ||
        nutritionFacts.fat) && (
        <div className="grid grid-cols-4 gap-3 mb-4">
          {nutritionFacts.calories && (
            <div className="bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-xl text-center">
              <Flame className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                {formatValue(nutritionFacts.calories)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">kcal</p>
            </div>
          )}
          {!isEmptyOrZero(nutritionFacts.protein) && (
            <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-xl text-center">
              <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                {formatValue(nutritionFacts.protein)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Protein
              </p>
            </div>
          )}
          {!isEmptyOrZero(nutritionFacts.carbs) && (
            <div className="bg-orange-50 dark:bg-orange-900/30 p-3 rounded-xl text-center">
              <p className="text-xl font-bold text-orange-700 dark:text-orange-300">
                {formatValue(nutritionFacts.carbs)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Karbo</p>
            </div>
          )}
          {!isEmptyOrZero(nutritionFacts.fat) && (
            <div className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-xl text-center">
              <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
                {formatValue(nutritionFacts.fat)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Lemak</p>
            </div>
          )}
        </div>
      )}

      {/* Additional nutrition - tampilkan jika ada nilai */}
      {(() => {
        const additionalItems = [
          { label: "Serat", value: nutritionFacts.fiber },
          { label: "Gula", value: nutritionFacts.sugar },
          { label: "Sodium", value: nutritionFacts.sodium },
          { label: "Kolesterol", value: nutritionFacts.cholesterol },
        ].filter((item) => !isEmptyOrZero(item.value));

        return additionalItems.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-4">
            {additionalItems.map((item) => (
              <div
                key={item.label}
                className="bg-gray-50 dark:bg-gray-900 p-2 rounded-lg flex-1 min-w-0 text-center"
              >
                <p className="font-semibold dark:text-white text-xs">
                  {getDisplayValue(item.label, item.value)}
                </p>
                <p className="text-gray-400 text-xs">{item.label}</p>
              </div>
            ))}
          </div>
        ) : null;
      })()}

      {/* Micronutrients - tampilkan jika ada */}
      {Object.keys(micronutrients).length > 0 && (
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
                {key.replace("_", " ")}: {formatValue(value)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Health tags - tampilkan jika ada */}
      {healthTags.length > 0 && (
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
      )}

      {/* Warnings - tampilkan jika ada */}
      {warnings.length > 0 && (
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

      {/* Analysis notes - tampilkan jika ada */}
      {analysisNotes && analysisNotes.trim() !== "" && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
          {analysisNotes}
        </p>
      )}
    </div>
  );
};

export default AnalysisResultCard;

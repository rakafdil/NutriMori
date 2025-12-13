"use client";
import React from "react";
import { Search, Calendar, UtensilsCrossed, X } from "lucide-react";

export interface MealFiltersState {
  searchQuery: string;
  selectedDate: string;
  selectedMealType: string;
}

interface MealFiltersProps {
  filters: MealFiltersState;
  onSearchChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onMealTypeChange: (value: string) => void;
  onClearFilters: () => void;
}

const MEAL_TYPES = [
  { value: "all", label: "Semua Jenis" },
  { value: "breakfast", label: "Sarapan" },
  { value: "lunch", label: "Makan Siang" },
  { value: "dinner", label: "Makan Malam" },
  { value: "snack", label: "Snack" },
];

const MealFilters: React.FC<MealFiltersProps> = ({
  filters,
  onSearchChange,
  onDateChange,
  onMealTypeChange,
  onClearFilters,
}) => {
  const { searchQuery, selectedDate, selectedMealType } = filters;
  const hasActiveFilters =
    searchQuery || selectedDate || selectedMealType !== "all";

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-700 dark:text-gray-300">
          Filter Riwayat
        </h4>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Reset Filter
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama makanan..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Date Filter */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Meal Type Filter */}
        <div className="relative">
          <UtensilsCrossed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={selectedMealType}
            onChange={(e) => onMealTypeChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none cursor-pointer"
          >
            {MEAL_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filters Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2">
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-full text-xs">
              <Search className="w-3 h-3" />"{searchQuery}"
              <button onClick={() => onSearchChange("")}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedDate && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-full text-xs">
              <Calendar className="w-3 h-3" />
              {new Date(selectedDate).toLocaleDateString("id-ID")}
              <button onClick={() => onDateChange("")}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedMealType !== "all" && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400 rounded-full text-xs">
              <UtensilsCrossed className="w-3 h-3" />
              {MEAL_TYPES.find((t) => t.value === selectedMealType)?.label}
              <button onClick={() => onMealTypeChange("all")}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default MealFilters;

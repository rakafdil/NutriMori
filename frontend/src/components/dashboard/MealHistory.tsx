"use client";
import React, { useState, useMemo } from "react";
import { Plus, Filter, UtensilsCrossed } from "lucide-react";
import { Meal } from "@/types";
import MealCard from "./MealCard";
import MealFilters, { MealFiltersState } from "./MealFilters";

interface MealHistoryProps {
  meals: Meal[];
  onAddMeal: () => void;
  isDisabled?: boolean;
}

const MealHistory: React.FC<MealHistoryProps> = ({
  meals,
  onAddMeal,
  isDisabled = false,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<MealFiltersState>({
    searchQuery: "",
    selectedDate: "",
    selectedMealType: "all",
  });

  const hasActiveFilters =
    filters.searchQuery ||
    filters.selectedDate ||
    filters.selectedMealType !== "all";

  const filteredMeals = useMemo(() => {
    return meals.filter((meal) => {
      // Filter by search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        if (!meal.name.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Filter by date
      if (filters.selectedDate) {
        const mealDate = new Date(meal.timestamp).toISOString().split("T")[0];
        if (mealDate !== filters.selectedDate) {
          return false;
        }
      }

      // Filter by meal type
      if (filters.selectedMealType !== "all") {
        if ((meal as any).mealType !== filters.selectedMealType) {
          return false;
        }
      }

      return true;
    });
  }, [meals, filters]);

  const clearFilters = () => {
    setFilters({
      searchQuery: "",
      selectedDate: "",
      selectedMealType: "all",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800 dark:text-white text-lg">
          Riwayat Makan
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition ${
              showFilters || hasActiveFilters
                ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filter</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            )}
          </button>
          <button
            onClick={onAddMeal}
            disabled={isDisabled}
            className="hidden md:flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/30 px-3 py-1 rounded-lg transition disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Log Meal
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <MealFilters
          filters={filters}
          onSearchChange={(value) =>
            setFilters((prev) => ({ ...prev, searchQuery: value }))
          }
          onDateChange={(value) =>
            setFilters((prev) => ({ ...prev, selectedDate: value }))
          }
          onMealTypeChange={(value) =>
            setFilters((prev) => ({ ...prev, selectedMealType: value }))
          }
          onClearFilters={clearFilters}
        />
      )}

      {/* Results Count */}
      {hasActiveFilters && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Menampilkan {filteredMeals.length} dari {meals.length} data
        </p>
      )}

      {/* Meal List */}
      {filteredMeals.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
          <UtensilsCrossed className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 dark:text-gray-500">
            {hasActiveFilters
              ? "Tidak ada data yang sesuai filter."
              : "Belum ada makanan dicatat."}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={clearFilters}
              className="mt-2 text-emerald-600 dark:text-emerald-400 font-semibold"
            >
              Reset Filter
            </button>
          ) : (
            <button
              onClick={onAddMeal}
              className="mt-2 text-emerald-600 dark:text-emerald-400 font-semibold"
            >
              Catat sekarang
            </button>
          )}
        </div>
      ) : (
        filteredMeals.map((meal) => <MealCard key={meal.id} meal={meal} />)
      )}
    </div>
  );
};

export default MealHistory;

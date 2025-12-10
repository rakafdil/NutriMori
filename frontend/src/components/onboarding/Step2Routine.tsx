import React, { useState } from "react";
import { Clock, Wallet, DollarSign } from "lucide-react";
import { PreferencesData } from "@/hooks/usePreferences";
interface Step2Props {
  preferencesData: PreferencesData;
  setPreferencesData: React.Dispatch<React.SetStateAction<PreferencesData>>;
}

export const Step2Routine: React.FC<Step2Props> = ({
  preferencesData,
  setPreferencesData,
}) => {
  const [hasBreakfast, setHasBreakfast] = useState(
    !!preferencesData.routine.breakfast
  );
  const [hasLunch, setHasLunch] = useState(!!preferencesData.routine.lunch);
  const [hasDinner, setHasDinner] = useState(!!preferencesData.routine.dinner);

  const handleMealToggle = (
    meal: "breakfast" | "lunch" | "dinner",
    enabled: boolean
  ) => {
    setPreferencesData((prev) => ({
      ...prev,
      routine: {
        ...prev.routine,
        [meal]: enabled ? prev.routine[meal] || "07:00" : "",
      },
    }));

    if (meal === "breakfast") setHasBreakfast(enabled);
    if (meal === "lunch") setHasLunch(enabled);
    if (meal === "dinner") setHasDinner(enabled);
  };

  const handleTimeChange = (
    meal: "breakfast" | "lunch" | "dinner",
    time: string
  ) => {
    setPreferencesData((prev) => ({
      ...prev,
      routine: {
        ...prev.routine,
        [meal]: time,
      },
    }));
  };

  const handleBudgetChange = (value: number) => {
    setPreferencesData((prev) => ({
      ...prev,
      budget: value,
    }));
  };

  return (
    <div className="flex-1 animate-fade-in">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Kebiasaan harian.
      </h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        Biar AI bisa kasih saran di waktu yang tepat.
      </p>

      <div className="space-y-6">
        <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-2xl border dark:border-gray-700">
          <h3 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-white mb-4">
            <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />{" "}
            Jam Makan
          </h3>
          <div className="space-y-4">
            {/* Breakfast */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer min-w-[120px]">
                <input
                  type="checkbox"
                  checked={hasBreakfast}
                  onChange={(e) =>
                    handleMealToggle("breakfast", e.target.checked)
                  }
                  className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Breakfast
                </span>
              </label>
              {hasBreakfast && (
                <input
                  type="time"
                  value={preferencesData.routine.breakfast || "07:00"}
                  onChange={(e) =>
                    handleTimeChange("breakfast", e.target.value)
                  }
                  className="flex-1 p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
              )}
            </div>

            {/* Lunch */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer min-w-[120px]">
                <input
                  type="checkbox"
                  checked={hasLunch}
                  onChange={(e) => handleMealToggle("lunch", e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Lunch
                </span>
              </label>
              {hasLunch && (
                <input
                  type="time"
                  value={preferencesData.routine.lunch || "12:00"}
                  onChange={(e) => handleTimeChange("lunch", e.target.value)}
                  className="flex-1 p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
              )}
            </div>

            {/* Dinner */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer min-w-[120px]">
                <input
                  type="checkbox"
                  checked={hasDinner}
                  onChange={(e) => handleMealToggle("dinner", e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Dinner
                </span>
              </label>
              {hasDinner && (
                <input
                  type="time"
                  value={preferencesData.routine.dinner || "19:00"}
                  onChange={(e) => handleTimeChange("dinner", e.target.value)}
                  className="flex-1 p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-2xl border dark:border-gray-700">
          <h3 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-white mb-4">
            <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />{" "}
            Budget Harian
          </h3>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Rp {(preferencesData.budget || 50000).toLocaleString("id-ID")}
              </span>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <DollarSign className="w-3 h-3" />
                <span>per hari</span>
              </div>
            </div>
            <input
              type="range"
              min="10000"
              max="200000"
              step="5000"
              value={preferencesData.budget || 50000}
              onChange={(e) => handleBudgetChange(Number(e.target.value))}
              className="w-full accent-emerald-600 h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
              <span>Rp 10k</span>
              <span>Rp 100k</span>
              <span>Rp 200k</span>
            </div>
          </div>

          {/* Budget presets */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleBudgetChange(25000)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                preferencesData.budget === 25000
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-2 border-emerald-500"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              Hemat (25k)
            </button>
            <button
              onClick={() => handleBudgetChange(75000)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                preferencesData.budget === 75000
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-2 border-emerald-500"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              Moderate (75k)
            </button>
            <button
              onClick={() => handleBudgetChange(150000)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                preferencesData.budget === 150000
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-2 border-emerald-500"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              Sultan (150k)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from "react";
import {
  Heart,
  Edit2,
  ChevronUp,
  AlertTriangle,
  Target,
  Clock,
  DollarSign,
  Save,
  Loader2,
} from "lucide-react";
import ChipSelector from "./ChipSelector";
import SummaryChips from "./SummaryChips";

interface PreferencesData {
  preferences: string[];
  allergies: string[];
  goals: string[];
  medicalHistory: string[];
  routine: {
    breakfast: string;
    lunch: string;
    dinner: string;
  };
  budget: number;
}

interface PreferencesSectionProps {
  preferencesData: PreferencesData;
  setPreferencesData: React.Dispatch<React.SetStateAction<PreferencesData>>;
  isEditingPreferences: boolean;
  setIsEditingPreferences: React.Dispatch<React.SetStateAction<boolean>>;
  isSavingPreferences: boolean;
  handleSavePreferences: () => void;
  toggleSelection: (
    key: "preferences" | "allergies" | "goals" | "medicalHistory",
    value: string
  ) => void;
  customTaste: string;
  setCustomTaste: React.Dispatch<React.SetStateAction<string>>;
  customAllergy: string;
  setCustomAllergy: React.Dispatch<React.SetStateAction<string>>;
  customGoal: string;
  setCustomGoal: React.Dispatch<React.SetStateAction<string>>;
  customMedical: string;
  setCustomMedical: React.Dispatch<React.SetStateAction<string>>;
  addCustomItem: (
    key: "preferences" | "allergies" | "goals" | "medicalHistory",
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => void;
  tasteOptions: string[];
  allergyOptions: string[];
  goalOptions: string[];
  medicalOptions: string[];
}

const PreferencesSection: React.FC<PreferencesSectionProps> = ({
  preferencesData,
  setPreferencesData,
  isEditingPreferences,
  setIsEditingPreferences,
  isSavingPreferences,
  handleSavePreferences,
  toggleSelection,
  customTaste,
  setCustomTaste,
  customAllergy,
  setCustomAllergy,
  customGoal,
  setCustomGoal,
  customMedical,
  setCustomMedical,
  addCustomItem,
  tasteOptions,
  allergyOptions,
  goalOptions,
  medicalOptions,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Heart className="w-5 h-5 text-emerald-500" /> Preferences
        </h3>
        <button
          onClick={() => setIsEditingPreferences(!isEditingPreferences)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-600 dark:text-gray-300"
        >
          {isEditingPreferences ? (
            <>
              <ChevronUp className="w-4 h-4" /> Close
            </>
          ) : (
            <>
              <Edit2 className="w-4 h-4" /> Edit Preferences
            </>
          )}
        </button>
      </div>

      {/* Summary when not editing */}
      {!isEditingPreferences && (
        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Taste Preferences
              </p>
              <SummaryChips items={preferencesData.preferences} />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-500" /> Allergies
              </p>
              <SummaryChips items={preferencesData.allergies} />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Target className="w-3 h-3 text-blue-500" /> Health Goals
              </p>
              <SummaryChips items={preferencesData.goals} />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Medical History
              </p>
              <SummaryChips items={preferencesData.medicalHistory} />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {preferencesData.routine.breakfast}
              </p>
              <p className="text-xs text-gray-500">Breakfast</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {preferencesData.routine.lunch}
              </p>
              <p className="text-xs text-gray-500">Lunch</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {preferencesData.routine.dinner}
              </p>
              <p className="text-xs text-gray-500">Dinner</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                Rp {preferencesData.budget.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Daily Budget</p>
            </div>
          </div>
        </div>
      )}

      {/* Edit form */}
      {isEditingPreferences && (
        <>
          <div className="space-y-6 pt-4 border-t border-gray-100 dark:border-gray-700">
            {/* Taste Preferences */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Taste Preferences
              </label>
              <ChipSelector
                options={tasteOptions}
                selected={preferencesData.preferences}
                onToggle={(value) => toggleSelection("preferences", value)}
                customValue={customTaste}
                setCustomValue={setCustomTaste}
                customKey="preferences"
                placeholder="Add custom taste..."
                onAddCustom={addCustomItem}
              />
            </div>

            {/* Allergies */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Allergies
              </label>
              <ChipSelector
                options={allergyOptions}
                selected={preferencesData.allergies}
                onToggle={(value) => toggleSelection("allergies", value)}
                customValue={customAllergy}
                setCustomValue={setCustomAllergy}
                customKey="allergies"
                placeholder="Add custom allergy..."
                onAddCustom={addCustomItem}
              />
            </div>

            {/* Goals */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-500" /> Health Goals
              </label>
              <ChipSelector
                options={goalOptions}
                selected={preferencesData.goals}
                onToggle={(value) => toggleSelection("goals", value)}
                customValue={customGoal}
                setCustomValue={setCustomGoal}
                customKey="goals"
                placeholder="Add custom goal..."
                onAddCustom={addCustomItem}
              />
            </div>

            {/* Medical History */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Medical History
              </label>
              <ChipSelector
                options={medicalOptions}
                selected={preferencesData.medicalHistory}
                onToggle={(value) => toggleSelection("medicalHistory", value)}
                customValue={customMedical}
                setCustomValue={setCustomMedical}
                customKey="medicalHistory"
                placeholder="Add medical condition..."
                onAddCustom={addCustomItem}
              />
            </div>

            {/* Meal Times */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-500" /> Meal Times
              </label>
              <div className="grid grid-cols-3 gap-4">
                {(["breakfast", "lunch", "dinner"] as const).map((meal) => (
                  <div key={meal} className="space-y-1">
                    <label className="text-xs text-gray-500 capitalize">
                      {meal}
                    </label>
                    <input
                      type="time"
                      value={preferencesData.routine[meal]}
                      onChange={(e) =>
                        setPreferencesData({
                          ...preferencesData,
                          routine: {
                            ...preferencesData.routine,
                            [meal]: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-500" /> Daily Budget
                (IDR)
              </label>
              <input
                type="number"
                value={preferencesData.budget}
                onChange={(e) =>
                  setPreferencesData({
                    ...preferencesData,
                    budget: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={() => setIsEditingPreferences(false)}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSavePreferences}
              disabled={isSavingPreferences}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {isSavingPreferences ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Preferences
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default PreferencesSection;

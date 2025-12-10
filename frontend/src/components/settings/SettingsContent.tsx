"use client";
import React, { useState, useEffect } from "react";
import {
  Moon,
  Sun,
  Bell,
  Shield,
  LogOut,
  Loader2,
  User,
  Heart,
  Target,
  Clock,
  DollarSign,
  AlertTriangle,
  Activity,
  Save,
  Edit2,
  X,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useUser, useTheme } from "@/context";
import { authService } from "@/services/auth.service";
import { useProfile } from "@/hooks/useProfile";
import { usePreferences } from "@/hooks/usePreferences";

const TASTE_OPTIONS = ["Sweet", "Salty", "Spicy", "Sour", "Bitter", "Umami"];
const ALLERGY_OPTIONS = [
  "Peanuts",
  "Tree Nuts",
  "Milk",
  "Eggs",
  "Wheat",
  "Soy",
  "Fish",
  "Shellfish",
  "Sesame",
];
const GOAL_OPTIONS = [
  "Weight Loss",
  "Weight Gain",
  "Muscle Building",
  "Maintain Weight",
  "Healthy Eating",
  "Low Sugar",
];
const MEDICAL_OPTIONS = [
  "Diabetes",
  "Hypertension",
  "Heart Disease",
  "Cholesterol",
  "Kidney Disease",
  "None",
];

const SettingsContent: React.FC = () => {
  const { user, setUser } = useUser();
  const { theme, toggleTheme } = useTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  // Custom input states
  const [customTaste, setCustomTaste] = useState("");
  const [customAllergy, setCustomAllergy] = useState("");
  const [customGoal, setCustomGoal] = useState("");
  const [customMedical, setCustomMedical] = useState("");

  const {
    profileData,
    setProfileData,
    fetchProfile,
    loadFromCache: loadProfileCache,
    saveProfile,
  } = useProfile();

  const {
    preferencesData,
    setPreferencesData,
    fetchPreferences,
    loadFromCache: loadPreferencesCache,
    savePreferences,
    toggleSelection,
  } = usePreferences();

  useEffect(() => {
    // Load from cache first, then fetch from API
    loadProfileCache();
    loadPreferencesCache();
    fetchProfile().catch(console.error);
    fetchPreferences().catch(console.error);
  }, []);

  const handleLogout = () => {
    setIsLoggingOut(true);
    setUser(null);
    authService.logout();
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      await saveProfile();
      setIsEditingProfile(false);
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsSavingPreferences(true);
    try {
      await savePreferences();
      setIsEditingPreferences(false);
    } catch (error) {
      console.error("Failed to save preferences:", error);
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const addCustomItem = (
    key: "preferences" | "allergies" | "goals" | "medicalHistory",
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (value.trim() && !preferencesData[key].includes(value.trim())) {
      toggleSelection(key, value.trim());
      setter("");
    }
  };

  const ChipSelector = ({
    options,
    selected,
    onToggle,
    disabled,
    customValue,
    setCustomValue,
    customKey,
    placeholder,
  }: {
    options: string[];
    selected: string[];
    onToggle: (value: string) => void;
    disabled?: boolean;
    customValue: string;
    setCustomValue: React.Dispatch<React.SetStateAction<string>>;
    customKey: "preferences" | "allergies" | "goals" | "medicalHistory";
    placeholder: string;
  }) => (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => !disabled && onToggle(option)}
            disabled={disabled}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              selected.includes(option)
                ? "bg-emerald-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            } ${
              disabled
                ? "opacity-50 cursor-not-allowed"
                : "hover:scale-105 cursor-pointer"
            }`}
          >
            {option}
          </button>
        ))}
        {/* Show custom items that aren't in predefined options */}
        {selected
          .filter((item) => !options.includes(item))
          .map((item) => (
            <button
              key={item}
              onClick={() => !disabled && onToggle(item)}
              disabled={disabled}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all bg-emerald-500 text-white ${
                disabled
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:scale-105 cursor-pointer"
              }`}
            >
              {item} ✕
            </button>
          ))}
      </div>
      {!disabled && (
        <div className="flex gap-2">
          <input
            type="text"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomItem(customKey, customValue, setCustomValue);
              }
            }}
            placeholder={placeholder}
            className="flex-1 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          />
          <button
            onClick={() =>
              addCustomItem(customKey, customValue, setCustomValue)
            }
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );

  const SummaryChips = ({ items }: { items: string[] }) => (
    <div className="flex flex-wrap gap-1.5">
      {items.length > 0 ? (
        items.map((item) => (
          <span
            key={item}
            className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-xs"
          >
            {item}
          </span>
        ))
      ) : (
        <span className="text-gray-400 dark:text-gray-500 text-sm italic">
          Not set
        </span>
      )}
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 animate-fade-in font-sans pb-24">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
        Settings
      </h2>

      {/* Profile Section */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-linear-to-br from-emerald-400 to-lime-400 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg">
              {profileData.username?.[0] || user?.name?.[0] || "U"}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {profileData.username || user?.name || "User"}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Health Enthusiast
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-600 dark:text-gray-300"
          >
            {isEditingProfile ? (
              <>
                <ChevronUp className="w-4 h-4" /> Close
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4" /> Edit Profile
              </>
            )}
          </button>
        </div>

        {/* Summary when not editing */}
        {!isEditingProfile && (
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {profileData.age ?? "-"}
              </p>
              <p className="text-xs text-gray-500">Age</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {profileData.height ?? "-"}
              </p>
              <p className="text-xs text-gray-500">Height (cm)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {profileData.weight ?? "-"}
              </p>
              <p className="text-xs text-gray-500">Weight (kg)</p>
            </div>
          </div>
        )}

        {/* Edit form */}
        {isEditingProfile && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <User className="w-4 h-4" /> Username
                </label>
                <input
                  type="text"
                  value={profileData.username}
                  onChange={(e) =>
                    setProfileData({ ...profileData, username: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Age
                </label>
                <input
                  type="number"
                  value={profileData.age ?? ""}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      age: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="Enter your age"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Height (cm)
                </label>
                <input
                  type="number"
                  value={profileData.height ?? ""}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      height: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="Enter your height"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  value={profileData.weight ?? ""}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      weight: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="Enter your weight"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setIsEditingProfile(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {isSavingProfile ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Profile
              </button>
            </div>
          </>
        )}
      </div>

      {/* Preferences Section */}
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
                  options={TASTE_OPTIONS}
                  selected={preferencesData.preferences}
                  onToggle={(value) => toggleSelection("preferences", value)}
                  customValue={customTaste}
                  setCustomValue={setCustomTaste}
                  customKey="preferences"
                  placeholder="Add custom taste..."
                />
              </div>

              {/* Allergies */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Allergies
                </label>
                <ChipSelector
                  options={ALLERGY_OPTIONS}
                  selected={preferencesData.allergies}
                  onToggle={(value) => toggleSelection("allergies", value)}
                  customValue={customAllergy}
                  setCustomValue={setCustomAllergy}
                  customKey="allergies"
                  placeholder="Add custom allergy..."
                />
              </div>

              {/* Goals */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-500" /> Health Goals
                </label>
                <ChipSelector
                  options={GOAL_OPTIONS}
                  selected={preferencesData.goals}
                  onToggle={(value) => toggleSelection("goals", value)}
                  customValue={customGoal}
                  setCustomValue={setCustomGoal}
                  customKey="goals"
                  placeholder="Add custom goal..."
                />
              </div>

              {/* Medical History */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Medical History
                </label>
                <ChipSelector
                  options={MEDICAL_OPTIONS}
                  selected={preferencesData.medicalHistory}
                  onToggle={(value) => toggleSelection("medicalHistory", value)}
                  customValue={customMedical}
                  setCustomValue={setCustomMedical}
                  customKey="medicalHistory"
                  placeholder="Add medical condition..."
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

      {/* App Settings Section */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          App Settings
        </h3>

        <div className="space-y-4">
          {/* Appearance */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl transition-colors">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg transition-colors ${
                  theme === "dark"
                    ? "bg-indigo-900/50 text-indigo-300"
                    : "bg-orange-100 text-orange-600"
                }`}
              >
                {theme === "dark" ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  Dark Mode
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Switch between light and dark themes
                </p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                theme === "dark" ? "bg-emerald-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  theme === "dark" ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 rounded-2xl cursor-pointer transition-colors group">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg group-hover:scale-110 transition-transform">
                <Bell className="w-5 h-5" />
              </div>
              <span className="font-medium text-gray-700 dark:text-gray-200">
                Notifications
              </span>
            </div>
          </div>

          {/* Privacy */}
          <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 rounded-2xl cursor-pointer transition-colors group">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg group-hover:scale-110 transition-transform">
                <Shield className="w-5 h-5" />
              </div>
              <span className="font-medium text-gray-700 dark:text-gray-200">
                Privacy & Data
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-2 text-red-500 hover:text-red-600 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Signing Out...
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" /> Sign Out
              </>
            )}
          </button>
        </div>
      </div>

      <div className="text-center text-sm text-gray-400 dark:text-gray-600 mt-12">
        NutriMori AI v1.0.0
      </div>
    </div>
  );
};

export default SettingsContent;

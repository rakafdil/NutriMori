import React, { useState } from "react";
import { Activity, Plus, AlertCircle, Utensils, User } from "lucide-react";
import { PreferencesData } from "@/hooks/usePreferences";
import { ProfileData } from "@/hooks/useProfile";

interface Step1Props {
  profileData: ProfileData;
  preferencesData: PreferencesData;
  setProfileData: React.Dispatch<React.SetStateAction<ProfileData>>;
  setPreferencesData: React.Dispatch<React.SetStateAction<PreferencesData>>;
  toggleSelection: (key: keyof PreferencesData, value: string) => void;
}

export const Step1Preferences: React.FC<Step1Props> = ({
  profileData,
  preferencesData,
  setProfileData,
  setPreferencesData,
  toggleSelection,
}) => {
  const [customGoal, setCustomGoal] = useState("");
  const [customAllergy, setCustomAllergy] = useState("");
  const [customPreference, setCustomPreference] = useState("");
  const [customMedical, setCustomMedical] = useState("");

  const handleAddCustom = (
    key: keyof PreferencesData,
    value: string,
    setter: (value: string) => void
  ) => {
    if (value.trim()) {
      toggleSelection(key, value.trim());
      setter("");
    }
  };

  const handleProfileChange = (
    field: keyof ProfileData,
    value: string | number
  ) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGoalsChange = (value: string) => {
    setPreferencesData((prev) => {
      if (prev.goals.includes(value)) {
        return { ...prev, goals: prev.goals.filter((item) => item !== value) };
      }
      return { ...prev, goals: [...prev.goals, value] };
    });
  };

  return (
    <div className="flex-1 animate-fade-in overflow-y-auto max-h-[600px] pr-2 choices">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Ceritain tentang dirimu.
      </h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        Isi data diri dan pilih preferensi makanan & goal kamu.
      </p>

      <div className="space-y-6 mb-10">
        {/* Personal Information */}
        <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-2xl border dark:border-gray-700">
          <h3 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-white mb-4">
            <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Informasi Pribadi
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                Username
              </label>
              <input
                required
                type="text"
                value={profileData.username}
                onChange={(e) =>
                  handleProfileChange("username", e.target.value)
                }
                placeholder="johndoe"
                className="w-full p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                Umur (tahun)
              </label>
              <input
                required
                type="number"
                value={profileData.age || ""}
                onChange={(e) =>
                  handleProfileChange("age", parseInt(e.target.value) || 0)
                }
                placeholder="25"
                min="1"
                max="150"
                className="w-full p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                Tinggi (cm)
              </label>
              <input
                required
                type="number"
                value={profileData.height || ""}
                onChange={(e) =>
                  handleProfileChange("height", parseInt(e.target.value) || 0)
                }
                placeholder="170"
                min="50"
                max="300"
                className="w-full p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                Berat (kg)
              </label>
              <input
                required
                type="number"
                value={profileData.weight || ""}
                onChange={(e) =>
                  handleProfileChange("weight", parseInt(e.target.value) || 0)
                }
                placeholder="65"
                min="20"
                max="500"
                className="w-full p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Goals Section */}
        <div>
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Health Goals
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
            {[
              "Diet Seimbang",
              "Bulking",
              "Weight Loss",
              "Better Sleep",
              "More Energy",
              "Muscle Gain",
              "Improve Immunity",
              "Better Digestion",
              "Mental Clarity",
            ].map((opt) => (
              <button
                key={opt}
                onClick={() => handleGoalsChange(opt)}
                className={`p-3 rounded-xl border text-sm font-medium transition-all text-left flex items-center gap-2 ${
                  preferencesData.goals.includes(opt)
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                    : "border-gray-100 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <Activity className="w-4 h-4 opacity-50" /> {opt}
              </button>
            ))}
          </div>
          {/* Custom Goal Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
              placeholder="Add custom goal..."
              className="flex-1 mx-2 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white text-sm"
              onKeyPress={(e) => {
                if (e.key === "Enter" && customGoal.trim()) {
                  handleGoalsChange(customGoal.trim());
                  setCustomGoal("");
                }
              }}
            />
            <button
              onClick={() => {
                if (customGoal.trim()) {
                  handleGoalsChange(customGoal.trim());
                  setCustomGoal("");
                }
              }}
              className="px-4 mx-2 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Medical History Section */}
        <div>
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Medical History (affects nutrient needs)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
            {[
              ...new Set([
                "Diabetes Type 1",
                "Diabetes Type 2",
                "Hypertension",
                "High Cholesterol",
                "Heart Disease",
                "Thyroid Issues",
                "Anemia",
                "GERD",
                "IBS",
                "Kidney Disease",
                "Liver Disease",
                "Osteoporosis",
                ...preferencesData.medicalHistory,
              ]),
            ].map((opt) => (
              <button
                key={opt}
                onClick={() => toggleSelection("medicalHistory", opt)}
                className={`p-3 rounded-xl border text-sm font-medium transition-all text-left ${
                  preferencesData.medicalHistory.includes(opt)
                    ? "border-orange-500 bg-orange-50 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                    : "border-gray-100 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          {/* Custom Medical Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={customMedical}
              onChange={(e) => setCustomMedical(e.target.value)}
              placeholder="Add other medical condition..."
              className="flex-1 px-4 mx-2 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:text-white text-sm"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleAddCustom(
                    "medicalHistory",
                    customMedical,
                    setCustomMedical
                  );
                }
              }}
            />
            <button
              onClick={() =>
                handleAddCustom(
                  "medicalHistory",
                  customMedical,
                  setCustomMedical
                )
              }
              className="px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Allergies Section */}
        <div>
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-3">
            Allergies / Foods to Avoid
          </label>
          <div className="flex flex-wrap gap-3 mb-3">
            {[
              ...new Set([
                "Seafood",
                "Dairy",
                "Nuts",
                "Peanuts",
                "Gluten",
                "Eggs",
                "Soy",
                "Shellfish",
                "Wheat",
                "Sesame",
                "Fish",
                "Corn",
                ...preferencesData.allergies,
              ]),
            ].map((opt) => (
              <button
                key={opt}
                onClick={() => toggleSelection("allergies", opt)}
                className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                  preferencesData.allergies.includes(opt)
                    ? "border-red-200 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 dark:border-red-900"
                    : "border-gray-100 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          {/* Custom Allergy Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={customAllergy}
              onChange={(e) => setCustomAllergy(e.target.value)}
              placeholder="Add custom allergy..."
              className="flex-1 px-4 mx-2 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white text-sm"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleAddCustom("allergies", customAllergy, setCustomAllergy);
                }
              }}
            />
            <button
              onClick={() =>
                handleAddCustom("allergies", customAllergy, setCustomAllergy)
              }
              className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Food Preferences Section */}
        <div>
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-3 flex items-center gap-2">
            <Utensils className="w-4 h-4" />
            Favorite Food Types & Tastes
          </label>
          <div className="flex flex-wrap gap-3 mb-3">
            {[
              ...new Set([
                "Spicy",
                "Sweet",
                "Savory",
                "Sour",
                "Bitter",
                "Vegetarian",
                "Vegan",
                "Halal",
                "Kosher",
                "Low Carb",
                "High Protein",
                "Mediterranean",
                "Asian Cuisine",
                "Western Food",
                "Traditional",
                "Street Food",
                ...preferencesData.preferences,
              ]),
            ].map((opt) => (
              <button
                key={opt}
                onClick={() => toggleSelection("preferences", opt)}
                className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                  preferencesData.preferences.includes(opt)
                    ? "border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-900"
                    : "border-gray-100 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          {/* Custom Preference Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={customPreference}
              onChange={(e) => setCustomPreference(e.target.value)}
              placeholder="Add custom preference..."
              className="flex-1 px-4 mx-2 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleAddCustom(
                    "preferences",
                    customPreference,
                    setCustomPreference
                  );
                }
              }}
            />
            <button
              onClick={() =>
                handleAddCustom(
                  "preferences",
                  customPreference,
                  setCustomPreference
                )
              }
              className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

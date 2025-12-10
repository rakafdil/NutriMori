"use client";
import React from "react";
import { Leaf, User, Target, Heart } from "lucide-react";
import { ProfileData, PreferencesData } from "./OnboardingContent";

interface Step3Props {
  profileData: ProfileData;
  preferencesData: PreferencesData;
}

export const Step3Summary: React.FC<Step3Props> = ({
  profileData,
  preferencesData,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
      <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 animate-bounce">
        <Leaf className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        You're all set, {profileData.username || "friend"}!
      </h2>
      <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">
        Profil kamu sudah siap. Mari mulai perjalanan sehatmu hari ini.
      </p>

      {/* Profile Summary */}
      <div className="w-full max-w-md space-y-3 text-left">
        {profileData.age && profileData.height && profileData.weight && (
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border dark:border-gray-700">
            <h3 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-white mb-2 text-sm">
              <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Data Pribadi
            </h3>
            <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-300">
              <div>
                <span className="block text-gray-400">Umur</span>
                <span className="font-semibold">{profileData.age} tahun</span>
              </div>
              <div>
                <span className="block text-gray-400">Tinggi</span>
                <span className="font-semibold">{profileData.height} cm</span>
              </div>
              <div>
                <span className="block text-gray-400">Berat</span>
                <span className="font-semibold">{profileData.weight} kg</span>
              </div>
            </div>
          </div>
        )}

        {preferencesData.goals.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border dark:border-gray-700">
            <h3 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-white mb-2 text-sm">
              <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Goals
            </h3>
            <div className="flex flex-wrap gap-1">
              {preferencesData.goals.map((goal, i) => (
                <span
                  key={i}
                  className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-full"
                >
                  {goal}
                </span>
              ))}
            </div>
          </div>
        )}

        {preferencesData.medicalHistory.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border dark:border-gray-700">
            <h3 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-white mb-2 text-sm">
              <Heart className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              Medical History
            </h3>
            <div className="flex flex-wrap gap-1">
              {preferencesData.medicalHistory.map((condition, i) => (
                <span
                  key={i}
                  className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-1 rounded-full"
                >
                  {condition}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

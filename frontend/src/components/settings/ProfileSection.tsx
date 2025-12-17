import React from "react";
import { Edit2, ChevronUp, User, Activity, Save, Loader2 } from "lucide-react";
import { ProfileData } from "@/hooks/useProfile";

interface ProfileSectionProps {
  profileData: ProfileData;
  setProfileData: React.Dispatch<React.SetStateAction<ProfileData>>;
  userName?: string;
  isEditingProfile: boolean;
  setIsEditingProfile: React.Dispatch<React.SetStateAction<boolean>>;
  isSavingProfile: boolean;
  handleSaveProfile: () => void;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({
  profileData,
  setProfileData,
  userName,
  isEditingProfile,
  setIsEditingProfile,
  isSavingProfile,
  handleSaveProfile,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-linear-to-br from-emerald-400 to-lime-400 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg">
            {profileData.username?.[0] || userName?.[0] || "U"}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {profileData.username || userName || "User"}
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
                    age: e.target.value ? parseInt(e.target.value) : undefined,
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
  );
};

export default ProfileSection;

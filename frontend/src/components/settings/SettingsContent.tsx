"use client";
import React, { useState, useEffect } from "react";
import { useUser, useTheme } from "@/context";
import { authService } from "@/services/auth.service";
import { useProfile } from "@/hooks/useProfile";
import { usePreferences } from "@/hooks/usePreferences";
import ProfileSection from "./ProfileSection";
import PreferencesSection from "./PreferencesSection";
import AppSettingsSection from "./AppSettingsSection";
import {
  TASTE_OPTIONS,
  ALLERGY_OPTIONS,
  GOAL_OPTIONS,
  MEDICAL_OPTIONS,
} from "./settings.constants";

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
    // Load from cache first for instant display
    loadProfileCache();
    loadPreferencesCache();

    // Then fetch fresh data from API
    const fetchData = async () => {
      try {
        await Promise.all([fetchProfile(), fetchPreferences()]);
      } catch (error) {
        console.error("Failed to fetch settings data:", error);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency - only run on mount

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

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 animate-fade-in font-sans pb-24">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
        Settings
      </h2>

      {/* Profile Section */}
      <ProfileSection
        profileData={profileData}
        setProfileData={setProfileData}
        userName={user?.name}
        isEditingProfile={isEditingProfile}
        setIsEditingProfile={setIsEditingProfile}
        isSavingProfile={isSavingProfile}
        handleSaveProfile={handleSaveProfile}
      />

      {/* Preferences Section */}
      <PreferencesSection
        preferencesData={preferencesData}
        setPreferencesData={setPreferencesData}
        isEditingPreferences={isEditingPreferences}
        setIsEditingPreferences={setIsEditingPreferences}
        isSavingPreferences={isSavingPreferences}
        handleSavePreferences={handleSavePreferences}
        toggleSelection={toggleSelection}
        customTaste={customTaste}
        setCustomTaste={setCustomTaste}
        customAllergy={customAllergy}
        setCustomAllergy={setCustomAllergy}
        customGoal={customGoal}
        setCustomGoal={setCustomGoal}
        customMedical={customMedical}
        setCustomMedical={setCustomMedical}
        addCustomItem={addCustomItem}
        tasteOptions={TASTE_OPTIONS}
        allergyOptions={ALLERGY_OPTIONS}
        goalOptions={GOAL_OPTIONS}
        medicalOptions={MEDICAL_OPTIONS}
      />

      {/* App Settings Section */}
      <AppSettingsSection
        theme={theme}
        toggleTheme={toggleTheme}
        isLoggingOut={isLoggingOut}
        handleLogout={handleLogout}
      />

      <div className="text-center text-sm text-gray-400 dark:text-gray-600 mt-12">
        NutriMori AI v1.0.0
      </div>
    </div>
  );
};

export default SettingsContent;

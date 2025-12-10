"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserProfile } from "@/types";
import { useUser } from "@/context";
import { ProgressBar } from "./ProgressBar";
import { NavigationButtons } from "./NavigationButtons";
import { Step1Preferences } from "./Step1Preferences";
import { Step2Routine } from "./Step2Routine";
import { Step3Summary } from "./Step3Summary";
import { useProfile } from "@/hooks/useProfile";
import { usePreferences } from "@/hooks/usePreferences";

const steps = [
  { id: 1, title: "Preferensi Makanan" },
  { id: 2, title: "Rutinitas Harian" },
  { id: 3, title: "Summary" },
];

const OnboardingContent: React.FC = () => {
  const router = useRouter();
  const { setUser } = useUser();
  const [step, setStep] = useState(1);

  // Use custom hooks
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

  // Combined profile for backward compatibility with context
  const profile: UserProfile = {
    ...profileData,
    ...preferencesData,
    goals: Array.isArray(preferencesData.goals)
      ? preferencesData.goals.join(", ")
      : preferencesData.goals,
  };

  useEffect(() => {
    const initData = async () => {
      // Load from cache first for instant UI
      loadProfileCache();
      loadPreferencesCache();

      // Then fetch fresh data from API
      try {
        await Promise.all([fetchProfile(), fetchPreferences()]);
      } catch (error) {
        console.error("Failed to sync user data:", error);
      }
    };

    initData();
  }, [fetchProfile, fetchPreferences, loadProfileCache, loadPreferencesCache]);

  const handleNext = async () => {
    if (step < steps.length) {
      setStep(step + 1);
    } else {
      try {
        await Promise.all([saveProfile(), savePreferences()]);
        setUser(profile);
        router.push("/dashboard");
      } catch (error) {
        console.error("Error saving onboarding data:", error);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Step1Preferences
            profileData={profileData}
            preferencesData={preferencesData}
            setProfileData={setProfileData}
            setPreferencesData={setPreferencesData}
            toggleSelection={toggleSelection}
          />
        );
      case 2:
        return (
          <Step2Routine
            preferencesData={preferencesData}
            setPreferencesData={setPreferencesData}
          />
        );
      case 3:
        return (
          <Step3Summary
            profileData={profileData}
            preferencesData={preferencesData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6 font-sans transition-colors duration-500">
      <div className="w-full max-w-2xl">
        <ProgressBar steps={steps} currentStep={step} />

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-emerald-100/50 dark:shadow-none border dark:border-gray-700 p-8 md:p-12 min-h-[500px] flex flex-col transition-colors duration-300">
          {renderStep()}

          <NavigationButtons
            step={step}
            totalSteps={steps.length}
            onBack={handleBack}
            onNext={handleNext}
          />
        </div>
      </div>
    </div>
  );
};

export default OnboardingContent;

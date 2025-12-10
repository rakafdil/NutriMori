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
import { userService } from "@/services/user.service";
import preferencesService from "@/services/prefrences.service";

export interface ProfileData {
  username: string;
  age: number | undefined;
  height: number | undefined;
  weight: number | undefined;
}

export interface PreferencesData {
  preferences: string[];
  allergies: string[];
  goals: string[];
  medicalHistory: string[];
  routine: { breakfast: string; lunch: string; dinner: string };
  budget: number;
}

const PROFILE_STORAGE_KEY = "nutrimori_user";
const PREFERENCES_STORAGE_KEY = "nutrimori_preferences";

const steps = [
  { id: 1, title: "Preferensi Makanan" },
  { id: 2, title: "Rutinitas Harian" },
  { id: 3, title: "Summary" },
];

const OnboardingContent: React.FC = () => {
  const router = useRouter();
  const { setUser } = useUser();
  const [step, setStep] = useState(1);

  const [profileData, setProfileData] = useState<ProfileData>({
    username: "",
    age: undefined,
    height: undefined,
    weight: undefined,
  });

  const [preferencesData, setPreferencesData] = useState<PreferencesData>({
    preferences: [],
    allergies: [],
    goals: [],
    medicalHistory: [],
    routine: { breakfast: "07:00", lunch: "12:00", dinner: "19:00" },
    budget: 50000,
  });

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
      // Load cached profile data
      const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (storedProfile) {
        try {
          const parsed = JSON.parse(storedProfile);
          setProfileData((prev) => ({
            ...prev,
            username: parsed.username || "",
            age: parsed.age,
            height: parsed.height,
            weight: parsed.weight,
          }));
        } catch (error) {
          console.error("Error parsing cached profile data", error);
        }
      }

      // Load cached preferences data
      const storedPreferences = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (storedPreferences) {
        try {
          const parsed = JSON.parse(storedPreferences);
          setPreferencesData((prev) => ({
            ...prev,
            preferences: parsed.preferences || [],
            allergies: parsed.allergies || [],
            goals: Array.isArray(parsed.goals)
              ? parsed.goals
              : parsed.goals
              ? [parsed.goals]
              : [],
            medicalHistory: parsed.medicalHistory || [],
            routine: parsed.routine || prev.routine,
            budget: parsed.budget || 50000,
          }));
        } catch (error) {
          console.error("Error parsing cached preferences data", error);
        }
      }

      try {
        const [prefData, profileDataRes] = await Promise.all([
          preferencesService.getPreferences(),
          userService.getProfile(),
        ]);

        const newProfileData: ProfileData = {
          username: profileDataRes?.username || "",
          age: profileDataRes?.age,
          height: profileDataRes?.height_cm,
          weight: profileDataRes?.weight_kg,
        };

        const newPreferencesData: PreferencesData = {
          preferences: prefData?.tastes || [],
          allergies: prefData?.allergies || [],
          goals: Array.isArray(prefData?.goals)
            ? prefData.goals
            : prefData?.goals
            ? [prefData.goals]
            : [],
          medicalHistory: prefData?.medical_history || [],
          routine: {
            breakfast: prefData?.meal_times?.breakfast ?? "07:00",
            lunch: prefData?.meal_times?.lunch ?? "12:00",
            dinner: prefData?.meal_times?.dinner ?? "19:00",
          },
          budget: prefData?.daily_budget || 50000,
        };

        setProfileData(newProfileData);
        setPreferencesData(newPreferencesData);

        // Save to separate localStorage keys
        localStorage.setItem(
          PROFILE_STORAGE_KEY,
          JSON.stringify(newProfileData)
        );
        localStorage.setItem(
          PREFERENCES_STORAGE_KEY,
          JSON.stringify(newPreferencesData)
        );
      } catch (error) {
        console.error("Failed to sync user data:", error);
      }
    };

    initData();
  }, []);

  // Save profile data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileData));
  }, [profileData]);

  // Save preferences data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify(preferencesData)
    );
  }, [preferencesData]);

  const togglePreferencesSelection = (
    key: keyof PreferencesData,
    value: string
  ) => {
    setPreferencesData((prev) => {
      const current = prev[key] as string[];
      if (current.includes(value)) {
        return { ...prev, [key]: current.filter((item) => item !== value) };
      }
      return { ...prev, [key]: [...current, value] };
    });
  };

  const handleNext = async () => {
    if (step < steps.length) {
      setStep(step + 1);
    } else {
      try {
        await Promise.all([saveProfile(), savePreferences()]);
      } catch (error) {
        console.error("Error saving onboarding data:", error);
      } finally {
        setUser(profile);
        router.push("/dashboard");
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const saveProfile = async () => {
    const payload = {
      username: profileData.username || undefined,
      age: profileData.age ?? undefined,
      height_cm: profileData.height ?? undefined,
      weight_kg: profileData.weight ?? undefined,
    };

    try {
      await userService.updateProfile(payload);
    } catch (error) {
      console.error("Failed to save profile:", error);
    }
  };

  const savePreferences = async () => {
    const payload = {
      allergies: preferencesData.allergies?.length
        ? preferencesData.allergies
        : undefined,
      goals: preferencesData.goals?.length ? preferencesData.goals : undefined,
      tastes: preferencesData.preferences?.length
        ? preferencesData.preferences
        : undefined,
      medical_history: preferencesData.medicalHistory?.length
        ? preferencesData.medicalHistory
        : undefined,
      meal_times: preferencesData.routine
        ? { ...preferencesData.routine }
        : undefined,
      daily_budget: preferencesData.budget ?? undefined,
    };

    try {
      // Use upsert to create or update (PUT), or use updatePreferences (PATCH) if you prefer
      await preferencesService.upsertPreferences(payload);
    } catch (error) {
      console.error("Failed to save preferences:", error);
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
            toggleSelection={togglePreferencesSelection}
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

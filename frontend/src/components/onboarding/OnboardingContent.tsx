"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { UserProfile } from "@/types";
import { useUser } from "@/context";
import { ProgressBar } from "./ProgressBar";
import { NavigationButtons } from "./NavigationButtons";
import { Step1Preferences } from "./Step1Preferences";
import { Step2Routine } from "./Step2Routine";
import { Step3Summary } from "./Step3Summary";

const steps = [
  { id: 1, title: "Preferensi Makanan" },
  { id: 2, title: "Rutinitas Harian" },
  { id: 3, title: "Summary" },
];

const OnboardingContent: React.FC = () => {
  const router = useRouter();
  const { setUser } = useUser();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<UserProfile>({
    name: "Raka",
    preferences: [],
    allergies: [],
    goals: [],
    medicalHistory: [],
    routine: { breakfast: "07:00", lunch: "12:00", dinner: "19:00" },
    budget: 50000,
  });

  const toggleSelection = (key: keyof UserProfile, value: string) => {
    setProfile((prev) => {
      const current = prev[key] as string[];
      if (current.includes(value)) {
        return { ...prev, [key]: current.filter((item) => item !== value) };
      }
      return { ...prev, [key]: [...current, value] };
    });
  };

  const handleNext = () => {
    if (step < steps.length) {
      setStep(step + 1);
    } else {
      setUser(profile);
      router.push("/dashboard");
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
            profile={profile}
            toggleSelection={toggleSelection}
          />
        );
      case 2:
        return <Step2Routine profile={profile} setProfile={setProfile} />;
      case 3:
        console.log(profile);
        return <Step3Summary />;
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

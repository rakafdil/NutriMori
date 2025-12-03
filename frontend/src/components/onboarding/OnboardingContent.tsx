"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { UserProfile } from "@/types";
import { useUser } from "@/context";
import {
  Check,
  ChevronRight,
  Leaf,
  Clock,
  Wallet,
  Activity,
} from "lucide-react";

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
    routine: { breakfast: "07:00", lunch: "12:00", dinner: "19:00" },
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
    if (step < 3) {
      setStep(step + 1);
    } else {
      setUser(profile);
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6 font-sans transition-colors duration-500">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="flex items-center justify-between mb-8 px-2">
          {steps.map((s) => (
            <div
              key={s.id}
              className={`flex items-center gap-2 ${
                step >= s.id
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-gray-300 dark:text-gray-600"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                  step >= s.id
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-900/50 dark:border-emerald-500"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                {step > s.id ? <Check className="w-4 h-4" /> : s.id}
              </div>
            </div>
          ))}
        </div>

        {/* Card Content */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-emerald-100/50 dark:shadow-none border dark:border-gray-700 p-8 md:p-12 min-h-[500px] flex flex-col transition-colors duration-300">
          {step === 1 && (
            <div className="flex-1 animate-fade-in">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Ceritain tentang seleramu.
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8">
                Pilih makanan favorit & goal kamu.
              </p>

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-3">
                    Goals
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      "Diet Seimbang",
                      "Bulking",
                      "Weight Loss",
                      "Better Sleep",
                      "More Energy",
                    ].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => toggleSelection("goals", opt)}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all text-left flex items-center gap-2 ${
                          profile.goals.includes(opt)
                            ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                            : "border-gray-100 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                      >
                        <Activity className="w-4 h-4 opacity-50" /> {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-3">
                    Allergies / Avoid
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {["Seafood", "Dairy", "Nuts", "Gluten", "Spicy"].map(
                      (opt) => (
                        <button
                          key={opt}
                          onClick={() => toggleSelection("allergies", opt)}
                          className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                            profile.allergies.includes(opt)
                              ? "border-red-200 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 dark:border-red-900"
                              : "border-gray-100 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
                        >
                          {opt}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">
                        Breakfast
                      </label>
                      <input
                        type="time"
                        defaultValue={profile.routine.breakfast}
                        className="w-full mt-1 p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-emerald-500 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">
                        Lunch
                      </label>
                      <input
                        type="time"
                        defaultValue={profile.routine.lunch}
                        className="w-full mt-1 p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-emerald-500 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">
                        Dinner
                      </label>
                      <input
                        type="time"
                        defaultValue={profile.routine.dinner}
                        className="w-full mt-1 p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-emerald-500 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-2xl border dark:border-gray-700">
                  <h3 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-white mb-4">
                    <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />{" "}
                    Budget Harian
                  </h3>
                  <input
                    type="range"
                    className="w-full accent-emerald-600 h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                    <span>Hemat</span>
                    <span>Moderate</span>
                    <span>Sultan</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
              <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 animate-bounce">
                <Leaf className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                You're all set!
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                Profil kamu sudah siap. Mari mulai perjalanan sehatmu hari ini.
              </p>
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleNext}
              className="flex items-center gap-2 bg-emerald-900 dark:bg-emerald-600 text-white px-8 py-3 rounded-full font-medium hover:bg-emerald-800 dark:hover:bg-emerald-500 transition-colors"
            >
              {step === 3 ? "Enter Dashboard" : "Continue"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingContent;

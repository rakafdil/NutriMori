import React from "react";
import { Check } from "lucide-react";

interface Step {
  id: number;
  title: string;
}

interface ProgressBarProps {
  steps: Step[];
  currentStep: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  steps,
  currentStep,
}) => {
  return (
    <div className="flex items-center justify-between mb-8 px-2">
      {steps.map((s) => (
        <div
          key={s.id}
          className={`flex items-center gap-2 ${
            currentStep >= s.id
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-gray-300 dark:text-gray-600"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
              currentStep >= s.id
                ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-900/50 dark:border-emerald-500"
                : "border-gray-200 dark:border-gray-700"
            }`}
          >
            {currentStep > s.id ? <Check className="w-4 h-4" /> : s.id}
          </div>
        </div>
      ))}
    </div>
  );
};

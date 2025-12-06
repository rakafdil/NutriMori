import React from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface NavigationButtonsProps {
  step: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
}

export const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  step,
  totalSteps,
  onBack,
  onNext,
}) => {
  return (
    <div className="mt-8 flex justify-between">
      {step > 1 && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-8 py-3 rounded-full font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
      )}
      <button
        onClick={onNext}
        className={`flex items-center gap-2 bg-emerald-900 dark:bg-emerald-600 text-white px-8 py-3 rounded-full font-medium hover:bg-emerald-800 dark:hover:bg-emerald-500 transition-colors ${
          step === 1 ? "ml-auto" : ""
        }`}
      >
        {step === totalSteps ? "Enter Dashboard" : "Continue"}
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

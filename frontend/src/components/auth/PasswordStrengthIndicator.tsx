"use client";
import React from "react";
import { Check, X } from "lucide-react";
import {
  passwordRequirements,
  getPasswordStrength,
} from "@/utils/passwordValidator";

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showRequirements = false,
}) => {
  if (!password && !showRequirements) return null;

  const { strength, label, color } = getPasswordStrength(password);

  return (
    <div className="mt-2 animate-fade-in">
      {/* Strength Bar */}
      {password && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Password Strength
            </span>
            <span
              className={`text-xs font-semibold ${
                strength === 100
                  ? "text-green-600 dark:text-green-400"
                  : strength >= 50
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {label}
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${color} transition-all duration-300`}
              style={{ width: `${strength}%` }}
            />
          </div>
        </div>
      )}

      {/* Requirements List */}
      {(showRequirements || password) && (
        <div className="space-y-1.5">
          {passwordRequirements.map((req, index) => {
            const isMet = req.validator(password);
            return (
              <div
                key={index}
                className={`flex items-center gap-2 text-xs transition-colors ${
                  isMet
                    ? "text-green-600 dark:text-green-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {isMet ? (
                  <Check className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <X className="w-4 h-4 flex-shrink-0 opacity-30" />
                )}
                <span>{req.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;

import React from "react";
import { Plus } from "lucide-react";

interface ChipSelectorProps {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  disabled?: boolean;
  customValue: string;
  setCustomValue: React.Dispatch<React.SetStateAction<string>>;
  customKey: "preferences" | "allergies" | "goals" | "medicalHistory";
  placeholder: string;
  onAddCustom: (
    key: "preferences" | "allergies" | "goals" | "medicalHistory",
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => void;
}

const ChipSelector: React.FC<ChipSelectorProps> = ({
  options,
  selected,
  onToggle,
  disabled,
  customValue,
  setCustomValue,
  customKey,
  placeholder,
  onAddCustom,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onAddCustom(customKey, customValue, setCustomValue);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => !disabled && onToggle(option)}
            disabled={disabled}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              selected.includes(option)
                ? "bg-emerald-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            } ${
              disabled
                ? "opacity-50 cursor-not-allowed"
                : "hover:scale-105 cursor-pointer"
            }`}
          >
            {option}
          </button>
        ))}
        {/* Show custom items that aren't in predefined options */}
        {selected
          .filter((item) => !options.includes(item))
          .map((item) => (
            <button
              key={item}
              onClick={() => !disabled && onToggle(item)}
              disabled={disabled}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all bg-emerald-500 text-white ${
                disabled
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:scale-105 cursor-pointer"
              }`}
            >
              {item} ✕
            </button>
          ))}
      </div>
      {!disabled && (
        <div className="flex gap-2">
          <input
            type="text"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          />
          <button
            onClick={() => onAddCustom(customKey, customValue, setCustomValue)}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ChipSelector;

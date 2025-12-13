"use client";
import React, { useEffect, useRef, useState } from "react";
import { Zap } from "lucide-react";

interface AddMealModalProps {
  onAnalyze: (input: string) => void;
  isAnalyzing: boolean;
  onClose: () => void;
}

const CLOSE_ANIM_MS = 300;

const AddMealModal: React.FC<AddMealModalProps> = ({
  onAnalyze,
  isAnalyzing,
  onClose,
}) => {
  const [mealInput, setMealInput] = useState("");
  const [visible, setVisible] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);

  // trigger enter animation setelah mount (delay kecil untuk memastikan transition)
  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const startClose = () => {
    if (!visible) return;
    setVisible(false);
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = window.setTimeout(onClose, CLOSE_ANIM_MS);
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") startClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [visible]);

  const handleSubmit = () => {
    if (mealInput.trim()) {
      onAnalyze(mealInput.trim());
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        visible ? "opacity-100" : "opacity-0"
      } bg-black/30 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-300`}
      onClick={(e) => {
        if (e.target === e.currentTarget) startClose();
      }}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`bg-white dark:bg-gray-900 w-full max-w-lg rounded-3xl p-6 shadow-2xl border dark:border-gray-800 transform transition-all duration-300 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold dark:text-white">Catat Makanan</h3>
          <button
            onClick={startClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <textarea
          className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 min-h-[120px] focus:outline-emerald-500 mb-4 dark:text-white"
          placeholder="Contoh: Nasi goreng ayam dengan telur dan tahu goreng..."
          value={mealInput}
          onChange={(e) => setMealInput(e.target.value)}
          disabled={isAnalyzing}
        />

        <button
          onClick={handleSubmit}
          disabled={isAnalyzing || !mealInput.trim()}
          className="w-full bg-black dark:bg-emerald-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-emerald-700 disabled:opacity-50 transition"
        >
          {isAnalyzing ? (
            <>
              Menganalisis... <span className="animate-spin">⏳</span>
            </>
          ) : (
            <>
              Analisis dengan AI <Zap className="w-4 h-4 text-yellow-400" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AddMealModal;

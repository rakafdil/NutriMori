"use client";
import React, { useEffect, useState } from "react";
import { Plus, Sparkles } from "lucide-react";

interface GreetingHeaderProps {
  username?: string;
  onAddMeal: () => void;
}

const GreetingHeader: React.FC<GreetingHeaderProps> = ({
  username,
  onAddMeal,
}) => {
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by waiting for mount
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex justify-between items-end animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-2 tracking-tight">
          Halo,{" "}
          {mounted && username ? (
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              {username}
            </span>
          ) : (
            <div className="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          )}{" "}
          👋
        </h1>
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <p>Hari ini tubuhmu lagi butuh keseimbangan. Let's do this.</p>
        </div>
      </div>
      <button
        onClick={onAddMeal}
        className="bg-gray-900 dark:bg-emerald-600 text-white p-4 rounded-full shadow-lg hover:bg-gray-800 dark:hover:bg-emerald-700 transition-all hover:scale-105 active:scale-95 md:hidden"
        aria-label="Tambah Makanan"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};

export default GreetingHeader;

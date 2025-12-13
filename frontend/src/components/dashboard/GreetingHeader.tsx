"use client";
import React from "react";
import { Plus } from "lucide-react";

interface GreetingHeaderProps {
  username: string;
  onAddMeal: () => void;
}

const GreetingHeader: React.FC<GreetingHeaderProps> = ({
  username,
  onAddMeal,
}) => {
  return (
    <div className="flex justify-between items-end">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Halo, {username} 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Hari ini tubuhmu lagi butuh keseimbangan. Let's do this.
        </p>
      </div>
      <button
        onClick={onAddMeal}
        className="bg-gray-900 dark:bg-emerald-600 text-white p-4 rounded-full shadow-lg hover:bg-gray-800 dark:hover:bg-emerald-700 transition md:hidden"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};

export default GreetingHeader;

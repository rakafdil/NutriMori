import React from "react";
import { Leaf } from "lucide-react";

export const Step3Summary: React.FC = () => {
  return (
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
  );
};

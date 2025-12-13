"use client";
import React from "react";

interface DailyInsightProps {
  insight: string;
}

const DailyInsight: React.FC<DailyInsightProps> = ({ insight }) => {
  return (
    <div className="bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50 p-6 rounded-3xl relative overflow-hidden">
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-200/20 dark:bg-emerald-500/10 rounded-full blur-2xl"></div>
      <h3 className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold mb-2">
        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
        Insight Today
      </h3>
      <p className="text-emerald-900 dark:text-emerald-100 text-lg font-medium">
        "{insight}"
      </p>
    </div>
  );
};

export default DailyInsight;

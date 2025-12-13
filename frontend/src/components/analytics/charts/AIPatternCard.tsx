"use client";
import React from "react";

interface AIPattern {
  title?: string;
  description: string;
  highlights?: string[];
}

interface AIPatternCardProps {
  pattern: AIPattern;
}

const AIPatternCard: React.FC<AIPatternCardProps> = ({ pattern }) => {
  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-4 transition-colors">
      <div className="p-3 bg-white dark:bg-indigo-900/50 rounded-full shadow-sm">
        <span className="text-2xl">🧠</span>
      </div>
      <div>
        <h3 className="font-bold text-indigo-900 dark:text-indigo-200 text-lg mb-1">
          {pattern.title || "AI Pattern Discovery"}
        </h3>
        <p className="text-indigo-800/80 dark:text-indigo-300/80 leading-relaxed">
          {pattern.description}
          {pattern.highlights?.map((highlight, index) => (
            <span
              key={index}
              className="font-semibold text-indigo-900 dark:text-indigo-200"
            >
              {" "}
              {highlight}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
};

export default AIPatternCard;

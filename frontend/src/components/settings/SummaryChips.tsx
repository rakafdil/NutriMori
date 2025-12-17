import React from "react";

interface SummaryChipsProps {
  items: string[];
}

const SummaryChips: React.FC<SummaryChipsProps> = ({ items }) => {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.length > 0 ? (
        items.map((item) => (
          <span
            key={item}
            className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-xs"
          >
            {item}
          </span>
        ))
      ) : (
        <span className="text-gray-400 dark:text-gray-500 text-sm italic">
          Not set
        </span>
      )}
    </div>
  );
};

export default SummaryChips;

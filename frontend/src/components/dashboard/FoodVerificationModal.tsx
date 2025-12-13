"use client";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check, ChevronDown, Minus, Plus, X } from "lucide-react";
import { MatchResult } from "@/types";
import { VerifiedFood, searchFoods } from "@/services/food-matcher.service";
import { createPortal } from "react-dom";

interface FoodVerificationModalProps {
  matchResults: MatchResult[];
  onConfirm: (verifiedFoods: VerifiedFood[]) => void;
  onClose: () => void;
}

const CLOSE_ANIM_MS = 300;

const FoodVerificationModal: React.FC<FoodVerificationModalProps> = ({
  matchResults,
  onConfirm,
  onClose,
}) => {
  const [visible, setVisible] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const toggleDropdown = (i: number) => {
    if (openDropdown === i) {
      setOpenDropdown(null);
      setDropdownPos(null);
      return;
    }
    const btn = buttonRefs.current[i];
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    setDropdownPos({ top: rect.bottom, left: rect.left, width: rect.width });
    setOpenDropdown(i);
  };
  // State for each candidate's selection
  const [selections, setSelections] = useState<VerifiedFood[]>(() =>
    matchResults.map((m) => ({
      candidate: m.candidate,
      selectedFoodId: m.match_result[0]?.food_id ?? 0,
      selectedName: m.match_result[0]?.nama ?? m.candidate,
      quantity: 1,
      unit: "porsi",
    }))
  );

  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { food_id: number; nama: string }[]
  >([]);

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
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const handleSelectFood = (
    index: number,
    food: { food_id: number; nama: string }
  ) => {
    setSelections((prev) =>
      prev.map((s, i) =>
        i === index
          ? { ...s, selectedFoodId: food.food_id, selectedName: food.nama }
          : s
      )
    );
    setOpenDropdown(null);
    setSearchQuery("");
  };

  const handleQuantityChange = (index: number, delta: number) => {
    setSelections((prev) =>
      prev.map((s, i) =>
        i === index ? { ...s, quantity: Math.max(0.5, s.quantity + delta) } : s
      )
    );
  };

  const handleRemoveItem = (index: number) => {
    setSelections((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      const results = await searchFoods(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleConfirm = () => {
    onConfirm(selections.filter((s) => s.selectedFoodId !== 0));
  };

  useLayoutEffect(() => {
    const onResize = () => {
      if (openDropdown == null) return;
      const btn = buttonRefs.current[openDropdown];
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom, left: rect.left, width: rect.width });
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [openDropdown]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        visible ? "opacity-100" : "opacity-0"
      } bg-black/30 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-300`}
      onClick={(e) => {
        if (e.target === e.currentTarget) startClose();
      }}
    >
      <div
        className={`bg-white dark:bg-gray-900 w-full max-w-2xl rounded-3xl p-6 shadow-2xl border dark:border-gray-800 max-h-[85vh] overflow-y-auto transform transition-all duration-300 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold dark:text-white">
            Verifikasi Makanan
          </h3>
          <button
            onClick={startClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Periksa dan sesuaikan hasil pencocokan makanan di bawah ini.
        </p>

        <div className="space-y-3 mb-6">
          {selections.map((sel, index) => (
            <div
              key={index}
              className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl text-gray-400 dark:text-white">
                  "{sel.candidate}"
                </span>
                <button
                  onClick={() => handleRemoveItem(index)}
                  className="text-red-400 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Dropdown selector */}
              <div className="relative mb-3">
                <button
                  ref={(el) => {
                    buttonRefs.current[index] = el;
                  }}
                  onClick={() => toggleDropdown(index)}
                  className="w-full flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-left"
                >
                  <span className="font-medium dark:text-white">
                    {sel.selectedName}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {openDropdown === index &&
                  dropdownPos &&
                  createPortal(
                    <div
                      style={{
                        position: "fixed",
                        top: dropdownPos.top,
                        left: dropdownPos.left,
                        width: dropdownPos.width,
                        zIndex: 9999,
                      }}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto"
                    >
                      <input
                        type="text"
                        placeholder="Cari makanan..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-transparent dark:text-white focus:outline-none"
                        autoFocus
                      />
                      {matchResults[index]?.match_result.map((m) => (
                        <button
                          key={m.food_id}
                          onClick={() => {
                            handleSelectFood(index, m);
                            setOpenDropdown(null);
                            setDropdownPos(null);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between"
                        >
                          <span className="dark:text-white">{m.nama}</span>
                          <span className="text-xs text-gray-400">
                            {Math.round(m.similarity * 100)}%
                          </span>
                        </button>
                      ))}
                      {searchResults.length > 0 && (
                        <>
                          <div className="px-3 py-1 text-xs text-gray-400 bg-gray-50 dark:bg-gray-900">
                            Hasil pencarian
                          </div>
                          {searchResults.map((r) => (
                            <button
                              key={r.food_id}
                              onClick={() => {
                                handleSelectFood(index, r);
                                setOpenDropdown(null);
                                setDropdownPos(null);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                            >
                              {r.nama}
                            </button>
                          ))}
                        </>
                      )}
                    </div>,
                    document.body
                  )}
              </div>

              {/* Quantity controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleQuantityChange(index, -0.5)}
                  className="p-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  <Minus className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
                <span className="font-semibold dark:text-white min-w-[40px] text-center">
                  {sel.quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange(index, 0.5)}
                  className="p-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  <Plus className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
                <input
                  type="text"
                  value={sel.unit}
                  onChange={(e) =>
                    setSelections((prev) =>
                      prev.map((s, i) =>
                        i === index ? { ...s, unit: e.target.value } : s
                      )
                    )
                  }
                  className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-2 py-1 rounded text-sm dark:text-white"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={startClose}
            className="flex-1 py-3 text-gray-500 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={selections.length === 0}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition"
          >
            <Check className="w-4 h-4" /> Konfirmasi
          </button>
        </div>
      </div>
    </div>
  );
};

export default FoodVerificationModal;

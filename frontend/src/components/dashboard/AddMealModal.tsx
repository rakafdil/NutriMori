"use client";
import React, { useState } from "react";
import { Zap, Plus, Minus, X, PlusCircle } from "lucide-react";
import { NutritionInfo, FoodItem } from "@/types";

interface AddMealModalProps {
  mealInput: string;
  setMealInput: (value: string) => void;
  isAnalyzing: boolean;
  analyzedData: NutritionInfo | null;
  setAnalyzedData: (data: NutritionInfo | null) => void;
  onAnalyze: () => void;
  onSave: () => void;
  onClose: () => void;
  onReset: () => void;
}

const AddMealModal: React.FC<AddMealModalProps> = ({
  mealInput,
  setMealInput,
  isAnalyzing,
  analyzedData,
  setAnalyzedData,
  onAnalyze,
  onSave,
  onClose,
  onReset,
}) => {
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState("porsi");

  const updateItemQuantity = (index: number, delta: number) => {
    if (!analyzedData) return;

    const newItems = [...analyzedData.items];
    newItems[index].quantity = Math.max(0.5, newItems[index].quantity + delta);

    setAnalyzedData({
      ...analyzedData,
      items: newItems,
    });
  };

  const removeItem = (index: number) => {
    if (!analyzedData) return;

    const newItems = analyzedData.items.filter((_, i) => i !== index);
    setAnalyzedData({
      ...analyzedData,
      items: newItems,
    });
  };

  const addNewItem = () => {
    if (!analyzedData || !newItemName.trim()) return;

    const newItem: FoodItem = {
      name: newItemName.trim(),
      quantity: newItemQuantity,
      unit: newItemUnit,
    };

    setAnalyzedData({
      ...analyzedData,
      items: [...analyzedData.items, newItem],
    });

    setNewItemName("");
    setNewItemQuantity(1);
    setNewItemUnit("porsi");
  };

  const updateItemName = (index: number, name: string) => {
    if (!analyzedData) return;

    const newItems = [...analyzedData.items];
    newItems[index].name = name;

    setAnalyzedData({
      ...analyzedData,
      items: newItems,
    });
  };

  const updateItemUnit = (index: number, unit: string) => {
    if (!analyzedData) return;

    const newItems = [...analyzedData.items];
    newItems[index].unit = unit;

    setAnalyzedData({
      ...analyzedData,
      items: newItems,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 dark:bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-3xl p-6 shadow-2xl animate-fade-in-up border dark:border-gray-800 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold dark:text-white">Catat Makanan</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <textarea
          className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 min-h-[100px] focus:outline-emerald-500 mb-4 dark:text-white"
          placeholder="Contoh: Nasi goreng ayam dengan telur mata sapi dan kerupuk..."
          value={mealInput}
          onChange={(e) => setMealInput(e.target.value)}
        />

        {!analyzedData ? (
          <button
            onClick={onAnalyze}
            disabled={isAnalyzing || !mealInput}
            className="w-full bg-black dark:bg-emerald-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-emerald-700 disabled:opacity-50 transition"
          >
            {isAnalyzing ? (
              <>
                Analyzing <span className="animate-spin">⏳</span>
              </>
            ) : (
              <>
                Analyze with AI <Zap className="w-4 h-4 text-yellow-400" />
              </>
            )}
          </button>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {/* Detected Items List */}
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-xl">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                <span>🍽️</span> Makanan Terdeteksi
              </h4>
              <div className="space-y-2 mb-3">
                {analyzedData.items.map((item, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItemName(index, e.target.value)}
                        className="flex-1 bg-transparent border-b border-gray-300 dark:border-gray-600 px-2 py-1 focus:outline-none focus:border-emerald-500 dark:text-white font-medium"
                      />
                      <button
                        onClick={() => removeItem(index)}
                        className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateItemQuantity(index, -0.5)}
                        className="p-1 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                      >
                        <Minus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                      <span className="text-sm font-semibold dark:text-white min-w-[40px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateItemQuantity(index, 0.5)}
                        className="p-1 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                      >
                        <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                      <input
                        type="text"
                        value={item.unit || "porsi"}
                        onChange={(e) => updateItemUnit(index, e.target.value)}
                        className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 py-1 rounded text-sm focus:outline-none focus:border-emerald-500 dark:text-white"
                        placeholder="unit"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Item */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Tambah item manual
                </p>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Nama makanan..."
                    className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") addNewItem();
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2">
                    <button
                      onClick={() =>
                        setNewItemQuantity(Math.max(0.5, newItemQuantity - 0.5))
                      }
                      className="p-1"
                    >
                      <Minus className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                    </button>
                    <span className="text-sm font-semibold dark:text-white min-w-[30px] text-center">
                      {newItemQuantity}
                    </span>
                    <button
                      onClick={() => setNewItemQuantity(newItemQuantity + 0.5)}
                      className="p-1"
                    >
                      <Plus className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    placeholder="unit"
                    className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  />
                  <button
                    onClick={addNewItem}
                    disabled={!newItemName.trim()}
                    className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition disabled:opacity-50"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Summary Info (if available) */}
            {analyzedData.calories && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-emerald-900 dark:text-emerald-300 text-lg">
                    {analyzedData.calories} kcal
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      analyzedData.healthScore === "Green"
                        ? "bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : analyzedData.healthScore === "Yellow"
                        ? "bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : "bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}
                  >
                    {analyzedData.healthScore === "Green"
                      ? "Healthy Choice"
                      : "Consume Moderately"}
                  </span>
                </div>
                {analyzedData.summary && (
                  <p className="text-sm text-emerald-800 dark:text-emerald-300 mb-3">
                    {analyzedData.summary}
                  </p>
                )}
                {analyzedData.protein && (
                  <div className="grid grid-cols-3 gap-2 text-center text-xs text-gray-600 dark:text-gray-300">
                    <div className="bg-white dark:bg-gray-800 p-2 rounded">
                      Prot: {analyzedData.protein}g
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-2 rounded">
                      Carb: {analyzedData.carbs}g
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-2 rounded">
                      Fat: {analyzedData.fats}g
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={onReset}
                className="flex-1 py-3 text-gray-500 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
              >
                Reset
              </button>
              <button
                onClick={onSave}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none transition"
              >
                Save Meal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddMealModal;

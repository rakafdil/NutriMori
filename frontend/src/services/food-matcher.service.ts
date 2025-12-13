import { API_CONFIG } from "@/config/apiConfig";
import { MatchResult } from "@/types";

// Mock data - easily replaceable with real AI later
const MOCK_MATCH_RESULTS: MatchResult[] = [
  {
    candidate: "nasi goreng",
    match_result: [
      { food_id: 301, nama: "Nasi goreng ayam", similarity: 0.98 },
      { food_id: 302, nama: "Nasi goreng", similarity: 0.94 },
      { food_id: 303, nama: "Nasi putih", similarity: 0.86 },
    ],
  },
  {
    candidate: "tahu",
    match_result: [
      { food_id: 101, nama: "Tahu goreng", similarity: 0.96 },
      { food_id: 102, nama: "Tahu putih", similarity: 0.92 },
    ],
  },
  {
    candidate: "telur",
    match_result: [
      { food_id: 201, nama: "Telur ayam", similarity: 0.95 },
      { food_id: 202, nama: "Telur dadar", similarity: 0.9 },
    ],
  },
  {
    candidate: "tempe",
    match_result: [
      { food_id: 401, nama: "Tempe goreng", similarity: 0.97 },
      { food_id: 402, nama: "Tempe bacem", similarity: 0.91 },
    ],
  },
  {
    candidate: "es teh",
    match_result: [
      { food_id: 501, nama: "Es teh manis", similarity: 0.96 },
      { food_id: 502, nama: "Teh tawar", similarity: 0.88 },
    ],
  },
];

export interface VerifiedFood {
  candidate: string;
  selectedFoodId: number;
  selectedName: string;
  quantity: number;
  unit: string;
}

export interface AnalysisResult {
  analysisId: string;
  foodLogId: string;
  userId: string;
  nutritionFacts: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sugar: number;
    fiber: number;
    sodium: number;
    cholesterol: number;
  };
  micronutrients: {
    vitamin_c: string;
    iron: string;
    calcium: string;
    vitamin_a: string;
    vitamin_d: string;
  };
  healthTags: string[];
  analysisNotes: string;
  meetsGoals: boolean;
  warnings: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Match natural language input to food candidates
 * Replace this implementation with real AI later
 */
export async function matchFoods(input: string): Promise<MatchResult[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  const lower = input.toLowerCase();
  const results: MatchResult[] = [];

  // Simple keyword matching for mock
  for (const mock of MOCK_MATCH_RESULTS) {
    if (lower.includes(mock.candidate)) {
      results.push({ ...mock });
    }
  }

  // If no match, return a generic result
  if (results.length === 0) {
    results.push({
      candidate: input.trim(),
      match_result: [{ food_id: 999, nama: "Makanan umum", similarity: 0.7 }],
    });
  }

  return results;
}

/**
 * Generate nutrition analysis from verified foods
 * Replace with real backend call later
 */
export async function generateAnalysis(
  verifiedFoods: VerifiedFood[],
  userId: string
): Promise<AnalysisResult> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const now = new Date().toISOString();
  const baseCalories = verifiedFoods.reduce(
    (acc, f) => acc + f.quantity * 150,
    0
  );

  return {
    analysisId: crypto.randomUUID(),
    foodLogId: crypto.randomUUID(),
    userId,
    nutritionFacts: {
      calories: baseCalories,
      protein: Math.round(baseCalories * 0.08),
      carbs: Math.round(baseCalories * 0.12),
      fat: Math.round(baseCalories * 0.04),
      sugar: Math.round(baseCalories * 0.02),
      fiber: 8,
      sodium: 500,
      cholesterol: 50,
    },
    micronutrients: {
      vitamin_c: "10%",
      iron: "5%",
      calcium: "15%",
      vitamin_a: "20%",
      vitamin_d: "8%",
    },
    healthTags: ["Balanced", "Home Cooked"],
    analysisNotes: `Analisis untuk ${verifiedFoods.length} item makanan.`,
    meetsGoals: baseCalories < 800,
    warnings:
      baseCalories > 600 ? ["Kalori cukup tinggi untuk satu kali makan"] : [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Search foods for autocomplete via backend API
 */
export async function searchFoods(
  query: string,
  limit: number = 10
): Promise<{ food_id: number; nama: string }[]> {
  if (!query || query.trim().length < 1) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      q: query.trim(),
      limit: limit.toString(),
    });

    const response = await fetch(
      `${API_CONFIG.BASE_URL}/foods/autocomplete?${params}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error("Autocomplete API error:", response.status);
      return [];
    }

    const result = await response.json();
    console.debug("Autocomplete result:", result);

    if (result.success && Array.isArray(result.data)) {
      return (result.data as Array<{ id: number; name: string }>).map(
        (item) => ({
          food_id: item.id,
          nama: item.name,
        })
      );
    }

    return [];
  } catch (error) {
    console.error("Failed to fetch autocomplete:", error);
    return [];
  }
}

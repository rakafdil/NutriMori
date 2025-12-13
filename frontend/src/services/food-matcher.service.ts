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

/**
 * Match natural language input to food candidates
 * Replace this implementation with real AI later
 */
export async function matchFoods(input: string): Promise<MatchResult[]> {
  try {
    const response = await fetch(
      "https://jakij4ki-nutrimori-api.hf.space/api/match-foods",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: input }),
      }
    );

    if (!response.ok) {
      console.error("Parse food API error:", response.status);
      return [];
    }

    const result = await response.json();
    console.debug("Parse food result:", result);

    // Assuming the API returns MatchResult[] directly
    // If it has a wrapper like { success: true, data: MatchResult[] }, adjust accordingly
    if (Array.isArray(result)) {
      return result;
    }

    return [];
  } catch (error) {
    console.error("Failed to parse food:", error);
    return [];
  }
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

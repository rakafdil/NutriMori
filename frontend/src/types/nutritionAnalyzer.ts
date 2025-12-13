// types/nutrition.ts

export interface CreateNutritionAnalysisDto {
  foodLogId: string;
}

export interface NutritionFacts {
  calories: number;
  protein: string;
  carbs: string;
  fat: string;
  sugar: string;
  fiber?: string;
  sodium?: string;
  cholesterol?: string;
  items?: { name: string; quantity: number; unit?: string }[]; // added
}

export interface NutritionAnalysisResponse {
  analysisId: string;
  foodLogId: string;
  nutritionFacts: NutritionFacts;
  micronutrients: Record<string, string>;
  healthTags: string[];
  analysisNotes?: string; // Optional karena tidak selalu ada di list history
  warnings?: string[]; // Optional karena tidak selalu ada di list history
  createdAt: string;
  updatedAt?: string | null;
}

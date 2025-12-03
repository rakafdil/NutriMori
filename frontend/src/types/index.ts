export interface UserProfile {
  name: string;
  preferences: string[];
  allergies: string[];
  goals: string[];
  routine: {
    breakfast: string;
    lunch: string;
    dinner: string;
  };
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  sodium: string;
  healthScore: "Green" | "Yellow" | "Red";
  summary: string;
}

export interface Meal {
  id: string;
  name: string;
  timestamp: Date;
  nutrition: NutritionInfo;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  isStreaming?: boolean;
}

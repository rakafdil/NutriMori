export interface UserProfile {
  name: string;
  preferences: string[];
  allergies: string[];
  goals: string[];
  medicalHistory: string[];
  routine: {
    breakfast?: string;
    lunch?: string;
    dinner?: string;
  };
  budget?: number;
}

export interface FoodItem {
  name: string;
  quantity: number;
  unit?: string;
}

export interface NutritionInfo {
  items: FoodItem[];
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  sodium?: string;
  healthScore?: string;
  summary?: string;
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

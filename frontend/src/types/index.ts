export interface UserProfile {
  name?: string;
  username: string;
  age?: number;
  height?: number;
  weight?: number;
  preferences: string[]; // dari tastes
  allergies: string[]; // dari allergies
  goals: string; // dari goals (TEXT)
  medicalHistory: string[]; // dari medical_history
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

export type MatchResult = {
  candidate: string;
  match_result: {
    food_id: number;
    nama: string;
    similarity: number;
  }[];
};

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

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      name: string;
      email: string;
    };
    access_token: string;
    refresh_token: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

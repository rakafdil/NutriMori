export interface User {
  id: string;
  username?: string;
  email?: string;
  age?: number;
  height_cm?: number;
  weight_kg?: number;
  isFillingPreferences?: boolean;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  allergies: string[];
  goals?: string;
  tastes: string[];
  medical_history: string[];
  meal_times: Record<string, string>;
  daily_budget?: number;
  updated_at: string;
  users?: User;
}

export interface CreateUserPreferencesDto {
  userId: string;
  allergies?: string[];
  goals?: string[];
  tastes?: string[];
  medical_history?: string[];
  meal_times?: Record<string, string>;
  daily_budget?: number;
}

export interface UpdateUserPreferencesDto {
  allergies?: string[];
  goals?: string[];
  tastes?: string[];
  medical_history?: string[];
  meal_times?: Record<string, string>;
  daily_budget?: number;
}

export interface UpdateUserDto {
  username?: string;
  age?: number;
  height_cm?: number;
  weight_kg?: number;
  isFillingPreferences?: boolean;
}

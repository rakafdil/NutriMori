export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface User {
  id: string;
  created_at: string;
  updated_at: string;
  // Add other user fields as needed
}

export interface FoodLogItem {
  item_id: string;
  log_id: string;
  detected_name?: string;
  food_id?: string;
  confidence_score?: number;
  qty?: number;
  unit?: string;
  gram_weight?: number;
  created_at: string;
}

export interface FoodLog {
  log_id: string;
  user_id: string;
  raw_text?: string;
  meal_type?: MealType;
  created_at: string;
}

export interface FoodLogWithRelations extends FoodLog {
  food_log_items?: FoodLogItem[];
}

export interface NutrientTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
  sodium: number;
  fiber: number;
  cholesterol: number;
}

export interface DailySummary {
  date: Date;
  logsCount: number;
  logs: FoodLogWithRelations[];
  totals: NutrientTotals;
}

export interface WeeklySummary {
  startDate: Date;
  endDate: Date;
  totalLogs: number;
  dailyData: Record<string, FoodLogWithRelations[]>;
}

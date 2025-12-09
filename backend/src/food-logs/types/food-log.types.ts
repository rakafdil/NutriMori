export interface User {
  id: string;
  created_at: string;
  updated_at: string;
  // Add other user fields as needed
}

export interface Nutrients {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  sugar?: number;
  sodium?: number;
  fiber?: number;
  cholesterol?: number;
  [key: string]: number | undefined;
}

export interface FoodNutrient {
  id: string;
  food_item_id: string;
  nutrient_name: string;
  amount: number;
  unit: string;
  created_at: string;
  updated_at: string;
}

export interface FoodCategory {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface FoodItem {
  id: string;
  name: string;
  description?: string;
  category_id?: string;
  created_at: string;
  updated_at: string;
  food_nutrients?: FoodNutrient[];
  food_categories?: FoodCategory;
}

export interface NutritionRule {
  id: string;
  name: string;
  description?: string;
  rule_type: string;
  conditions: unknown;
  created_at: string;
  updated_at: string;
}

export interface FoodLog {
  id: string;
  user_id: string;
  text: string;
  normalized_text?: string;
  nutrients?: Nutrients;
  food_item_id?: string;
  rule_id?: string;
  created_at: string;
  updated_at: string;
}

export interface FoodLogWithRelations extends FoodLog {
  users?: User;
  food_items?: FoodItem;
  nutrition_rules?: NutritionRule;
}

export interface DailySummary {
  date: Date;
  logsCount: number;
  logs: FoodLogWithRelations[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sugar: number;
    sodium: number;
    fiber: number;
    cholesterol: number;
  };
}

export interface WeeklySummary {
  startDate: Date;
  endDate: Date;
  totalLogs: number;
  dailyData: Record<string, FoodLogWithRelations[]>;
}

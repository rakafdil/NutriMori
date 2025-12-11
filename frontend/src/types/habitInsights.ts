export type HabitInsightsPeriod = "weekly" | "monthly" | "yearly" | "overall";

export interface HabitInsightsParams {
  period: HabitInsightsPeriod;
  startDate?: string;
  endDate?: string;
}

export interface CalorieData {
  day: string;
  cal: number;
  date?: string;
}

export interface MacronutrientData {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface MealTimingSlot {
  slot: number;
  calories: number;
}

export interface MealTimingDay {
  day: number;
  dayName: string;
  slots: MealTimingSlot[];
}

export interface AIPatternDiscovery {
  title: string;
  description: string;
  highlights: string[];
}

export interface HabitInsightsResponse {
  statusCode: boolean;
  data: {
    period: HabitInsightsPeriod;
    startDate: string;
    endDate: string;
    calorieIntake: CalorieData[];
    macronutrients: MacronutrientData[];
    mealTiming: MealTimingDay[];
    aiPatternDiscovery: AIPatternDiscovery;
    dietScore: string;
  };
  message?: string;
}

export type HabitInsightsPeriod = "weekly" | "monthly" | "yearly" | "overall";

export type PatternType = "positive" | "negative" | "neutral";
export type PatternImpact = "High" | "Medium" | "Low";
export type TrendType = "increasing" | "decreasing" | "stable";

export interface DateRange {
  start: string;
  end: string;
}

export interface Pattern {
  type: PatternType;
  message: string;
  impact: PatternImpact;
  frequency?: string;
  streak?: number;
  daysDetected?: string[];
}

export interface HabitInsightsData {
  userId: string;
  period: HabitInsightsPeriod;
  dateRange: DateRange;
  daysAnalyzed: number;
  totalMeals: number;
  averageCalories: number;
  patterns: Pattern[];
  summary: string;
  recommendations: string[];
  healthScore: number;
  generatedAt: string;
}

// Alias untuk response dari API
export type HabitInsightsResponse = HabitInsightsData;

export interface PatternSummaryData {
  period: HabitInsightsPeriod;
  dateRange?: DateRange;
  patterns: Pattern[];
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
}

export interface HealthScoreHistoryItem {
  month: string;
  score: number;
  trend: TrendType;
}

export interface HealthScoreHistoryData {
  history: HealthScoreHistoryItem[];
  currentScore: number;
  averageScore: number;
  improvement: number;
}

export interface RefreshInsightPayload {
  period: HabitInsightsPeriod;
  forceRefresh: boolean;
}

export interface HabitInsightsQueryParams {
  period: HabitInsightsPeriod;
  startDate?: string;
  endDate?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface CacheInvalidateParams {
  period?: HabitInsightsPeriod;
}

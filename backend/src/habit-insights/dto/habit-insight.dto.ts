import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export enum PeriodType {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  OVERALL = 'overall',
}

export class GetHabitInsightDto {
  @ApiProperty({
    description: 'Analysis period type',
    enum: PeriodType,
    example: 'weekly',
  })
  @IsEnum(PeriodType)
  period: PeriodType;

  @ApiPropertyOptional({
    description:
      'Start date for analysis (optional - auto-calculated based on period if not provided)',
    example: '2023-10-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for analysis (defaults to today)',
    example: '2023-10-07',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class DateRangeDto {
  @ApiProperty({ description: 'Start date', example: '2023-10-01' })
  start: string;

  @ApiProperty({ description: 'End date', example: '2023-10-07' })
  end: string;
}

export class HabitPatternDto {
  @ApiProperty({
    description: 'Pattern type',
    example: 'negative',
    enum: ['positive', 'negative', 'neutral'],
  })
  type: 'positive' | 'negative' | 'neutral';

  @ApiProperty({
    description: 'Pattern message',
    example: 'Asupan gula berlebih di akhir pekan',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'Days when pattern detected',
    example: ['Saturday', 'Sunday'],
    type: [String],
  })
  daysDetected?: string[];

  @ApiPropertyOptional({
    description: 'Streak count for positive patterns',
    example: 5,
  })
  streak?: number;

  @ApiPropertyOptional({
    description: 'Frequency of pattern occurrence',
    example: 'Daily',
  })
  frequency?: string;

  @ApiPropertyOptional({
    description: 'Impact level',
    example: 'High',
    enum: ['Low', 'Medium', 'High'],
  })
  impact?: string;
}

export class BudgetPatternDto {
  @ApiProperty({
    description: 'Pattern type',
    example: 'negative',
    enum: ['positive', 'negative', 'neutral'],
  })
  type: 'positive' | 'negative' | 'neutral';

  @ApiProperty({
    description: 'Pattern message',
    example: 'Pengeluaran di akhir pekan lebih tinggi dari hari kerja',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'Days affected by this pattern',
    type: [String],
  })
  daysAffected?: string[];

  @ApiPropertyOptional({
    description: 'Impact level',
    example: 'High',
    enum: ['Low', 'Medium', 'High'],
  })
  impact?: string;
}

export class BudgetInsightDto {
  @ApiProperty({ description: 'User daily budget (IDR)', example: 50000 })
  dailyBudget: number;

  @ApiProperty({ description: 'Budget tier', example: 'medium' })
  budgetTier: string;

  @ApiProperty({ description: 'Average daily spending (IDR)', example: 45000 })
  averageDailySpending: number;

  @ApiProperty({ description: 'Total spending in period (IDR)', example: 315000 })
  totalSpending: number;

  @ApiProperty({ description: 'Days within budget', example: 5 })
  daysWithinBudget: number;

  @ApiProperty({ description: 'Days over budget', example: 2 })
  daysOverBudget: number;

  @ApiProperty({ 
    description: 'Spending trend',
    example: 'stable',
    enum: ['increasing', 'decreasing', 'stable']
  })
  spendingTrend: 'increasing' | 'decreasing' | 'stable';

  @ApiProperty({ description: 'Budget utilization percentage', example: 90 })
  budgetUtilization: number;

  @ApiProperty({ 
    description: 'Budget patterns detected',
    type: [BudgetPatternDto]
  })
  budgetPatterns: BudgetPatternDto[];

  @ApiProperty({ 
    description: 'Budget recommendations',
    type: [String]
  })
  budgetRecommendations: string[];
}



export class HabitInsightResponseDto {
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({
    description: 'Analysis period type',
    enum: PeriodType,
    example: 'weekly',
  })
  period: PeriodType;

  @ApiProperty({ description: 'Date range', type: DateRangeDto })
  dateRange: DateRangeDto;

  @ApiProperty({ description: 'Total days analyzed', example: 7 })
  daysAnalyzed: number;

  @ApiProperty({ description: 'Total meals logged', example: 21 })
  totalMeals: number;

  @ApiProperty({ description: 'Average daily calories', example: 2100 })
  averageCalories: number;

  @ApiProperty({
    description: 'Identified habit patterns',
    type: [HabitPatternDto],
  })
  patterns: HabitPatternDto[];

  @ApiProperty({ description: 'Overall summary from ML analysis' })
  summary: string;

  @ApiProperty({ description: 'Key recommendations from ML', type: [String] })
  recommendations: string[];

  @ApiProperty({ description: 'Health score (0-100)', example: 78 })
  healthScore: number;

  @ApiProperty({ description: 'Generated timestamp' })
  generatedAt: string;

  @ApiPropertyOptional({ 
    description: 'Budget insight analysis',
    type: BudgetInsightDto
  })
  budgetInsight?: BudgetInsightDto;
}

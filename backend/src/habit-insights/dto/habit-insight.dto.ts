import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class GetHabitInsightDto {
    @ApiProperty({
        description: 'User ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    userId: string;

    @ApiPropertyOptional({
        description: 'Start date for analysis (defaults to 3 weeks ago)',
        example: '2025-11-17',
    })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({
        description: 'End date for analysis (defaults to today)',
        example: '2025-12-08',
    })
    @IsOptional()
    @IsDateString()
    endDate?: string;
}

export class HabitPatternDto {
    @ApiProperty({ description: 'Pattern name', example: 'High sugar intake on weekends' })
    pattern: string;

    @ApiProperty({ description: 'Frequency of pattern', example: 'Weekly' })
    frequency: string;

    @ApiProperty({ description: 'Impact level', example: 'High', enum: ['Low', 'Medium', 'High'] })
    impact: string;

    @ApiProperty({ description: 'Detailed description' })
    description: string;
}

export class NutrientTrendDto {
    @ApiProperty({ description: 'Nutrient name', example: 'Protein' })
    nutrient: string;

    @ApiProperty({ description: 'Average daily intake', example: 65.5 })
    averageDaily: number;

    @ApiProperty({ description: 'Trend direction', example: 'increasing', enum: ['increasing', 'decreasing', 'stable'] })
    trend: string;

    @ApiProperty({ description: 'Recommended intake', example: 70 })
    recommended: number;

    @ApiProperty({ description: 'Status', example: 'Below target', enum: ['Below target', 'On target', 'Above target'] })
    status: string;
}

export class MealTimingPatternDto {
    @ApiProperty({ description: 'Meal type', example: 'Breakfast' })
    mealType: string;

    @ApiProperty({ description: 'Average time', example: '07:30' })
    averageTime: string;

    @ApiProperty({ description: 'Consistency score (0-100)', example: 85 })
    consistency: number;

    @ApiProperty({ description: 'Analysis note' })
    note: string;
}

export class HabitInsightResponseDto {
    @ApiProperty({ description: 'User ID' })
    userId: string;

    @ApiProperty({ description: 'Analysis period start date' })
    periodStart: string;

    @ApiProperty({ description: 'Analysis period end date' })
    periodEnd: string;

    @ApiProperty({ description: 'Total days analyzed', example: 21 })
    daysAnalyzed: number;

    @ApiProperty({ description: 'Total meals logged', example: 63 })
    totalMeals: number;

    @ApiProperty({ description: 'Overall summary from ML analysis' })
    summary: string;

    @ApiProperty({ description: 'Key recommendations from ML', type: [String] })
    recommendations: string[];

    @ApiProperty({ description: 'Identified habit patterns', type: [HabitPatternDto] })
    patterns: HabitPatternDto[];

    @ApiProperty({ description: 'Nutrient trends over time', type: [NutrientTrendDto] })
    nutrientTrends: NutrientTrendDto[];

    @ApiProperty({ description: 'Meal timing patterns', type: [MealTimingPatternDto] })
    mealTimings: MealTimingPatternDto[];

    @ApiProperty({ description: 'Health score (0-100)', example: 78 })
    healthScore: number;

    @ApiProperty({ description: 'Generated timestamp' })
    generatedAt: string;
}
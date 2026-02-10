import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';

export enum MealPeriod {
    BREAKFAST = 'breakfast',
    LUNCH = 'lunch',
    DINNER = 'dinner',
    SNACK = 'snack',
}

export enum BudgetRuleSeverity {
    INFO = 'info',
    WARNING = 'warning',
    CRITICAL = 'critical',
}

export class CreateBudgetRuleDto {
    @ApiProperty({ description: 'Rule name', example: 'Hemat Budget Sarapan' })
    @IsString()
    ruleName: string;

    @ApiProperty({
        description: 'Rule description',
        example: 'Alokasikan maksimal 25% budget harian untuk sarapan',
    })
    @IsString()
    description: string;

    @ApiPropertyOptional({
        description: 'Minimum daily budget for this rule (IDR)',
        example: 25000,
    })
    @IsNumber()
    @IsOptional()
    @Min(0)
    minDailyBudget?: number;

    @ApiPropertyOptional({
        description: 'Maximum daily budget for this rule (IDR)',
        example: 100000,
    })
    @IsNumber()
    @IsOptional()
    @Min(0)
    maxDailyBudget?: number;

    @ApiPropertyOptional({
        description: 'Target meal period',
        enum: MealPeriod,
        example: MealPeriod.BREAKFAST,
    })
    @IsEnum(MealPeriod)
    @IsOptional()
    mealPeriod?: MealPeriod;

    @ApiPropertyOptional({
        description: 'Budget percentage allocation for the meal',
        example: 25,
    })
    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(100)
    budgetPercentage?: number;

    @ApiProperty({
        description: 'Rule severity',
        enum: BudgetRuleSeverity,
        example: BudgetRuleSeverity.INFO,
    })
    @IsEnum(BudgetRuleSeverity)
    severity: BudgetRuleSeverity;
}

export class UpdateBudgetRuleDto {
    @ApiPropertyOptional({ description: 'Rule name' })
    @IsString()
    @IsOptional()
    ruleName?: string;

    @ApiPropertyOptional({ description: 'Rule description' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ description: 'Minimum daily budget (IDR)' })
    @IsNumber()
    @IsOptional()
    @Min(0)
    minDailyBudget?: number;

    @ApiPropertyOptional({ description: 'Maximum daily budget (IDR)' })
    @IsNumber()
    @IsOptional()
    @Min(0)
    maxDailyBudget?: number;

    @ApiPropertyOptional({
        description: 'Target meal period',
        enum: MealPeriod,
    })
    @IsEnum(MealPeriod)
    @IsOptional()
    mealPeriod?: MealPeriod;

    @ApiPropertyOptional({ description: 'Budget percentage allocation' })
    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(100)
    budgetPercentage?: number;

    @ApiPropertyOptional({
        description: 'Rule severity',
        enum: BudgetRuleSeverity,
    })
    @IsEnum(BudgetRuleSeverity)
    @IsOptional()
    severity?: BudgetRuleSeverity;

    @ApiPropertyOptional({ description: 'Is rule active' })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class BudgetAnalysisQueryDto {
    @ApiPropertyOptional({
        description: 'Start date for analysis',
        example: '2026-01-01',
    })
    @IsString()
    @IsOptional()
    startDate?: string;

    @ApiPropertyOptional({
        description: 'End date for analysis',
        example: '2026-01-23',
    })
    @IsString()
    @IsOptional()
    endDate?: string;
}

export class FoodRecommendationQueryDto {
    @ApiPropertyOptional({
        description: 'Target meal period',
        enum: MealPeriod,
    })
    @IsEnum(MealPeriod)
    @IsOptional()
    mealPeriod?: MealPeriod;

    @ApiPropertyOptional({
        description: 'Maximum number of recommendations',
        example: 5,
    })
    @IsNumber()
    @IsOptional()
    @Min(1)
    @Max(20)
    limit?: number;
}

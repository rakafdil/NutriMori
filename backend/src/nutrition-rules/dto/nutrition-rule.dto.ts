import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export enum RuleSeverity {
  WARNING = 'warning',
  SUGGESTION = 'suggestion',
  CRITICAL = 'critical',
}

export class CreateNutritionRuleDto {
  @IsString()
  ruleName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  minValue?: number;

  @IsOptional()
  @IsNumber()
  maxValue?: number;

  @IsOptional()
  @IsString()
  nutrient?: string;

  @IsOptional()
  @IsEnum(RuleSeverity)
  severity?: RuleSeverity;
}

export class UpdateNutritionRuleDto {
  @IsOptional()
  @IsString()
  ruleName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  minValue?: number;

  @IsOptional()
  @IsNumber()
  maxValue?: number;

  @IsOptional()
  @IsString()
  nutrient?: string;

  @IsOptional()
  @IsEnum(RuleSeverity)
  severity?: RuleSeverity;
}

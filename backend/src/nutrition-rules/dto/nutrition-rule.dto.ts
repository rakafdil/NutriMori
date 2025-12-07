import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export enum RuleSeverity {
  WARNING = 'warning',
  SUGGESTION = 'suggestion',
  CRITICAL = 'critical',
}

export class CreateNutritionRuleDto {
  @ApiProperty({ 
    description: 'Rule name', 
    example: 'Daily Sugar Limit'
  })
  @IsString()
  ruleName: string;

  @ApiPropertyOptional({ 
    description: 'Rule description', 
    example: 'Maximum daily sugar intake for healthy diet'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ 
    description: 'Minimum value for nutrient', 
    example: 0
  })
  @IsOptional()
  @IsNumber()
  minValue?: number;

  @ApiPropertyOptional({ 
    description: 'Maximum value for nutrient', 
    example: 50
  })
  @IsOptional()
  @IsNumber()
  maxValue?: number;

  @ApiPropertyOptional({ 
    description: 'Nutrient type', 
    example: 'sugar',
    enum: ['calories', 'protein', 'carbs', 'fat', 'sugar', 'sodium', 'fiber', 'cholesterol']
  })
  @IsOptional()
  @IsString()
  nutrient?: string;

  @ApiPropertyOptional({ 
    description: 'Severity level', 
    example: 'warning',
    enum: RuleSeverity
  })
  @IsOptional()
  @IsEnum(RuleSeverity)
  severity?: RuleSeverity;
}

export class UpdateNutritionRuleDto {
  @ApiPropertyOptional({ 
    description: 'Rule name', 
    example: 'Daily Sugar Limit'
  })
  @IsOptional()
  @IsString()
  ruleName?: string;

  @ApiPropertyOptional({ 
    description: 'Rule description', 
    example: 'Maximum daily sugar intake for healthy diet'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ 
    description: 'Minimum value for nutrient', 
    example: 0
  })
  @IsOptional()
  @IsNumber()
  minValue?: number;

  @ApiPropertyOptional({ 
    description: 'Maximum value for nutrient', 
    example: 50
  })
  @IsOptional()
  @IsNumber()
  maxValue?: number;

  @ApiPropertyOptional({ 
    description: 'Nutrient type', 
    example: 'sugar',
    enum: ['calories', 'protein', 'carbs', 'fat', 'sugar', 'sodium', 'fiber', 'cholesterol']
  })
  @IsOptional()
  @IsString()
  nutrient?: string;

  @ApiPropertyOptional({ 
    description: 'Severity level', 
    example: 'warning',
    enum: RuleSeverity
  })
  @IsOptional()
  @IsEnum(RuleSeverity)
  severity?: RuleSeverity;
}
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * Internal DTO for nutrition calculations (uses numbers)
 */
export class NutritionFactsNumericDto {
  @ApiProperty({ description: 'Total calories', example: 450 })
  @IsNumber()
  calories: number;

  @ApiProperty({ description: 'Total protein in grams', example: 30 })
  @IsNumber()
  protein: number;

  @ApiProperty({ description: 'Total carbohydrates in grams', example: 50 })
  @IsNumber()
  carbs: number;

  @ApiProperty({ description: 'Total fat in grams', example: 15 })
  @IsNumber()
  fat: number;

  @ApiProperty({ description: 'Total sugar in grams', example: 5 })
  @IsNumber()
  sugar: number;

  @ApiPropertyOptional({ description: 'Total fiber in grams', example: 8 })
  @IsNumber()
  @IsOptional()
  fiber?: number;

  @ApiPropertyOptional({ description: 'Total sodium in mg', example: 500 })
  @IsNumber()
  @IsOptional()
  sodium?: number;

  @ApiPropertyOptional({ description: 'Total cholesterol in mg', example: 50 })
  @IsNumber()
  @IsOptional()
  cholesterol?: number;
}

/**
 * Response DTO for nutrition facts (formatted with units)
 */
export class NutritionFactsDto {
  @ApiProperty({ description: 'Total calories', example: 450 })
  @IsNumber()
  calories: number;

  @ApiProperty({ description: 'Total protein with unit', example: '30g' })
  @IsString()
  protein: string;

  @ApiProperty({ description: 'Total carbohydrates with unit', example: '50g' })
  @IsString()
  carbs: string;

  @ApiProperty({ description: 'Total fat with unit', example: '15g' })
  @IsString()
  fat: string;

  @ApiProperty({ description: 'Total sugar with unit', example: '5g' })
  @IsString()
  sugar: string;

  @ApiPropertyOptional({ description: 'Total fiber with unit', example: '8g' })
  @IsString()
  @IsOptional()
  fiber?: string;

  @ApiPropertyOptional({ description: 'Total sodium with unit', example: '500mg' })
  @IsString()
  @IsOptional()
  sodium?: string;

  @ApiPropertyOptional({ description: 'Total cholesterol with unit', example: '50mg' })
  @IsString()
  @IsOptional()
  cholesterol?: string;
}

export class MicronutrientsDto {
  @ApiPropertyOptional({ description: 'Vitamin C percentage', example: '10%' })
  @IsString()
  @IsOptional()
  vitamin_c?: string;

  @ApiPropertyOptional({ description: 'Iron percentage', example: '5%' })
  @IsString()
  @IsOptional()
  iron?: string;

  @ApiPropertyOptional({ description: 'Calcium percentage', example: '15%' })
  @IsString()
  @IsOptional()
  calcium?: string;

  @ApiPropertyOptional({ description: 'Vitamin A percentage', example: '20%' })
  @IsString()
  @IsOptional()
  vitamin_a?: string;

  @ApiPropertyOptional({ description: 'Vitamin D percentage', example: '8%' })
  @IsString()
  @IsOptional()
  vitamin_d?: string;

  // Allow additional micronutrients
  [key: string]: any;
}

export class NutritionAnalysisResponseDto {
  @ApiProperty({ 
    description: 'Unique analysis ID', 
    example: '123e4567-e89b-12d3-a456-426614174000' 
  })
  @IsUUID()
  analysisId: string;

  @ApiProperty({ 
    description: 'Related food log ID', 
    example: '123e4567-e89b-12d3-a456-426614174001' 
  })
  @IsUUID()
  foodLogId: string;

  @ApiProperty({ 
    description: 'Nutrition facts summary', 
    type: NutritionFactsDto,
    example: {
      calories: 450,
      protein: '30g',
      carbs: '50g',
      fat: '15g',
      sugar: '5g'
    }
  })
  @IsObject()
  nutritionFacts: NutritionFactsDto;

  @ApiProperty({ 
    description: 'Micronutrients data', 
    type: MicronutrientsDto,
    example: {
      vitamin_c: '10%',
      iron: '5%'
    }
  })
  @IsObject()
  micronutrients: MicronutrientsDto;

  @ApiProperty({ 
    description: 'Health-related tags', 
    example: ['High Protein', 'Low Sugar'] 
  })
  @IsArray()
  @IsString({ each: true })
  healthTags: string[];

  @ApiPropertyOptional({ description: 'Warning messages', example: ['Exceeds daily sodium limit'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  warnings?: string[];

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Last update timestamp' })
  updatedAt?: Date;
}

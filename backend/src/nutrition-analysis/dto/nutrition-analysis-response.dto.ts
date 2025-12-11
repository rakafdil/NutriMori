import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class NutritionFactsDto {
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
  @ApiProperty({ description: 'Unique analysis ID', example: 'uuid-string' })
  @IsUUID()
  analysisId: string;

  @ApiProperty({ description: 'Related food log ID', example: 'uuid-string' })
  @IsUUID()
  foodLogId: string;

  @ApiProperty({ description: 'User ID', example: 'uuid-string' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Nutrition facts summary', type: NutritionFactsDto })
  @IsObject()
  nutritionFacts: NutritionFactsDto;

  @ApiProperty({ description: 'Micronutrients data', type: MicronutrientsDto })
  @IsObject()
  micronutrients: MicronutrientsDto;

  @ApiProperty({ description: 'Health-related tags', example: ['High Protein', 'Low Sugar'] })
  @IsArray()
  @IsString({ each: true })
  healthTags: string[];

  @ApiPropertyOptional({ description: 'Analysis notes or recommendations' })
  @IsString()
  @IsOptional()
  analysisNotes?: string;

  @ApiPropertyOptional({ description: 'Whether the meal meets user goals', example: true })
  @IsBoolean()
  @IsOptional()
  meetsGoals?: boolean;

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

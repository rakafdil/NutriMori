import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class NutritionLimitsDto {
  @ApiProperty({ description: 'Maximum daily calories (kcal)' })
  @IsNumber()
  max_calories: number;

  @ApiProperty({ description: 'Maximum daily protein (g)' })
  @IsNumber()
  max_protein: number;

  @ApiProperty({ description: 'Maximum daily carbohydrates (g)' })
  @IsNumber()
  max_carbs: number;

  @ApiProperty({ description: 'Maximum daily fat (g)' })
  @IsNumber()
  max_fat: number;

  @ApiPropertyOptional({ description: 'Maximum daily sugar (g)' })
  @IsOptional()
  @IsNumber()
  max_sugar?: number;

  @ApiPropertyOptional({ description: 'Maximum daily fiber (g)' })
  @IsOptional()
  @IsNumber()
  max_fiber?: number;

  @ApiPropertyOptional({ description: 'Maximum daily sodium (mg)' })
  @IsOptional()
  @IsNumber()
  max_sodium?: number;

  @ApiPropertyOptional({ description: 'Maximum daily cholesterol (mg)' })
  @IsOptional()
  @IsNumber()
  max_cholesterol?: number;

  @ApiPropertyOptional({ description: 'AI explanation of how the limits were calculated' })
  @IsOptional()
  @IsString()
  explanation?: string;
}

export class CalculateNutritionLimitsInputDto {
  @ApiProperty({ description: 'User age' })
  @IsNumber()
  age: number;

  @ApiProperty({ description: 'User height in cm' })
  @IsNumber()
  height_cm: number;

  @ApiProperty({ description: 'User weight in kg' })
  @IsNumber()
  weight_kg: number;

  @ApiPropertyOptional({ description: 'User gender (male/female)' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({
    description: 'User goals (e.g., weight_loss, muscle_gain, maintain)',
    example: ['weight_loss', 'healthy_eating'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  goals?: string[];

  @ApiPropertyOptional({
    description: 'User allergies',
    example: ['gluten', 'dairy'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @ApiPropertyOptional({
    description: 'User medical history',
    example: ['diabetes', 'hypertension'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  medical_history?: string[];

  @ApiPropertyOptional({
    description: 'Activity level (sedentary, light, moderate, active, very_active)',
    example: 'moderate',
  })
  @IsOptional()
  @IsString()
  activity_level?: string;
}

export class NutritionLimitsResponseDto {
  @ApiProperty({ description: 'Whether the calculation was successful' })
  success: boolean;

  @ApiProperty({ description: 'Calculated nutrition limits' })
  data?: NutritionLimitsDto;

  @ApiPropertyOptional({ description: 'AI explanation/reasoning' })
  explanation?: string;

  @ApiPropertyOptional({ description: 'Error message if failed' })
  error?: string;
}

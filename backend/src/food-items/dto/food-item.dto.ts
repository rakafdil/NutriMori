import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class NutrientsDto {
  @ApiPropertyOptional({ description: 'Calories (kcal)', example: 250 })
  @IsOptional()
  @IsNumber()
  calories?: number;

  @ApiPropertyOptional({ description: 'Protein (g)', example: 15 })
  @IsOptional()
  @IsNumber()
  protein?: number;

  @ApiPropertyOptional({ description: 'Carbohydrates (g)', example: 30 })
  @IsOptional()
  @IsNumber()
  carbs?: number;

  @ApiPropertyOptional({ description: 'Fat (g)', example: 10 })
  @IsOptional()
  @IsNumber()
  fat?: number;

  @ApiPropertyOptional({ description: 'Sugar (g)', example: 5 })
  @IsOptional()
  @IsNumber()
  sugar?: number;

  @ApiPropertyOptional({ description: 'Sodium (mg)', example: 200 })
  @IsOptional()
  @IsNumber()
  sodium?: number;

  @ApiPropertyOptional({ description: 'Fiber (g)', example: 3 })
  @IsOptional()
  @IsNumber()
  fiber?: number;

  @ApiPropertyOptional({ description: 'Cholesterol (mg)', example: 50 })
  @IsOptional()
  @IsNumber()
  cholesterol?: number;
}

export class CreateFoodItemDto {
  @ApiProperty({ description: 'Food item name', example: 'Nasi Goreng' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Food description', example: 'Indonesian fried rice' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Brand name', example: 'Warung Makan' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ description: 'Serving size', example: '1 porsi (300g)' })
  @IsOptional()
  @IsString()
  servingSize?: string;

  @ApiPropertyOptional({ description: 'Nutritional information', type: NutrientsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NutrientsDto)
  nutrients?: NutrientsDto;

  @ApiPropertyOptional({ 
    description: 'Food categories', 
    example: ['Indonesian', 'main course'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];
}

export class UpdateFoodItemDto {
  @ApiPropertyOptional({ description: 'Food item name', example: 'Nasi Goreng' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Food description', example: 'Indonesian fried rice' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Brand name', example: 'Warung Makan' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ description: 'Serving size', example: '1 porsi (300g)' })
  @IsOptional()
  @IsString()
  servingSize?: string;
}
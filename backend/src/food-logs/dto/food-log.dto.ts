import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateFoodLogDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({
    description: 'Raw text input from user',
    example: 'Saya makan nasi goreng 2 porsi',
  })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({
    description: 'Normalized text after AI processing',
    example: 'nasi goreng (2 porsi)',
  })
  @IsOptional()
  @IsString()
  normalizedText?: string;

  @ApiPropertyOptional({
    description: 'Nutritional information extracted by AI',
    example: { calories: 500, protein: 15, carbs: 70, fat: 15 },
  })
  @IsOptional()
  @IsObject()
  nutrients?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Food item ID if matched from database',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  foodItemId?: string;

  @ApiPropertyOptional({
    description: 'Nutrition rule ID if triggered',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  ruleId?: string;
}

export class UpdateFoodLogDto {
  @ApiPropertyOptional({
    description: 'Raw text input from user',
    example: 'Saya makan nasi goreng 2 porsi',
  })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({
    description: 'Normalized text after AI processing',
    example: 'nasi goreng (2 porsi)',
  })
  @IsOptional()
  @IsString()
  normalizedText?: string;

  @ApiPropertyOptional({
    description: 'Nutritional information',
    example: { calories: 500, protein: 15, carbs: 70, fat: 15 },
  })
  @IsOptional()
  @IsObject()
  nutrients?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Food item ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  foodItemId?: string;

  @ApiPropertyOptional({
    description: 'Nutrition rule ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  ruleId?: string;
}

export class LogFoodInputDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Food description in natural language',
    example: 'Saya makan nasi goreng 2 porsi dan minum teh manis',
  })
  @IsString()
  text: string;
}

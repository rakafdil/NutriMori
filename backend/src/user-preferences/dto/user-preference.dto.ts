import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  IsObject,
  IsInt,
} from 'class-validator';

export class CreateUserPreferenceDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({
    description: 'Allergies / Foods to Avoid',
    example: ['nuts', 'seafood', 'gluten'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @ApiPropertyOptional({
    description: 'Health Goals',
    example: 'bulking',
  })
  @IsOptional()
  @IsString()
  goals?: string;

  @ApiPropertyOptional({
    description: 'Food taste preferences',
    example: ['sweet', 'savory', 'spicy'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tastes?: string[];

  @ApiPropertyOptional({
    description: 'Medical history or conditions',
    example: ['diabetes', 'hypertension'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  medical_history?: string[];

  @ApiPropertyOptional({
    description:
      'Meal times (JSON object or array). Example: ["08:00","12:30","19:00"] or {"breakfast":"08:00"}',
    example: ['08:00', '12:30', '19:00'],
    type: Object,
  })
  @IsOptional()
  @IsObject()
  meal_times?: Record<string, unknown> | unknown[];

  @ApiPropertyOptional({
    description: 'Daily budget (integer amount)',
    example: 50000,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  daily_budget?: number;
}

export class UpdateUserPreferenceDto {
  @ApiPropertyOptional({
    description: 'Allergies / Foods to Avoid',
    example: ['nuts', 'seafood', 'gluten'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @ApiPropertyOptional({
    description: 'Health Goals',
    example: 'bulking',
  })
  @IsOptional()
  @IsString()
  goals?: string[];

  @ApiPropertyOptional({
    description: 'Food taste preferences',
    example: ['sweet', 'savory', 'spicy'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tastes?: string[];

  @ApiPropertyOptional({
    description: 'Medical history or conditions',
    example: ['diabetes', 'hypertension'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  medical_history?: string[];

  @ApiPropertyOptional({
    description:
      'Meal times (JSON object or array). Example: ["08:00","12:30","19:00"] or {"breakfast":"08:00"}',
    example: ['08:00', '12:30', '19:00'],
    type: Object,
  })
  @IsOptional()
  @IsObject()
  meal_times?: Record<string, unknown> | unknown[];

  @ApiPropertyOptional({
    description: 'Daily budget (integer amount)',
    example: 50000,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  daily_budget?: number;
}

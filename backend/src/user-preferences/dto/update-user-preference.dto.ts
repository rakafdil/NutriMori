import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserPreferenceDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  goals?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tastes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  medical_history?: string[];

  @IsOptional()
  @ApiPropertyOptional({
    description: 'Meal times (list of times or labels)',
    example: ['08:00', '12:30', '19:00'],
  })
  @IsArray()
  @IsString({ each: true })
  meal_times?: string[];

  @IsOptional()
  @ApiPropertyOptional({
    description: 'Daily budget (integer amount)',
    example: 50000,
  })
  @IsInt()
  daily_budget?: number;
}

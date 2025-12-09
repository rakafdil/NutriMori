import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import * as types from '../types';

export class UpdateFoodLogDto {
  @IsOptional()
  @IsString()
  rawText?: string;

  @IsOptional()
  @IsEnum(['breakfast', 'lunch', 'dinner', 'snack'])
  mealType?: types.MealType;

  @IsOptional()
  @IsBoolean()
  parsedByLlm?: boolean;
}

import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import * as types from '../types';

export class CreateFoodLogDto {
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

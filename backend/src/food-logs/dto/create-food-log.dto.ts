import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import * as types from '../types';

export class CreateFoodLogDto {
  @IsUUID()
  userId: string;

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

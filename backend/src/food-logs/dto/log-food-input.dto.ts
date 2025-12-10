import { IsEnum, IsOptional, IsString } from 'class-validator';
import * as types from '../types';

export class LogFoodInputDto {
  @IsString()
  text: string;

  @IsOptional()
  @IsEnum(['breakfast', 'lunch', 'dinner', 'snack'])
  mealType?: types.MealType;
}

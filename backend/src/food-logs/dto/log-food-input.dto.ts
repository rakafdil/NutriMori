import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import * as types from '../types';

export class LogFoodInputDto {
  @IsUUID()
  userId: string;

  @IsString()
  text: string;

  @IsOptional()
  @IsEnum(['breakfast', 'lunch', 'dinner', 'snack'])
  mealType?: types.MealType;
}

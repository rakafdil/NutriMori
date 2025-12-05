import { IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateFoodLogDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  normalizedText?: string;

  @IsOptional()
  @IsObject()
  nutrients?: Record<string, any>;

  @IsOptional()
  @IsUUID()
  foodItemId?: string;

  @IsOptional()
  @IsUUID()
  ruleId?: string;
}

export class UpdateFoodLogDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  normalizedText?: string;

  @IsOptional()
  @IsObject()
  nutrients?: Record<string, any>;

  @IsOptional()
  @IsUUID()
  foodItemId?: string;

  @IsOptional()
  @IsUUID()
  ruleId?: string;
}

export class LogFoodInputDto {
  @IsUUID()
  userId: string;

  @IsString()
  text: string;
}

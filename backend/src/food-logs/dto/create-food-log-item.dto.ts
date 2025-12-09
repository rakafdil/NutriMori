import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  Min,
  Max,
} from 'class-validator';

export class CreateFoodLogItemDto {
  @IsUUID()
  logId: string;

  @IsOptional()
  @IsString()
  detectedName?: string;

  @IsOptional()
  @IsString()
  foodId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidenceScore?: number;

  @IsOptional()
  @IsNumber()
  qty?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  gramWeight?: number;
}

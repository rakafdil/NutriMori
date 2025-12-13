import { IsString, IsOptional, IsNumber, IsUUID } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateFoodLogItemDto {
  @Transform(({ value }) => String(value))
  @IsUUID()
  logId: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  foodId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  qty?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  gramWeight?: number;
}

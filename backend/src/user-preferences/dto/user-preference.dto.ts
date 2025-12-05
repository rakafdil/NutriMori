import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateUserPreferenceDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsString()
  dietType?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dislikedFoods?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @IsOptional()
  @IsString()
  goals?: string;
}

export class UpdateUserPreferenceDto {
  @IsOptional()
  @IsString()
  dietType?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dislikedFoods?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @IsOptional()
  @IsString()
  goals?: string;
}

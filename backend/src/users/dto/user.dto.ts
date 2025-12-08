import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'Username',
    example: 'johndoe',
  })
  @IsString()
  username: string;

  @ApiPropertyOptional({
    description: 'User age in years',
    example: 25,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Min(1)
  age?: number;

  @ApiPropertyOptional({
    description: 'Height in centimeters',
    example: 170,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Min(1)
  height_cm?: number;

  @ApiPropertyOptional({
    description: 'Weight in kilograms',
    example: 65,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Min(1)
  weight_kg?: number;
}

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Username',
    example: 'johndoe',
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({
    description: 'User age in years',
    example: 25,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Min(1)
  age?: number;

  @ApiPropertyOptional({
    description: 'Height in centimeters',
    example: 170,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Min(1)
  height_cm?: number;

  @ApiPropertyOptional({
    description: 'Weight in kilograms',
    example: 65,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Min(1)
  weight_kg?: number;
}
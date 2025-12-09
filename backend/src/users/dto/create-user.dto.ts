import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'Username',
    example: 'johndoe',
  })
  @IsString()
  username: string;

  @ApiPropertyOptional({
    description: 'User age',
    example: 25,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(150)
  age?: number;

  @ApiPropertyOptional({
    description: 'User height in centimeters',
    example: 170,
  })
  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(300)
  height_cm?: number;

  @ApiPropertyOptional({
    description: 'User weight in kilograms',
    example: 65,
  })
  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(500)
  weight_kg?: number;
}

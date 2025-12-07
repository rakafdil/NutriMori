import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateUserPreferenceDto {
  @ApiProperty({ 
    description: 'User ID', 
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid'
  })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({ 
    description: 'Diet type', 
    example: 'vegan',
    enum: ['vegan', 'vegetarian', 'low-carb', 'keto', 'paleo', 'mediterranean', 'none']
  })
  @IsOptional()
  @IsString()
  dietType?: string;

  @ApiPropertyOptional({ 
    description: 'List of disliked foods', 
    example: ['tofu', 'mushrooms'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dislikedFoods?: string[];

  @ApiPropertyOptional({ 
    description: 'List of allergies', 
    example: ['peanuts', 'shellfish'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @ApiPropertyOptional({ 
    description: 'Health and fitness goals', 
    example: 'Lose weight and build muscle'
  })
  @IsOptional()
  @IsString()
  goals?: string;
}

export class UpdateUserPreferenceDto {
  @ApiPropertyOptional({ 
    description: 'Diet type', 
    example: 'vegan',
    enum: ['vegan', 'vegetarian', 'low-carb', 'keto', 'paleo', 'mediterranean', 'none']
  })
  @IsOptional()
  @IsString()
  dietType?: string;

  @ApiPropertyOptional({ 
    description: 'List of disliked foods', 
    example: ['tofu', 'mushrooms'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dislikedFoods?: string[];

  @ApiPropertyOptional({ 
    description: 'List of allergies', 
    example: ['peanuts', 'shellfish'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @ApiPropertyOptional({ 
    description: 'Health and fitness goals', 
    example: 'Lose weight and build muscle'
  })
  @IsOptional()
  @IsString()
  goals?: string;
}
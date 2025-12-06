import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsStrongPassword } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password (min 8 chars, must contain uppercase, lowercase, number, and symbol)',
    example: 'MyP@ssw0rd',
    minLength: 8,
  })
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minNumbers: 1,
    minSymbols: 1,
    minUppercase: 1,
  })
  password: string;

  @ApiPropertyOptional({
    description: 'User full name',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  name?: string;
}

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'MyP@ssw0rd',
  })
  @IsString()
  password: string;
}

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
    example: 'OldP@ssw0rd',
  })
  @IsString()
  oldPassword: string;

  @ApiProperty({
    description: 'New password (min 8 chars, must contain uppercase, lowercase, number, and symbol)',
    example: 'NewP@ssw0rd',
    minLength: 8,
  })
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minNumbers: 1,
    minSymbols: 1,
    minUppercase: 1,
  })
  newPassword: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiPropertyOptional({
    description: 'Refresh token (if implemented)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refresh_token?: string;

  @ApiProperty({
    description: 'User information',
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      email: { type: 'string', format: 'email' },
      name: { type: 'string', nullable: true },
    },
  })
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

export class JwtPayloadDto {
  @ApiProperty({
    description: 'User ID (subject)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  sub: string;

  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Issued at timestamp',
    example: 1638360000,
  })
  iat: number;

  @ApiProperty({
    description: 'Expiration timestamp',
    example: 1638446400,
  })
  exp: number;
}
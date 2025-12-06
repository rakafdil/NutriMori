import { IsEmail, IsOptional, IsString, IsStrongPassword } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minNumbers: 1,
    minSymbols: 1,
    minUppercase: 1,
  })
  password: string;

  @IsOptional()
  @IsString()
  name?: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class AuthResponseDto {
  access_token: string;
  refresh_token?: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

export class JwtPayloadDto {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

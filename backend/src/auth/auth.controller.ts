import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import express from 'express';
import { LoginDto, RegisterDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return {
      success: true,
      message: !result.access_token
        ? 'Please check your email to confirm your account'
        : 'User registered successfully',
      data: result,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const result = await this.authService.login(dto); // returns tokens & user
    // set httpOnly cookie for refresh token
    res.cookie('nutrimori_refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/',
    });
    // optionally set access token as httpOnly short-lived, or return access token in body
    return {
      access_token: result.access_token,
      success: true,
      message: 'Login successful',
      data: result,
    };
  }

  @Get('verify')
  async verify(@Headers('authorization') authorization: string) {
    const token = authorization?.replace('Bearer ', '');
    if (!token) {
      return { success: false, message: 'No token provided' };
    }

    const user = await this.authService.validateUser(token);
    return {
      success: true,
      message: 'Token is valid',
      data: { user },
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refresh_token') refreshToken: string) {
    const result = await this.authService.refreshToken(refreshToken);
    return {
      success: true,
      message: 'Token refreshed successfully',
      data: result,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Headers('authorization') authorization: string) {
    const token = authorization?.replace('Bearer ', '');
    if (token === undefined) {
      throw new Error('No vaild session found');
    }
    await this.authService.logout(token);
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Headers('authorization') authorization: string,
    @Body('new_password') newPassword: string,
  ) {
    const token = authorization?.replace('Bearer ', '');
    await this.authService.changePassword(token, newPassword);
    return {
      success: true,
      message: 'Password changed successfully',
    };
  }

  @Post('reset-password-request')
  @HttpCode(HttpStatus.OK)
  async resetPasswordRequest(@Body('email') email: string) {
    await this.authService.resetPasswordRequest(email);
    return {
      success: true,
      message: 'Password reset email sent',
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Headers('authorization') authorization: string,
    @Body('new_password') newPassword: string,
  ) {
    const token = authorization?.replace('Bearer ', '');
    await this.authService.resetPassword(token, newPassword);
    return {
      success: true,
      message: 'Password reset successfully',
    };
  }
}

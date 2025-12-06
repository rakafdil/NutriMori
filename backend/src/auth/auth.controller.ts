import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Patch,
    Post,
    Request,
    UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req: any) {
    return this.authService.validateUser(req.user.id);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Request() req: any,
    @Body() body: { oldPassword: string; newPassword: string },
  ) {
    if (!body.oldPassword || !body.newPassword) {
      throw new BadRequestException('Old password and new password are required');
    }

    return this.authService.changePassword(
      req.user.id,
      body.oldPassword,
      body.newPassword,
    );
  }
}

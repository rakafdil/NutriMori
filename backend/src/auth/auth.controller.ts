import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthResponseDto, ChangePasswordDto, LoginDto, RegisterDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register new user',
    description: 'Create a new user account with email and password',
  })
  @ApiCreatedResponse({
    description: 'User successfully registered',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input or email already exists',
  })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login user',
    description: 'Authenticate user and receive JWT token',
  })
  @ApiOkResponse({
    description: 'User successfully logged in',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current user',
    description: 'Get currently authenticated user information',
  })
  @ApiOkResponse({
    description: 'User information retrieved',
    schema: {
      properties: {
        id: { type: 'string', format: 'uuid' },
        email: { type: 'string', format: 'email' },
        name: { type: 'string', nullable: true },
        created_at: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token',
  })
  async getMe(@Request() req: any) {
    return this.authService.validateUser(req.user.id);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Change user password',
    description: 'Change password for currently authenticated user',
  })
  @ApiOkResponse({
    description: 'Password successfully changed',
    schema: {
      properties: {
        message: { type: 'string', example: 'Password changed successfully' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid old password or missing fields',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token',
  })
  async changePassword(
    @Request() req: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      req.user.id,
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword,
    );
  }
}
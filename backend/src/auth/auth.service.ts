import {
    BadRequestException,
    ConflictException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { SupabaseService } from '../supabase';
import { AuthResponseDto, LoginDto, RegisterDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private supabaseService: SupabaseService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private get supabase() {
    return this.supabaseService.getClient();
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, name } = registerDto;

    // Check if user already exists
    const { data: existingUser } = await this.supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const { data: user, error } = await this.supabase
      .from('users')
      .insert({
        email,
        name,
        password_hash: hashedPassword,
      })
      .select('id, email, name')
      .single();

    if (error) {
      throw new BadRequestException('Failed to create user');
    }

    // Generate JWT token
    const access_token = this.jwtService.sign(
      {
        email: user.email,
        sub: user.id,
      },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRATION'),
      },
    );

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user by email
    const { data: user, error } = await this.supabase
      .from('users')
      .select('id, email, name, password_hash')
      .eq('email', email)
      .single();

    if (error || !user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate JWT token
    const access_token = this.jwtService.sign(
      {
        email: user.email,
        sub: user.id,
      },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRATION'),
      },
    );

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async validateUser(id: string) {
    const { data: user, error } = await this.supabase
      .from('users')
      .select('id, email, name')
      .eq('id', id)
      .single();

    if (error || !user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    // Get user with password hash
    const { data: user, error } = await this.supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify old password
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    const { error: updateError } = await this.supabase
      .from('users')
      .update({ password_hash: hashedPassword })
      .eq('id', userId);

    if (updateError) {
      throw new BadRequestException('Failed to update password');
    }

    return { message: 'Password updated successfully' };
  }
}

import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase';
import { AuthResponseDto, LoginDto, RegisterDto } from './dto';

@Injectable()
export class AuthService {
  constructor(private supabaseService: SupabaseService) {}

  private get supabase() {
    return this.supabaseService.getClient();
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, name } = registerDto;

    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    if (!data?.user) {
      throw new BadRequestException('Registration failed');
    }

    // Handle email confirmation requirement
    if (!data.session) {
      return {
        message: 'Please check your email to confirm your account',
        user: {
          id: data.user.id,
          email: data.user.email ?? '',
          name:
            typeof data.user.user_metadata?.name === 'string'
              ? data.user.user_metadata.name
              : (name ?? ''),
        },
      };
    }

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email ?? '',
        name:
          typeof data.user.user_metadata?.name === 'string'
            ? data.user.user_metadata.name
            : (name ?? ''),
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    if (!data?.user || !data.session) {
      throw new UnauthorizedException('Login failed');
    }

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email ?? '',
        name:
          typeof data.user.user_metadata?.name === 'string'
            ? data.user.user_metadata.name
            : '',
      },
    };
  }

  async validateUser(accessToken: string) {
    const { data, error } = await this.supabase.auth.getUser(accessToken);

    if (error || !data?.user) {
      throw new UnauthorizedException(error?.message || 'Invalid token');
    }

    return {
      id: data.user.id,
      email: data.user.email ?? '',
      name:
        typeof data.user.user_metadata?.name === 'string'
          ? data.user.user_metadata.name
          : '',
    };
  }

  async refreshToken(refreshToken: string) {
    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data?.session) {
      throw new UnauthorizedException(
        error?.message || 'Invalid refresh token',
      );
    }

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    };
  }

  async logout(accessToken: string) {
    // Set the session before logging out
    await this.supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: '', // Required by type, ignored by Supabase
    });

    const { error } = await this.supabase.auth.signOut();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { message: 'Logged out successfully' };
  }

  async changePassword(accessToken: string, newPassword: string) {
    // Set the session to update the password for the authenticated user
    const { error: sessionError } = await this.supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: '', // Required by type, ignored by Supabase
    });

    if (sessionError) {
      throw new UnauthorizedException(sessionError.message);
    }

    const { data, error } = await this.supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    if (!data?.user) {
      throw new BadRequestException('Failed to update password');
    }

    return { message: 'Password updated successfully' };
  }

  async resetPasswordRequest(email: string) {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/auth/reset-password`,
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { message: 'Password reset email sent' };
  }

  async resetPassword(accessToken: string, newPassword: string) {
    // Set the session using the token from the reset email
    const { error: sessionError } = await this.supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: '', // Required by type, ignored by Supabase
    });

    if (sessionError) {
      throw new UnauthorizedException(sessionError.message);
    }

    const { data, error } = await this.supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    if (!data?.user) {
      throw new BadRequestException('Failed to reset password');
    }

    return { message: 'Password reset successfully' };
  }

  async verifyEmail(token: string) {
    const { data, error } = await this.supabase.auth.verifyOtp({
      token_hash: token,
      type: 'email',
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    if (!data?.user || !data.session) {
      throw new BadRequestException('Email verification failed');
    }

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email ?? '',
        name:
          typeof data.user.user_metadata?.name === 'string'
            ? data.user.user_metadata.name
            : '',
      },
    };
  }
}

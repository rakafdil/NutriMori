import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { SupabaseModule } from '../supabase';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SupabaseStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [SupabaseModule, PassportModule],
  controllers: [AuthController],
  providers: [AuthService, SupabaseStrategy],
  exports: [AuthService],
})
export class AuthModule {}

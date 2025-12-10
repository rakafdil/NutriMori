import { Body, Controller, Delete, Get, Patch, Req } from '@nestjs/common';
import express from 'express';
import { UpdateUserDto } from './dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  private extractToken(req: express.Request): string {
    const authHeader = req.headers.authorization;
    return authHeader?.replace('Bearer ', '') || '';
  }

  @Get('check-preference')
  checkFillPreferences(@Req() req: express.Request) {
    return this.usersService.checkFillPreferences(this.extractToken(req));
  }

  // Mengambil profile diri sendiri
  // GET /users/me
  @Get('me')
  getProfile(@Req() req: express.Request) {
    return this.usersService.getProfile(this.extractToken(req));
  }

  // Update profile diri sendiri
  // PATCH /users/me
  @Patch('me')
  update(@Req() req: express.Request, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateProfile(
      this.extractToken(req),
      updateUserDto,
    );
  }

  // Hapus akun diri sendiri
  // DELETE /users/me
  @Delete('me')
  remove(@Req() req: express.Request) {
    return this.usersService.removeProfile(this.extractToken(req));
  }

  @Get('me/logs')
  getFoodLogs(@Req() req: express.Request) {
    return this.usersService.getFoodLogs(this.extractToken(req));
  }
}

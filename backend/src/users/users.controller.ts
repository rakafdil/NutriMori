import { Body, Controller, Delete, Get, Patch, Req } from '@nestjs/common';
import express from 'express';
import { extractTokenFromRequest } from 'src/utils/extract-token.util';
import { UpdateUserDto } from './dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('check-preference')
  checkFillPreferences(@Req() req: express.Request) {
    const token = extractTokenFromRequest(req) ?? '';
    return this.usersService.checkFillPreferences(token);
  }

  @Get('me')
  getProfile(@Req() req: express.Request) {
    const token = extractTokenFromRequest(req) ?? '';
    return this.usersService.getProfile(token);
  }

  @Patch('me')
  update(@Req() req: express.Request, @Body() updateUserDto: UpdateUserDto) {
    const token = extractTokenFromRequest(req) ?? '';
    return this.usersService.updateProfile(token, updateUserDto);
  }

  @Delete('me')
  remove(@Req() req: express.Request) {
    const token = extractTokenFromRequest(req) ?? '';
    return this.usersService.removeProfile(token);
  }

  @Get('me/logs')
  getFoodLogs(@Req() req: express.Request) {
    const token = extractTokenFromRequest(req) ?? '';
    return this.usersService.getFoodLogs(token);
  }
}

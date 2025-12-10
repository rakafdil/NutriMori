/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateUserPreferenceDto, UpdateUserPreferenceDto } from './dto';
import { UserPreferencesService } from './user-preferences.service';

@Controller('user-preferences')
export class UserPreferencesController {
  constructor(private readonly preferencesService: UserPreferencesService) {}

  private getAccessToken(req: any): string {
    return req.headers.authorization?.replace('Bearer ', '');
  }

  @Get()
  findByUserId(@Req() req: any) {
    return this.preferencesService.findByUserId(this.getAccessToken(req));
  }

  @Patch()
  update(@Req() req: any, @Body() updateDto: UpdateUserPreferenceDto) {
    return this.preferencesService.update(this.getAccessToken(req), updateDto);
  }

  @Put()
  upsert(@Req() req: any, @Body() dto: UpdateUserPreferenceDto) {
    return this.preferencesService.upsert(this.getAccessToken(req), dto);
  }

  @Delete()
  remove(@Req() req: any) {
    return this.preferencesService.remove(this.getAccessToken(req));
  }
}

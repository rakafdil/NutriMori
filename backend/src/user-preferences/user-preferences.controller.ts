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
} from '@nestjs/common';
import { CreateUserPreferenceDto, UpdateUserPreferenceDto } from './dto';
import { UserPreferencesService } from './user-preferences.service';

@Controller('user-preferences')
export class UserPreferencesController {
  constructor(private readonly preferencesService: UserPreferencesService) {}

  @Post()
  create(@Body() createDto: CreateUserPreferenceDto) {
    return this.preferencesService.create(createDto);
  }

  @Get('user/:userId')
  findByUserId(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.preferencesService.findByUserId(userId);
  }

  @Patch('user/:userId')
  update(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() updateDto: UpdateUserPreferenceDto,
  ) {
    return this.preferencesService.update(userId, updateDto);
  }

  @Put('user/:userId')
  upsert(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateUserPreferenceDto,
  ) {
    return this.preferencesService.upsert(userId, dto);
  }

  @Delete('user/:userId')
  remove(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.preferencesService.remove(userId);
  }
}

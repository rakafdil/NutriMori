import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { CreateNutritionRuleDto, UpdateNutritionRuleDto } from './dto';
import { NutritionRulesService } from './nutrition-rules.service';

@Controller('nutrition-rules')
export class NutritionRulesController {
  constructor(private readonly rulesService: NutritionRulesService) {}

  @Post()
  create(@Body() createDto: CreateNutritionRuleDto) {
    return this.rulesService.create(createDto);
  }

  @Get()
  findAll(
    @Query('nutrient') nutrient?: string,
    @Query('severity') severity?: string,
  ) {
    return this.rulesService.findAll({ nutrient, severity });
  }

  @Get('nutrient/:nutrient')
  findByNutrient(@Param('nutrient') nutrient: string) {
    return this.rulesService.findByNutrient(nutrient);
  }

  @Post('check')
  checkNutrients(@Body() nutrients: Record<string, number>) {
    return this.rulesService.checkNutrients(nutrients);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rulesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateNutritionRuleDto,
  ) {
    return this.rulesService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.rulesService.remove(id);
  }
}

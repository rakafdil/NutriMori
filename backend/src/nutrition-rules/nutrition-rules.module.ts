import { Module } from '@nestjs/common';
import { NutritionRulesController } from './nutrition-rules.controller';
import { NutritionRulesService } from './nutrition-rules.service';

@Module({
  controllers: [NutritionRulesController],
  providers: [NutritionRulesService],
  exports: [NutritionRulesService],
})
export class NutritionRulesModule {}

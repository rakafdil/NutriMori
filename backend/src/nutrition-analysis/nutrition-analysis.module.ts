import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase';
import { NutritionAnalysisController } from './nutrition-analysis.controller';
import { NutritionAnalysisService } from './nutrition-analysis.service';

@Module({
    imports: [SupabaseModule],
    controllers: [NutritionAnalysisController],
    providers: [NutritionAnalysisService],
    exports: [NutritionAnalysisService],
})
export class NutritionAnalysisModule { }

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HabitInsightsController } from './habit-insights.controller';
import { HabitInsightsService } from './habit-insights.service';
import { SupabaseModule } from '../supabase';

@Module({
    imports: [ConfigModule, SupabaseModule],
    controllers: [HabitInsightsController],
    providers: [HabitInsightsService],
    exports: [HabitInsightsService],
})
export class HabitInsightsModule { }
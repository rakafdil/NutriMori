import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth';
import { FoodLogsModule } from './food-logs';
import { FoodsModule } from './foods';
import { HabitInsightsModule } from './habit-insights/habit-insights.module';
import { NutritionAnalysisModule } from './nutrition-analysis';
import { NutritionLimitsModule } from './nutrition-limits';
import { NutritionRulesModule } from './nutrition-rules';
import { SupabaseModule } from './supabase';
import { UserPreferencesModule } from './user-preferences';
import { UsersModule } from './users';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SupabaseModule,
    AuthModule,
    UsersModule,
    UserPreferencesModule,
    FoodLogsModule,
    NutritionRulesModule,
    HabitInsightsModule,
    NutritionAnalysisModule,
    FoodsModule,
    NutritionLimitsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

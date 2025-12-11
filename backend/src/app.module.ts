import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth';
import { FoodItemsModule } from './food-items';
import { FoodLogsModule } from './food-logs';
import { HabitInsightsModule } from './habit-insights/habit-insights.module';
import { NutritionAnalysisModule } from './nutrition-analysis';
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
    FoodItemsModule,
    FoodLogsModule,
    NutritionRulesModule,
    HabitInsightsModule,
    NutritionAnalysisModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

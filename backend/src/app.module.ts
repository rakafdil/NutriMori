import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth';
import { FoodItemsModule } from './food-items';
import { FoodLogsModule } from './food-logs';
import { NutritionRulesModule } from './nutrition-rules';
import { SupabaseModule } from './supabase';
import { UserPreferencesModule } from './user-preferences';
import { UsersModule } from './users';
import { HabitInsightsModule } from './habit-insights/habit-insights.module';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

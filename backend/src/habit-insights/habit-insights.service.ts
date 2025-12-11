import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase';
import {
  HabitInsightResponseDto,
  HabitPatternDto,
  MealTimingPatternDto,
  NutrientTrendDto,
} from './dto';

@Injectable()
export class HabitInsightsService {
  constructor(private supabase: SupabaseService) {}

  async analyze(userId: string): Promise<HabitInsightResponseDto> {
    const foodLogs = await this.getRecentFoodLogs(userId);

    const patterns = this.patternCheckers
      .map(check => check.call(this, foodLogs))
      .filter(Boolean);

    return {
      insights: patterns,
      mealTimingPattern: this.detectMealTiming(foodLogs),
      nutrientTrend: this.calculateNutrientTrend(foodLogs),
    } as unknown as HabitInsightResponseDto;
  }

  private async getRecentFoodLogs(userId: string) {
    const client: any =
      (this.supabase as any).client ??
      (this.supabase as any).supabase ??
      (this.supabase as any).getClient?.();

    return await client
      .from('user_meal_logs')
      .select(`
        *,
        items:food_items(*),
        categories:food_categories(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(300);
  }

  private get patternCheckers() {
    return [
      this.detectOverEating,
      this.detectUnderEating,
      this.detectHighSugar,
      this.detectSaltIntake,
      this.detectFiberIntake,
      this.detectBreakfastSkipping,
      this.detectFruitHabit,
      this.detectVegetableHabit,
    ];
  }

  private detectOverEating = (logs: any[]): HabitPatternDto | null => {
    const calories = this.sum(logs, 'calories');
    const days = new Set(logs.map(log => log.created_at?.split('T')[0])).size;
    const avgCalories = days > 0 ? calories / days : 0;

    // Asumsi batas kalori harian ~2500 untuk dewasa
    if (avgCalories > 2500) {
      return {
        type: 'negative',
        message: 'Pola makan berlebihan terdeteksi',
        impact: 'High',
        frequency: `${Math.round(avgCalories)} kal/hari`,
      };
    }

    return null;
  };

  private detectUnderEating = (logs: any[]): HabitPatternDto | null => {
    const calories = this.sum(logs, 'calories');
    const days = new Set(logs.map(log => log.created_at?.split('T')[0])).size;
    const avgCalories = days > 0 ? calories / days : 0;

    // Asumsi batas minimum kalori harian ~1200
    if (days >= 3 && avgCalories < 1200 && avgCalories > 0) {
      return {
        type: 'negative',
        message: 'Asupan kalori terlalu rendah',
        impact: 'High',
        frequency: `${Math.round(avgCalories)} kal/hari`,
      };
    }

    return null;
  };

  private sum(logs: any[], path: string) {
    return logs.reduce((acc, log) => acc + (Number(log?.nutrition?.[path]) || 0), 0);
  }

  private countDays(logs: any[], condition: (dayLogs: any[]) => boolean) {
    const map = new Map<string, any[]>();
    logs.forEach(log => {
      const d = log.created_at.split('T')[0];
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(log);
    });

    let streak = 0, maxStreak = 0;
    Array.from(map.keys()).sort().forEach(date => {
      const dayLogs = map.get(date) || [];
      if (condition(dayLogs)) {
        streak++;
        maxStreak = Math.max(maxStreak, streak);
      } else {
        streak = 0;
      }
    });

    return maxStreak;
  }

  private detectHighSugar = (logs: any[]): HabitPatternDto | null => {
    const sugar = this.sum(logs, 'sugar_g');

    if (sugar > 100) {
      return {
        type: 'negative',
        message: 'Konsumsi gula tinggi minggu ini',
        impact: 'High',
        frequency: `${Math.round(sugar)}g`,
      };
    }

    return null;
  };

  private detectSaltIntake = (logs: any[]): HabitPatternDto | null => {
    const sodium = this.sum(logs, 'sodium_mg');

    if (sodium > 2300) {
      return {
        type: 'negative',
        message: 'Asupan garam melebihi batas harian',
        impact: 'Medium',
        frequency: `${Math.round(sodium)} mg`,
      };
    }

    return null;
  };

  private detectFiberIntake = (logs: any[]): HabitPatternDto | null => {
    const fiber = this.sum(logs, 'fiber_g');

    if (fiber < 10) {
      return {
        type: 'negative',
        message: 'Asupan serat rendah — tambahkan sayur dan buah',
        impact: 'High',
      };
    }

    return null;
  };

  private detectBreakfastSkipping = (logs: any[]): HabitPatternDto | null => {
    const streak = this.countDays(logs, dayLogs => {
      return !dayLogs.some(log => {
        const hour = new Date(log.created_at).getHours();
        return hour >= 5 && hour <= 10;
      });
    });

    if (streak >= 3) {
      return {
        type: 'negative',
        message: `Melewatkan sarapan selama ${streak} hari`,
        impact: 'High',
      };
    }

    return null;
  };

  private detectFruitHabit = (logs: any[]): HabitPatternDto | null => {
    const streak = this.countDays(logs, dayLogs =>
      dayLogs.some(log =>
        log.categories?.some(c =>
          ['fruit', 'buah'].some(k => c.category.toLowerCase().includes(k))
        )
      ),
    );

    if (streak >= 3) {
      return {
        type: 'positive',
        message: `Konsumsi buah konsisten ${streak} hari`,
        impact: 'Medium',
      };
    }

    return null;
  };

  private detectVegetableHabit = (logs: any[]): HabitPatternDto | null => {
    const streak = this.countDays(logs, dayLogs =>
      dayLogs.some(log =>
        log.categories?.some(c =>
          ['sayur', 'vegetable', 'greens'].some(k =>
            c.category.toLowerCase().includes(k),
          ),
        ),
      ),
    );

    if (streak >= 3) {
      return {
        type: 'positive',
        message: `Konsumsi sayur konsisten ${streak} hari`,
        impact: 'Medium',
      };
    }

    return null;
  };

  private detectMealTiming(logs: any[]): MealTimingPatternDto {
    return {} as unknown as MealTimingPatternDto;
  }

  private calculateNutrientTrend(logs: any[]): NutrientTrendDto {
    // Construct a trend object and cast via unknown to avoid excess property checks
    const trend = {
      calories: 0,
      sugar: 0,
      fiber: 0,
      protein: 0,
      sodium: 0,
    } as unknown as NutrientTrendDto;

    return trend;
  }
}

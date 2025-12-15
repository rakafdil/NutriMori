import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase';
import {
    CreateNutritionAnalysisDto,
    MicronutrientsDto,
    NutritionAnalysisResponseDto,
    NutritionFactsNumericDto,
} from './dto';

interface FoodLogItem {
  item_id: string;
  log_id: string;
  detected_name: string;
  food_id: string | number;
  confidence_score: number;
  qty: number;
  unit: string;
  gram_weight: number;
  created_at: string;
}

interface FoodNutrient {
  food_id: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
  sugar_estimated?: boolean;
  fiber: number;
  sodium: number;
  cholesterol: number;

  // Micronutrients
  calcium: number;
  phosphorus: number;
  iron: number;
  magnesium: number;
  potassium: number;
  zinc: number;
  copper: number;

  vitamin_c: number;
  vitamin_b1: number;
  vitamin_b2: number;
  vitamin_b3: number;
  vitamin_b6: number;
  vitamin_b9: number;
  vitamin_b12: number;

  vitamin_a: number;
  vitamin_d: number;
  vitamin_e: number;
  vitamin_k: number;

  saturated_fat: number;
  monounsaturated_fat: number;
  polyunsaturated_fat: number;
}

interface UserPreferences {
  id: string;
  user_id: string;
  allergies?: string[];
  goals?: string[];
  tastes?: string[];
  medical_history?: string[];
  meal_times?: any;
  daily_budget?: number;
}

interface NutritionRule {
  id: string;
  rule_name: string;
  description: string;
  min_value: number | null;
  max_value: number | null;
  nutrient: string;
  severity: 'warning' | 'info' | 'critical';
  target_type:
    | 'global'
    | 'per_serving'
    | 'user_goal'
    | 'medical_condition'
    | 'custom';
  target_value: string | number | null;
  output_type: 'warning' | 'info' | 'tag';
  created_at: string;
}

interface AkgData {
  id: number;
  kelompok: string;
  umur: string;
  energi_kkal: number;
  protein_g: number;
  lemak_total_g: number;
  karbohidrat_g: number;
  serat_g: number;
  air_ml: number;
  vit_a_re: number;
  vit_d_mcg: number;
  vit_e_mcg: number;
  vit_k_mcg: number;
  vit_b1_mg: number;
  vit_b2_mg: number;
  vit_b3_mg: number;
  vit_b6_mg: number;
  vit_b9_mcg: number;
  vit_b12_mcg: number;
  vit_c_mg: number;
  kalsium_mg: number;
  fosfor_mg: number;
  magnesium_mg: number;
  natrium_mg: number;
  kalium_mg: number;
  besi_mg: number;
  seng_mg: number;
  // ... tambahkan kolom lain jika perlu
}

@Injectable()
export class NutritionAnalysisService {
  private readonly logger = new Logger(NutritionAnalysisService.name);
  private nutritionRulesCache: NutritionRule[] | null = null;

  constructor(private readonly supabaseService: SupabaseService) {}

  async analyzeNutrition(
    userId: string,
    createDto: CreateNutritionAnalysisDto,
  ): Promise<NutritionAnalysisResponseDto> {
    const { foodLogId } = createDto;
    const supabase = this.supabaseService.getClient();

    const { data: logData, error: logError } = await supabase
      .from('food_logs')
      .select('user_id')
      .eq('log_id', foodLogId)
      .single();

    if (logError || !logData) throw new NotFoundException('Food log not found');

    const targetUserId = logData.user_id;

    const foodLogItems = await this.getFoodLogItems(foodLogId);
    if (foodLogItems.length === 0)
      throw new NotFoundException('No food items found');

    const nutritionData = await this.getNutritionDataForItems(foodLogItems);

    const totalNutrition = this.calculateTotalNutrition(
      foodLogItems,
      nutritionData,
    );

    const [preferences, rules, userProfile] = await Promise.all([
      this.getUserPreferences(targetUserId),
      this.getNutritionRules(),
      this.getUserProfile(targetUserId),
    ]);

    const akgData = await this.getAkgData(
      userProfile?.age,
      userProfile?.gender,
    );

    const { healthTags, warnings } = this.analyzeHealthMetrics(
      totalNutrition,
      preferences,
      rules,
      akgData,
    );
    const macroRatio = this.calculateMacroRatio(totalNutrition);

    const micronutrients = this.calculateMicronutrients(
      foodLogItems,
      nutritionData,
      akgData,
    );

    const sugarEstimated = this.isSugarEstimated(foodLogItems, nutritionData);

    // Include sugar_estimated flag in micronutrients JSONB if needed
    const micronutrientsWithMeta = {
      ...micronutrients,
      _meta: { sugar_estimated: sugarEstimated },
    };

    const nutritionInsert = {
      food_log_id: foodLogId,
      user_id: targetUserId,
      total_calories: totalNutrition.calories,
      total_protein: totalNutrition.protein,
      total_carbs: totalNutrition.carbs,
      total_fat: totalNutrition.fat,
      total_sugar: totalNutrition.sugar,
      total_fiber: totalNutrition.fiber,
      total_sodium: totalNutrition.sodium,
      total_cholesterol: totalNutrition.cholesterol,
      micronutrients: micronutrientsWithMeta,
      health_tags: healthTags,
      warnings,
    };

    const { data, error } = await supabase
      .from('nutrition_analysis')
      .insert(nutritionInsert)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return this.formatResponse(
      data,
      totalNutrition,
      micronutrients,
      macroRatio,
    );
  }

  private async getUserProfile(userId: string) {
    const supabase = this.supabaseService.getClient();
    try {
      const { data } = await supabase
        .from('users')
        .select('age, gender, weight_kg, height_cm')
        .eq('id', userId)
        .single();
      return data || { age: 25, gender: 'Laki-laki' };
    } catch (e) {
      return { age: 25, gender: 'Laki-laki' };
    }
  }

  private async getAkgData(
    age: number = 25,
    gender: string = 'Laki-laki',
  ): Promise<AkgData | null> {
    const supabase = this.supabaseService.getClient();

    // Ambil semua data AKG (dataset kecil, ~20 baris)
    const { data } = await supabase.from('dataset_akg').select('*');
    if (!data || data.length === 0) return null;

    // 1. Filter Gender
    // Asumsi kolom 'kelompok' berisi "Laki-laki" atau "Perempuan"
    const isFemale =
      gender?.toLowerCase().includes('perempuan') ||
      gender?.toLowerCase() === 'female';
    const genderKey = isFemale ? 'Perempuan' : 'Laki-laki';

    const genderRows = data.filter(
      (row: any) => row.kelompok && row.kelompok.includes(genderKey),
    );
    if (genderRows.length === 0) return data[0]; // Fallback

    // 2. Filter Umur
    // Format umur di DB biasanya: "10-12 tahun", "19-29 tahun", "80+ tahun"
    const match = genderRows.find((row: any) => {
      const range = String(row.umur || '');

      if (range.includes('+')) {
        const min = parseInt(range);
        return age >= min;
      }

      const parts = range.split('-');
      if (parts.length === 2) {
        const min = parseInt(parts[0]);
        const max = parseInt(parts[1]);
        return age >= min && age <= max;
      }
      return false;
    });

    return (
      match ||
      genderRows.find((r: any) => r.umur?.includes('19-29')) ||
      genderRows[0]
    );
  }

  private calculateMacroRatio(n: NutritionFactsNumericDto) {
    const proteinCal = n.protein * 4;
    const carbCal = n.carbs * 4;
    const fatCal = n.fat * 9;

    const total = proteinCal + carbCal + fatCal;

    if (total === 0) {
      return { protein: 0, carbs: 0, fat: 0 };
    }

    return {
      protein: Math.round((proteinCal / total) * 100),
      carbs: Math.round((carbCal / total) * 100),
      fat: Math.round((fatCal / total) * 100),
    };
  }

  private calculateMicronutrients(
    items: FoodLogItem[],
    map: Map<string, FoodNutrient>,
    akg: AkgData | null,
  ): MicronutrientsDto {
    // 1. Hitung total raw value
    const total = {
      vitamin_c: 0,
      iron: 0,
      calcium: 0,
      vitamin_a: 0,
      vitamin_d: 0,
      vitamin_b12: 0,
      potassium: 0,
      magnesium: 0,
      zinc: 0,
    };

    for (const item of items) {
      const key = String(item.food_id);
      const n = map.get(key);
      if (!n) continue;
      const mul = item.gram_weight / 100;

      total.vitamin_c += (n.vitamin_c || 0) * mul;
      total.iron += (n.iron || 0) * mul;
      total.calcium += (n.calcium || 0) * mul;
      total.vitamin_a += (n.vitamin_a || 0) * mul;
      total.vitamin_d += (n.vitamin_d || 0) * mul;
      total.vitamin_b12 += (n.vitamin_b12 || 0) * mul;
      total.potassium += (n.potassium || 0) * mul;
      total.magnesium += (n.magnesium || 0) * mul;
      total.zinc += (n.zinc || 0) * mul;
    }

    // 2. Konversi ke Persentase AKG
    const result: MicronutrientsDto = {};
    const toPercent = (val: number, dv: number) => {
      if (val <= 0 || !dv) return undefined;
      const pct = Math.round((val / dv) * 100);
      if (pct > 300) return '>300%';
      return `${pct}%`;
    };

    // Default DV jika AKG tidak ditemukan (Fallback ke standar umum)
    const defaults = {
      vit_c: 90,
      iron: 18,
      calcium: 1000,
      vit_a: 600,
      vit_d: 15,
      vit_b12: 2.4,
      potassium: 4700,
      magnesium: 350,
      zinc: 11,
    };

    if (total.vitamin_c > 0)
      result.vitamin_c = toPercent(
        total.vitamin_c,
        akg?.vit_c_mg || defaults.vit_c,
      );
    if (total.iron > 0)
      result.iron = toPercent(total.iron, akg?.besi_mg || defaults.iron);
    if (total.calcium > 0)
      result.calcium = toPercent(
        total.calcium,
        akg?.kalsium_mg || defaults.calcium,
      );
    if (total.vitamin_a > 0)
      result.vitamin_a = toPercent(
        total.vitamin_a,
        akg?.vit_a_re || defaults.vit_a,
      );
    if (total.vitamin_d > 0)
      result.vitamin_d = toPercent(
        total.vitamin_d,
        akg?.vit_d_mcg || defaults.vit_d,
      );
    if (total.vitamin_b12 > 0)
      result.vitamin_b12 = toPercent(
        total.vitamin_b12,
        akg?.vit_b12_mcg || defaults.vit_b12,
      );

    if (total.potassium > 0)
      result['potassium'] = toPercent(
        total.potassium,
        akg?.kalium_mg || defaults.potassium,
      );
    if (total.magnesium > 0)
      result['magnesium'] = toPercent(
        total.magnesium,
        akg?.magnesium_mg || defaults.magnesium,
      );
    if (total.zinc > 0)
      result['zinc'] = toPercent(total.zinc, akg?.seng_mg || defaults.zinc);

    return result;
  }

  async getAnalysisByFoodLogId(
    foodLogId: string,
    userId: string,
  ): Promise<NutritionAnalysisResponseDto> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('nutrition_analysis')
      .select('*')
      .eq('food_log_id', foodLogId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Nutrition analysis not found');
    }

    const nutrition: NutritionFactsNumericDto = {
      calories: data.total_calories,
      protein: data.total_protein,
      carbs: data.total_carbs,
      fat: data.total_fat,
      sugar: data.total_sugar,
      fiber: data.total_fiber,
      sodium: data.total_sodium,
      cholesterol: data.total_cholesterol,
    };

    const macroRatio = this.calculateMacroRatio(nutrition);

    return this.formatResponse(data, nutrition, data.micronutrients || {}, macroRatio);
  }

  async getUserAnalysisHistory(
    userId: string,
    limit: number = 10,
  ): Promise<NutritionAnalysisResponseDto[]> {
    if (!userId) {
      throw new BadRequestException('User ID is required for history');
    }

    const supabase = this.supabaseService.getClient();
    const safeLimit = Number(limit) || 10;

    const { data, error } = await supabase
      .from('nutrition_analysis')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(safeLimit);

    if (error) {
      this.logger.error(
        `Failed to retrieve history for user ${userId}: ${error.message}`,
      );
      throw new BadRequestException(
        `Failed to retrieve analysis history: ${error.message}`,
      );
    }

    return (data || []).map((item) => {
      const nutrition: NutritionFactsNumericDto = {
        calories: item.total_calories,
        protein: item.total_protein,
        carbs: item.total_carbs,
        fat: item.total_fat,
        sugar: item.total_sugar,
        fiber: item.total_fiber,
        sodium: item.total_sodium,
        cholesterol: item.total_cholesterol,
      };

      const macroRatio = this.calculateMacroRatio(nutrition);

      return this.formatResponse(
        item,
        nutrition,
        item.micronutrients || {},
        macroRatio,
      );
    });
  }

  private async getFoodLogItems(logId: string): Promise<FoodLogItem[]> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('food_log_items')
      .select('*')
      .eq('log_id', logId);

    this.logger.debug({
      fn: 'getFoodLogItems',
      logId,
      dataLength: data?.length ?? 0,
      error,
    });

    if (error) throw new NotFoundException(error.message);
    return data;
  }

  private async getNutritionDataForItems(
    items: FoodLogItem[],
  ): Promise<Map<string, FoodNutrient>> {
    const supabase = this.supabaseService.getClient();
    const map = new Map<string, FoodNutrient>();

    const ids = items.map((i) => i.food_id);
    const idsStr = ids.map((id) => String(id));

    // UUID-based food (existing behavior)
    const uuidIds = idsStr.filter((id) => this.isValidUUID(id));
    if (uuidIds.length > 0) {
      const { data } = await supabase
        .from('food_nutrients')
        .select('*')
        .in('food_id', uuidIds);
      data?.forEach((n: any) => map.set(String(n.food_id), n));
    }

    // Integer food_id → lookup in food_items (fits your schema)
    const intIds = ids
      .filter((id) => !this.isValidUUID(String(id)))
      .map(Number)
      .filter((n) => !Number.isNaN(n));

    if (intIds.length > 0) {
      const { data } = await supabase
        .from('food_items')
        .select(
          `
  id, name, condition, food_group,
  energy, protein, total_fat, carbohydrate, sugar, fiber,
  calcium, phosphorus, iron, magnesium, potassium, sodium, zinc, copper,
  vitamin_c, vitamin_b1, vitamin_b2, vitamin_b3, vitamin_b6, vitamin_b9, vitamin_b12,
  vitamin_a, vitamin_d, vitamin_e, vitamin_k,
  saturated_fat, monounsaturated_fat, polyunsaturated_fat, cholesterol
`,
        )
        .in('id', intIds);

      data?.forEach((i: any) => {
        const carbs = Number(i.carbohydrate ?? 0);

        // Periksa nilai asli dari DB (bukan Number(...))
        const rawSugarRaw = i.sugar;
        let sugarValue: number;
        let sugarEstimated = false;

        if (rawSugarRaw === null || rawSugarRaw === undefined) {
          sugarValue = Number((carbs * 0.05).toFixed(2));
          sugarEstimated = true;
        } else {
          sugarValue = Number(rawSugarRaw) || 0;
          sugarEstimated = false;
        }

        map.set(String(i.id), {
          food_id: String(i.id),
          calories: Number(i.energy || 0),
          protein: Number(i.protein || 0),
          carbs: carbs,
          fat: Number(i.total_fat || 0),
          sugar: Number(sugarValue),
          sugar_estimated: sugarEstimated,
          fiber: Number(i.fiber || 0),
          sodium: Number(i.sodium || 0),
          cholesterol: Number(i.cholesterol || 0),

          // BONUS: Micronutrients
          calcium: Number(i.calcium || 0),
          phosphorus: Number(i.phosphorus || 0),
          iron: Number(i.iron || 0),
          magnesium: Number(i.magnesium || 0),
          potassium: Number(i.potassium || 0),
          zinc: Number(i.zinc || 0),
          copper: Number(i.copper || 0),

          vitamin_c: Number(i.vitamin_c || 0),
          vitamin_b1: Number(i.vitamin_b1 || 0),
          vitamin_b2: Number(i.vitamin_b2 || 0),
          vitamin_b3: Number(i.vitamin_b3 || 0),
          vitamin_b6: Number(i.vitamin_b6 || 0),
          vitamin_b9: Number(i.vitamin_b9 || 0),
          vitamin_b12: Number(i.vitamin_b12 || 0),

          vitamin_a: Number(i.vitamin_a || 0),
          vitamin_d: Number(i.vitamin_d || 0),
          vitamin_e: Number(i.vitamin_e || 0),
          vitamin_k: Number(i.vitamin_k || 0),

          saturated_fat: Number(i.saturated_fat || 0),
          monounsaturated_fat: Number(i.monounsaturated_fat || 0),
          polyunsaturated_fat: Number(i.polyunsaturated_fat || 0),
        });
      });
    }

    return map;
  }

  private calculateTotalNutrition(
    items: FoodLogItem[],
    map: Map<string, FoodNutrient>,
  ): NutritionFactsNumericDto {
    const total = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      sugar: 0,
      fiber: 0,
      sodium: 0,
      cholesterol: 0,
    };
    for (const item of items) {
      const key = String(item.food_id);
      const n = map.get(key);
      if (!n) continue;

      const mul = item.gram_weight / 100;
      total.calories += n.calories * mul;
      total.protein += n.protein * mul;
      total.carbs += n.carbs * mul;
      total.fat += n.fat * mul;
      total.sugar += n.sugar * mul;
      total.fiber += n.fiber * mul;
      total.sodium += n.sodium * mul;
      total.cholesterol += n.cholesterol * mul;
    }

    // round
    Object.keys(total).forEach((k) => (total[k] = Number(total[k].toFixed(2))));
    return total;
  }

  private async getUserPreferences(userId: string) {
    const supabase = this.supabaseService.getClient();
    const { data } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    return data || null;
  }

  private async getNutritionRules(): Promise<NutritionRule[]> {
    if (this.nutritionRulesCache) return this.nutritionRulesCache;

    const supabase = this.supabaseService.getClient();
    const { data } = await supabase.from('nutrition_rules').select('*');

    this.nutritionRulesCache = data || [];
    return this.nutritionRulesCache;
  }

  private analyzeHealthMetrics(
    nutrition: NutritionFactsNumericDto,
    prefs: UserPreferences | null,
    rules: NutritionRule[],
    akg: AkgData | null,
  ): { healthTags: string[]; warnings: string[] } {
    const tags: string[] = [];
    const warnings: string[] = [];

    const goals = prefs?.goals?.map((g) => g.toLowerCase()) ?? [];
    const history = prefs?.medical_history?.map((m) => m.toLowerCase()) ?? [];

    // --- DYNAMIC LOGIC BASED ON AKG ---
    if (akg) {
      // Health Tags
      if (nutrition.calories > 0) {
        const proteinDensity = (nutrition.protein / nutrition.calories) * 100;
        if (!Number.isNaN(proteinDensity) && proteinDensity >= 20)
          tags.push('High Protein');

        const sugarEnergy = (nutrition.sugar || 0) * 4;
        const sugarRatio = sugarEnergy / nutrition.calories;
        if (!Number.isNaN(sugarRatio) && sugarRatio > 0.1)
          warnings.push('High Added Sugar');
      }
      if (nutrition.fiber && nutrition.fiber >= akg.serat_g * 0.3)
        tags.push('High Fiber');
      // Batas Natrium (Sodium) biasanya 2000-2300mg, tapi kita pakai data AKG jika ada
      const sodiumLimit = akg.natrium_mg || 2000;
      const mealSodiumLimit = sodiumLimit * 0.33; // 1/3 harian
      if (nutrition.sodium && nutrition.sodium > mealSodiumLimit) {
        warnings.push('High Sodium');
      } // >40% daily limit in one meal

      // Gula (Sugar) - AKG Indonesia 2019 tidak spesifik gula tambahan, tapi WHO saran <50g (atau <10% energi)
      // Kita pakai estimasi 50g sehari
      const sugarEnergy = (nutrition.sugar || 0) * 4;
      const sugarRatio = sugarEnergy / nutrition.calories;
      if (!Number.isNaN(sugarRatio) && sugarRatio > 0.1) {
        warnings.push('High Added Sugar');
      }
    } else {
      // Fallback logic if AKG not found
      if (nutrition.protein >= 20) tags.push('High Protein');
      if (nutrition.fiber && nutrition.fiber >= 5) tags.push('High Fiber');
      if (nutrition.sodium && nutrition.sodium > 800)
        warnings.push('High Sodium');
    }

    // Additional static checks
    if (nutrition.sugar > 0 && nutrition.sugar <= 5) {
      tags.push('Low Sugar');
    }
    if (nutrition.calories <= 500 && nutrition.protein > 15)
      tags.push('Balanced Meal');

    for (const r of rules) {
      const val = this.getNutrientValue(nutrition, r.nutrient);
      if (val === null) continue;

      let triggered = false;

      // global rule
      if (r.target_type === 'global') {
        if (r.max_value !== null && val > r.max_value) triggered = true;
        if (r.min_value !== null && val < r.min_value) triggered = true;
      }

      // per serving
      if (r.target_type === 'per_serving') {
        if (r.max_value !== null && val > r.max_value) triggered = true;
      }

      // user goal rules
      if (r.target_type === 'user_goal') {
        if (!goals.includes(String(r.target_value).toLowerCase())) continue;
        if (r.max_value !== null && val > r.max_value) triggered = true;
        if (r.min_value !== null && val < r.min_value) triggered = true;
      }

      // medical condition rules
      if (r.target_type === 'medical_condition') {
        if (
          !history.some((h) => h.includes(String(r.target_value).toLowerCase()))
        )
          continue;
        if (r.max_value !== null && val > r.max_value) triggered = true;
      }

      if (!triggered) continue;

      const msg = r.description || r.rule_name;

      if (r.output_type === 'tag') tags.push(msg);
      if (r.output_type === 'warning') warnings.push(msg);
    }

    return {
      healthTags: [...new Set(tags)],
      warnings: [...new Set(warnings)],
    };
  }

  private getNutrientValue(
    n: NutritionFactsNumericDto,
    key: string,
  ): number | null {
    const map = {
      calories: n.calories,
      protein: n.protein,
      carbs: n.carbs,
      fat: n.fat,
      sugar: n.sugar,
      fiber: n.fiber,
      sodium: n.sodium,
      cholesterol: n.cholesterol,
      added_sugar: n.sugar,
    };

    return map[key.toLowerCase()] ?? null;
  }

  private buildNotes(
    n: NutritionFactsNumericDto,
    tags: string[],
    warnings: string[],
  ): string {
    let note = `Meal has ${n.calories} kcal, ${n.protein}g protein, ${n.carbs}g carbs. `;
    if (tags.length) note += `Good: ${tags.join(', ')}. `;
    if (warnings.length) note += `Warnings: ${warnings.join(', ')}`;
    return note;
  }

  async getWeeklyCalorieIntake(userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('nutrition_analysis')
      .select('total_calories, created_at')
      .eq('user_id', userId)
      .gte(
        'created_at',
        new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      )
      .order('created_at', { ascending: true });

    if (error) {
      throw new BadRequestException(error.message);
    }

    // Group by day
    const map = new Map<string, number>();

    data.forEach((item) => {
      const day = item.created_at.slice(0, 10); // YYYY-MM-DD

      map.set(day, (map.get(day) || 0) + item.total_calories);
    });

    return Array.from(map.entries()).map(([day, calories]) => ({
      day,
      calories: Math.round(calories),
    }));
  }

  private formatResponse(
    data: any,
    n: NutritionFactsNumericDto,
    micro: MicronutrientsDto,
    macroRatio?: { protein: number; carbs: number; fat: number },
  ): NutritionAnalysisResponseDto {
    const createdAt = data?.created_at ? new Date(data.created_at) : new Date();
    const updatedAt = data?.updated_at ? new Date(data.updated_at) : undefined;

    // Round all nutrition values to 2 decimal places to avoid floating point precision issues
    const roundTo2 = (val: number) => Math.round(val * 100) / 100;

    const response = {
      analysisId: data.id,
      foodLogId: data.food_log_id,
      nutritionFacts: {
        calories: roundTo2(n.calories),
        protein: `${roundTo2(n.protein)}g`,
        carbs: `${roundTo2(n.carbs)}g`,
        fat: `${roundTo2(n.fat)}g`,
        sugar: `${roundTo2(n.sugar)}g`,
        fiber: n.fiber ? `${roundTo2(n.fiber)}g` : undefined,
        sodium: n.sodium ? `${roundTo2(n.sodium)}mg` : undefined,
        cholesterol: n.cholesterol ? `${roundTo2(n.cholesterol)}mg` : undefined,
      },
      macroRatio,
      micronutrients: micro,
      healthTags: data.health_tags || [],
      warnings: data.warnings || [],
      createdAt,
      updatedAt,
    };

    this.logger.debug({ fn: 'formatResponse', response });

    return response;
  }

  private isValidUUID(str: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      str,
    );
  }

  private isSugarEstimated(
    items: FoodLogItem[],
    map: Map<string, FoodNutrient>,
  ): boolean {
    return items.some((item) => {
      const n = map.get(String(item.food_id));
      return n?.sugar_estimated === true;
    });
  }
}

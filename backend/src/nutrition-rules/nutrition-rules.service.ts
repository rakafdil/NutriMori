import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase';
import { CreateNutritionRuleDto, UpdateNutritionRuleDto } from './dto';

@Injectable()
export class NutritionRulesService {
  constructor(private supabaseService: SupabaseService) {}

  private get supabase() {
    return this.supabaseService.getClient();
  }

  async create(createDto: CreateNutritionRuleDto) {
    const { data, error } = await this.supabase
      .from('nutrition_rules')
      .insert({
        rule_name: createDto.ruleName,
        description: createDto.description,
        min_value: createDto.minValue,
        max_value: createDto.maxValue,
        nutrient: createDto.nutrient,
        severity: createDto.severity,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async findAll(options?: { nutrient?: string; severity?: string }) {
    let query = this.supabase
      .from('nutrition_rules')
      .select('*')
      .order('created_at', { ascending: false });

    if (options?.nutrient) {
      query = query.eq('nutrient', options.nutrient);
    }

    if (options?.severity) {
      query = query.eq('severity', options.severity);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async findOne(id: string) {
    const { data: rule, error } = await this.supabase
      .from('nutrition_rules')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !rule) {
      throw new NotFoundException(`Nutrition rule with ID ${id} not found`);
    }

    return rule;
  }

  async findByNutrient(nutrient: string) {
    const { data, error } = await this.supabase
      .from('nutrition_rules')
      .select('*')
      .eq('nutrient', nutrient)
      .order('severity', { ascending: true });

    if (error) throw error;
    return data;
  }

  async update(id: string, updateDto: UpdateNutritionRuleDto) {
    await this.findOne(id);

    const updateData: Record<string, unknown> = {};
    if (updateDto.ruleName !== undefined)
      updateData.rule_name = updateDto.ruleName;
    if (updateDto.description !== undefined)
      updateData.description = updateDto.description;
    if (updateDto.minValue !== undefined)
      updateData.min_value = updateDto.minValue;
    if (updateDto.maxValue !== undefined)
      updateData.max_value = updateDto.maxValue;
    if (updateDto.nutrient !== undefined)
      updateData.nutrient = updateDto.nutrient;
    if (updateDto.severity !== undefined)
      updateData.severity = updateDto.severity;

    const { data, error } = await this.supabase
      .from('nutrition_rules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async remove(id: string) {
    await this.findOne(id);

    const { data, error } = await this.supabase
      .from('nutrition_rules')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async checkNutrients(nutrients: Record<string, number>) {
    const { data: rules, error } = await this.supabase
      .from('nutrition_rules')
      .select('*');

    if (error) throw error;

    const violations: Array<{
      rule: (typeof rules)[number];
      value: number;
      violation: 'below_min' | 'above_max';
    }> = [];

    for (const rule of rules || []) {
      const nutrient = rule.nutrient;
      if (!nutrient || nutrients[nutrient] === undefined) continue;

      const value = nutrients[nutrient];

      if (rule.min_value && value < Number(rule.min_value)) {
        violations.push({ rule, value, violation: 'below_min' });
      }

      if (rule.max_value && value > Number(rule.max_value)) {
        violations.push({ rule, value, violation: 'above_max' });
      }
    }

    return {
      violations,
      hasViolations: violations.length > 0,
      criticalCount: violations.filter((v) => v.rule.severity === 'critical')
        .length,
      warningCount: violations.filter((v) => v.rule.severity === 'warning')
        .length,
      suggestionCount: violations.filter(
        (v) => v.rule.severity === 'suggestion',
      ).length,
    };
  }
}

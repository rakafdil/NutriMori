import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase';
import { CreateUserDto, UpdateUserDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private supabaseService: SupabaseService) {}

  private get supabase() {
    return this.supabaseService.getClient();
  }

  async create(createUserDto: CreateUserDto) {
    // Check if user already exists
    const { data: existingUser } = await this.supabase
      .from('users')
      .select('id')
      .eq('username', createUserDto.username)
      .single();

    if (existingUser) {
      throw new ConflictException('User with this username already exists');
    }

    const { data, error } = await this.supabase
      .from('users')
      .insert({
        username: createUserDto.username,
        age: createUserDto.age,
        height_cm: createUserDto.height_cm,
        weight_kg: createUserDto.weight_kg,
      })
      .select('*, user_preferences(*)')
      .single();

    if (error) throw error;
    return data;
  }

  async findAll() {
    const { data, error } = await this.supabase
      .from('users')
      .select('*, user_preferences(*)');

    if (error) throw error;
    return data;
  }

  async findOne(id: string) {
    const { data: user, error } = await this.supabase
      .from('users')
      .select(
        `
        *,
        user_preferences(*),
        user_food_logs(
          *,
          food_items(*),
          nutrition_rules(*)
        )
      `,
      )
      .eq('id', id)
      .order('created_at', {
        referencedTable: 'user_food_logs',
        ascending: false,
      })
      .limit(10, { referencedTable: 'user_food_logs' })
      .single();

    if (error || !user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string) {
    const { data: user, error } = await this.supabase
      .from('users')
      .select('*, user_preferences(*)')
      .eq('email', email)
      .single();

    if (error || !user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    // Check if user exists
    await this.findOne(id);

    // Check if username is already in use by another user
    if (updateUserDto.username) {
      const { data: existingUser } = await this.supabase
        .from('users')
        .select('id')
        .eq('username', updateUserDto.username)
        .neq('id', id)
        .single();

      if (existingUser) {
        throw new ConflictException('Username already in use');
      }
    }

    const updateData: Record<string, unknown> = {};
    if (updateUserDto.username !== undefined)
      updateData.username = updateUserDto.username;
    if (updateUserDto.age !== undefined) updateData.age = updateUserDto.age;
    if (updateUserDto.height_cm !== undefined)
      updateData.height_cm = updateUserDto.height_cm;
    if (updateUserDto.weight_kg !== undefined)
      updateData.weight_kg = updateUserDto.weight_kg;

    const { data, error } = await this.supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('*, user_preferences(*)')
      .single();

    if (error) throw error;
    return data;
  }

  async remove(id: string) {
    await this.findOne(id);

    const { data, error } = await this.supabase
      .from('users')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

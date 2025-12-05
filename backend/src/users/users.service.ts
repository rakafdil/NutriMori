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
      .eq('email', createUserDto.email)
      .single();

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const { data, error } = await this.supabase
      .from('users')
      .insert({
        email: createUserDto.email,
        name: createUserDto.name,
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

    // Check if email is already in use by another user
    if (updateUserDto.email) {
      const { data: existingUser } = await this.supabase
        .from('users')
        .select('id')
        .eq('email', updateUserDto.email)
        .neq('id', id)
        .single();

      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    const { data, error } = await this.supabase
      .from('users')
      .update({
        email: updateUserDto.email,
        name: updateUserDto.name,
      })
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

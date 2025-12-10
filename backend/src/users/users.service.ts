/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase';
import { UpdateUserDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private supabaseService: SupabaseService) {}

  // Use this for admin operations (bypasses RLS)
  private get adminClient() {
    return this.supabaseService.getClient();
  }

  // Use this for user operations (respects RLS)
  private getUserClient(accessToken: string) {
    return this.supabaseService.getUserClient(accessToken);
  }

  async getProfile(accessToken: string) {
    const { data, error } = await this.getUserClient(accessToken)
      .from('users')
      .select(`*`)
      .single();
    if (error || !data) {
      throw new NotFoundException(error?.message || 'User profile not found');
    }
    console.log(data);

    return data;
  }

  // 2. GET LOGS: Terpisah, mengambil data dari tabel food_logs
  async getFoodLogs(accessToken: string) {
    const { data, error } = await this.getUserClient(accessToken)
      .from('food_logs')
      .select('*')
      .order('created_at', { ascending: false }); // Urutkan dari yang terbaru

    if (error) throw error;

    return data;
  }

  async updateProfile(accessToken: string, updateUserDto: UpdateUserDto) {
    // Ambil profil user saat ini (memberi kita user.id)
    const user = await this.getProfile(accessToken);

    const rawUpdateData = {
      ...updateUserDto,
      isFillingPreferences: true,
    };

    const updateData = Object.fromEntries(
      Object.entries(rawUpdateData).filter(([_, v]) => v !== undefined),
    );

    // Sertakan WHERE clause agar PostgREST tidak menolak UPDATE
    const { data, error } = await this.getUserClient(accessToken)
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select('*')
      .single();

    console.log(error);
    if (error) {
      if (error.code === '23505') {
        throw new ConflictException('Username already in use');
      }
      throw error;
    }

    return data;
  }

  // Hapus akun sendiri
  async removeProfile(accessToken: string) {
    const { data, error } = await this.getUserClient(accessToken)
      .from('users')
      .delete()
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async checkFillPreferences(accessToken: string) {
    const { data, error } = await this.getUserClient(accessToken)
      .from('users')
      .select('isFillingPreferences')
      .single();

    if (error) throw error;
    return data;
  }
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;
  private supabaseUrl: string;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    if (!supabaseUrl) {
      throw new Error('Supabase URL must be provided');
    }
    this.supabaseUrl = supabaseUrl;
    const supabaseKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    if (!this.supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and Service Role Key must be provided');
    }

    this.supabase = createClient(this.supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  getUserClient(accessToken: string): SupabaseClient {
    const anonKey = this.configService.get<string>('SUPABASE_ANON_KEY');
    if (!anonKey) {
      throw new Error('Supabase Anon Key must be provided');
    }
    return createClient(
      this.supabaseUrl,
      anonKey, // Pakai Anon key, bukan Service key
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`, // Inject token user di sini
          },
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  // Helper method for vector similarity search
  async vectorSearch(
    tableName: string,
    embeddingColumn: string,
    queryEmbedding: number[],
    matchThreshold: number = 0.8,
    matchCount: number = 10,
  ) {
    const { data, error } = await this.supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
    });

    if (error) throw error;
    return data;
  }

  // Storage helpers
  async uploadFile(bucket: string, path: string, file: Buffer) {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(path, file);

    if (error) throw error;
    return data;
  }

  public getPublicUrl(bucket: string, path: string) {
    const { data } = this.supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }
}

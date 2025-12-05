import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { SupabaseService } from './supabase/supabase.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async getHealth() {
    const timestamp = new Date().toISOString();
    
    try {
      // Test koneksi database dengan query sederhana
      const { data, error } = await this.supabaseService.getClient()
        .from('users')
        .select('count')
        .limit(1);

      return {
        status: 'healthy',
        timestamp,
        database: error ? 'disconnected' : 'connected',
        databaseError: error ? error.message : null,
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp,
        database: 'disconnected',
        databaseError: error.message,
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
      };
    }
  }

  @Get('health/detailed')
  async getDetailedHealth() {
    const timestamp = new Date().toISOString();
    const checks = {
      database: false,
      api: true,
      memory: false,
    };

    const results: any = {
      timestamp,
      status: 'checking...',
      checks: {},
    };

    try {
      // Check 1: Database connection
      const startTime = Date.now();
      const { data, error } = await this.supabaseService.getClient()
        .from('users')
        .select('count')
        .limit(1);
      
      const dbLatency = Date.now() - startTime;
      checks.database = !error;
      
      results.checks.database = {
        status: !error ? 'healthy' : 'unhealthy',
        latency: `${dbLatency}ms`,
        message: !error ? 'Connected successfully' : error.message,
      };

      // Check 2: Memory usage
      const memoryUsage = process.memoryUsage();
      checks.memory = memoryUsage.heapUsed / memoryUsage.heapTotal < 0.9; // Jika < 90% usage
      
      results.checks.memory = {
        status: checks.memory ? 'healthy' : 'warning',
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        usagePercentage: `${Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)}%`,
      };

      // Overall status
      const allHealthy = Object.values(checks).every(check => check === true);
      results.status = allHealthy ? 'healthy' : 'unhealthy';
      
      return results;

    } catch (error) {
      results.status = 'unhealthy';
      results.error = error.message;
      return results;
    }
  }
}
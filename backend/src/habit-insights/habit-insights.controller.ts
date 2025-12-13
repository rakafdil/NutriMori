import { Body, Controller, Delete, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetUser, JwtAuthGuard } from '../auth';
import {
  GetHabitInsightDto,
  HabitInsightResponseDto,
  HabitPatternDto,
  PeriodType,
} from './dto';
import { HabitInsightsService } from './habit-insights.service';

// ============ DTOs for new endpoints ============

class RefreshInsightDto {
  period: PeriodType;
  forceRefresh?: boolean;
}

class PatternSummaryResponseDto {
  period: PeriodType;
  dateRange: { start: string; end: string };
  patterns: HabitPatternDto[];
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
}

class HealthScoreHistoryDto {
  history: Array<{ month: string; score: number; trend: string }>;
  currentScore: number;
  averageScore: number;
  improvement: number;
}

class CacheInvalidateResponseDto {
  success: boolean;
  message: string;
  deletedCount?: number;
}

@ApiTags('habit-insights')
@Controller('habit-insights')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class HabitInsightsController {
  constructor(private readonly habitInsightsService: HabitInsightsService) {}

  // ============ MAIN INSIGHT ENDPOINT ============

  @Get()
  @ApiOperation({
    summary: 'Get habit pattern insights',
    description:
      'Analyzes eating patterns over specified period and provides AI-powered insights, recommendations, and health score.',
  })
  @ApiResponse({
    status: 200,
    description: 'Habit insights generated successfully',
    type: HabitInsightResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getHabitInsight(
    @GetUser('id') userId: string,
    @Query() query: GetHabitInsightDto,
  ): Promise<HabitInsightResponseDto> {
    return this.habitInsightsService.generateInsight({
      ...query,
      userId,
    });
  }

  // ============ CACHE MANAGEMENT ============

  @Post('refresh')
  @ApiOperation({
    summary: 'Force refresh insights',
    description: 'Regenerates insights ignoring cached data.',
  })
  @ApiResponse({
    status: 200,
    description: 'Fresh insights generated',
    type: HabitInsightResponseDto,
  })
  async refreshInsight(
    @GetUser('id') userId: string,
    @Body() body: RefreshInsightDto,
  ): Promise<HabitInsightResponseDto> {
    // Invalidate cache first if forceRefresh is true
    if (body.forceRefresh) {
      await this.habitInsightsService.invalidateCache(userId, body.period);
    }

    return this.habitInsightsService.generateInsight({
      period: body.period,
      userId,
    });
  }

  @Delete('cache')
  @ApiOperation({
    summary: 'Invalidate cache',
    description: 'Deletes cached insights for a specific period or all periods.',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: PeriodType,
    description: 'Period to invalidate (optional - all if not specified)',
  })
  @ApiResponse({
    status: 200,
    description: 'Cache invalidated',
    type: CacheInvalidateResponseDto,
  })
  async invalidateCache(
    @GetUser('id') userId: string,
    @Query('period') period?: PeriodType,
  ): Promise<CacheInvalidateResponseDto> {
    const result = await this.habitInsightsService.invalidateCache(userId, period);
    return {
      success: true,
      message: period
        ? `Cache for ${period} period invalidated`
        : 'All cache invalidated',
      deletedCount: result,
    };
  }

  // ============ ANALYTICS ENDPOINTS ============

  @Get('patterns')
  @ApiOperation({
    summary: 'Get pattern summary only',
    description: 'Returns only detected patterns without full analysis.',
  })
  @ApiResponse({
    status: 200,
    description: 'Pattern summary',
    type: PatternSummaryResponseDto,
  })
  async getPatterns(
    @GetUser('id') userId: string,
    @Query() query: GetHabitInsightDto,
  ): Promise<PatternSummaryResponseDto> {
    const insight = await this.habitInsightsService.generateInsight({
      ...query,
      userId,
    });

    return {
      period: insight.period,
      dateRange: insight.dateRange,
      patterns: insight.patterns,
      positiveCount: insight.patterns.filter(p => p.type === 'positive').length,
      negativeCount: insight.patterns.filter(p => p.type === 'negative').length,
      neutralCount: insight.patterns.filter(p => p.type === 'neutral').length,
    };
  }

  @Get('health-score/history')
  @ApiOperation({
    summary: 'Get health score history',
    description: 'Returns monthly health score history for tracking progress.',
  })
  @ApiQuery({
    name: 'months',
    required: false,
    type: Number,
    description: 'Number of months to retrieve (default: 6)',
  })
  @ApiResponse({
    status: 200,
    description: 'Health score history',
    type: HealthScoreHistoryDto,
  })
  async getHealthScoreHistory(
    @GetUser('id') userId: string,
    @Query('months') months?: number,
  ): Promise<HealthScoreHistoryDto> {
    return this.habitInsightsService.getHealthScoreHistory(userId, months || 6);
  }
}

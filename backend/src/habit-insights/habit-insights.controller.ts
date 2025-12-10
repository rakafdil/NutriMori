import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { GetUser, JwtAuthGuard } from '../auth';
import { GetHabitInsightDto, HabitInsightResponseDto } from './dto';
import { HabitInsightsService } from './habit-insights.service';

@ApiTags('habit-insights')
@Controller('habit-insights')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class HabitInsightsController {
    constructor(private readonly habitInsightsService: HabitInsightsService) { }

    @Get()
    @ApiOperation({
        summary: 'Get habit pattern insights for authenticated user',
        description:
            'Analyzes authenticated user eating patterns over specified period (weekly/monthly/yearly/overall) and provides AI-powered insights, recommendations, and health score. User ID is automatically extracted from JWT token.',
    })
    @ApiResponse({
        status: 200,
        description: 'Habit insights generated successfully',
        type: HabitInsightResponseDto,
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
    @ApiResponse({ status: 404, description: 'User or food logs not found' })
    async getHabitInsight(
        @GetUser('id') userId: string,
        @Query() query: GetHabitInsightDto,
    ): Promise<HabitInsightResponseDto> {
        return this.habitInsightsService.generateInsight({
            ...query,
            userId,
        });
    }
}
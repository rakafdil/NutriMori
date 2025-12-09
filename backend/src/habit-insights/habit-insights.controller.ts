import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { HabitInsightsService } from './habit-insights.service';
import { GetHabitInsightDto, HabitInsightResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards';

@ApiTags('habit-insights')
@Controller('habit-insights')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class HabitInsightsController {
    constructor(private readonly habitInsightsService: HabitInsightsService) { }

    @Get()
    @ApiOperation({
        summary: 'Get habit pattern insights for a user',
        description:
            'Analyzes user eating patterns over specified period (weekly/monthly/yearly/overall) and provides AI-powered insights, recommendations, and health score.',
    })
    @ApiResponse({
        status: 200,
        description: 'Habit insights generated successfully',
        type: HabitInsightResponseDto,
    })
    @ApiResponse({ status: 404, description: 'User or food logs not found' })
    async getHabitInsight(
        @Query() query: GetHabitInsightDto,
    ): Promise<HabitInsightResponseDto> {
        return this.habitInsightsService.generateInsight(query);
    }
}
import {
    BadRequestException,
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateNutritionAnalysisDto, NutritionAnalysisResponseDto } from './dto';
import { NutritionAnalysisService } from './nutrition-analysis.service';

@ApiTags('Nutrition Analysis')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('nutrition-analysis')
export class NutritionAnalysisController {
    constructor(
        private readonly nutritionAnalysisService: NutritionAnalysisService,
    ) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Analyze nutrition for a food log',
        description:
            'Creates a comprehensive nutrition analysis for a food log. Retrieves nutrition data from database, calculates totals, generates health tags and warnings, then saves the analysis.',
    })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Analysis created successfully',
        type: NutritionAnalysisResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid food log ID or analysis failed',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Food log not found',
    })
    async analyzeNutrition(
        @GetUser('id') userId: string,
        @Body() createDto: CreateNutritionAnalysisDto,
    ): Promise<NutritionAnalysisResponseDto> {
        if (!userId) {
            throw new BadRequestException('User ID is missing from token');
        }
        return this.nutritionAnalysisService.analyzeNutrition(userId, createDto);
    }

    @Get('food-log/:foodLogId')
    @ApiOperation({
        summary: 'Get analysis by food log ID',
        description: 'Retrieves existing nutrition analysis for a specific food log',
    })
    @ApiParam({
        name: 'foodLogId',
        description: 'Food log UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Analysis found',
        type: NutritionAnalysisResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Analysis not found',
    })
    async getAnalysisByFoodLogId(
        @GetUser('id') userId: string,
        @Param('foodLogId') foodLogId: string,
    ): Promise<NutritionAnalysisResponseDto> {
        return this.nutritionAnalysisService.getAnalysisByFoodLogId(
            foodLogId,
            userId,
        );
    }

    @Get('history')
    @ApiOperation({
        summary: 'Get user nutrition analysis history',
        description: 'Retrieves the most recent nutrition analyses for the current user',
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        description: 'Number of records to return',
        example: 10,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Analysis history retrieved',
        type: [NutritionAnalysisResponseDto],
    })
    async getUserHistory(
        @GetUser('id') userId: string,
        @Query('limit') limit?: number,
    ): Promise<NutritionAnalysisResponseDto[]> {
        return this.nutritionAnalysisService.getUserAnalysisHistory(
            userId,
            limit || 10,
        );
    }

    @Get('calorie-intake/weekly')
    getWeeklyCalories(@GetUser('id') userId: string) {
        return this.nutritionAnalysisService.getWeeklyCalorieIntake(userId);
    }
}

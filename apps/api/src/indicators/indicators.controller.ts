import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IndicatorsService } from './indicators.service';
import { Prisma } from '@teachermon/database';

@ApiTags('indicators')
@Controller('indicators')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class IndicatorsController {
  constructor(private indicatorsService: IndicatorsService) {}

  @ApiOperation({ summary: 'Get all main indicators with sub-indicators' })
  @ApiQuery({
    name: 'includeSub',
    required: false,
    type: Boolean,
    description: 'Include sub-indicators in response',
  })
  @Get()
  async findAll(
    @Query('includeSub') includeSub?: string,
  ): Promise<{
    main: (Prisma.IndicatorGetPayload<{
      include: { subIndicators: true };
    }> | Prisma.IndicatorGetPayload<{
      include: { subIndicators: false };
    }>)[];
    total: number;
  }> {
    const includeSubIndicators = includeSub !== 'false';
    return this.indicatorsService.findAll(includeSubIndicators);
  }

  @ApiOperation({ summary: 'Get indicator by code' })
  @Get(':code')
  async findOneByCode(
    @Param('code') code: string,
    @Query('includeSub') includeSub?: string,
  ): Promise<
    | Prisma.IndicatorGetPayload<{
        include: { subIndicators: true };
      }>
    | Prisma.IndicatorGetPayload<{
        include: { subIndicators: false };
      }>
  > {
    const includeSubIndicators = includeSub !== 'false';
    return this.indicatorsService.findOneByCode(code, includeSubIndicators);
  }

  @ApiOperation({ summary: 'Get all sub-indicators' })
  @ApiQuery({
    name: 'indicatorId',
    required: false,
    type: String,
    description: 'Filter by main indicator ID',
  })
  @Get('sub-indicators')
  async findAllSubIndicators(
    @Query('indicatorId') indicatorId?: string,
  ): Promise<{
    data: (Prisma.SubIndicatorGetPayload<{}> & {
      indicator: {
        id: string;
        code: string;
        name: string;
        category: string;
        aspect: string;
      };
    })[];
    total: number;
  }> {
    return this.indicatorsService.findAllSubIndicators(indicatorId);
  }

  @ApiOperation({ summary: 'Get sub-indicator by code' })
  @Get('sub-indicators/:code')
  async findSubIndicatorByCode(
    @Param('code') code: string,
  ): Promise<
    Prisma.SubIndicatorGetPayload<{}> & {
      indicator: {
        id: string;
        code: string;
        name: string;
        category: string;
        aspect: string;
      };
    }
  > {
    return this.indicatorsService.findSubIndicatorByCode(code);
  }

  @ApiOperation({ summary: 'Get indicators by aspect (ด้าน)' })
  @Get('aspect/:aspect')
  async findByAspect(
    @Param('aspect') aspect: string,
  ): Promise<{
    aspect: string;
    indicators: Prisma.IndicatorGetPayload<{
      include: { subIndicators: true };
    }>[];
    total: number;
  }> {
    return this.indicatorsService.findByAspect(aspect);
  }

  @ApiOperation({ summary: 'Get indicators by category (หมวดหมู่)' })
  @Get('category/:category')
  async findByCategory(
    @Param('category') category: string,
  ): Promise<{
    category: string;
    indicators: Prisma.IndicatorGetPayload<{
      include: { subIndicators: true };
    }>[];
    total: number;
  }> {
    return this.indicatorsService.findByCategory(category);
  }

  @ApiOperation({ summary: 'Validate indicator codes' })
  @HttpCode(HttpStatus.OK)
  @Get('validate')
  async validateCodes(
    @Query('main') main?: string,
    @Query('sub') sub?: string,
  ) {
    const codes = {
      main: main ? main.split(',') : [],
      sub: sub ? sub.split(',') : [],
    };
    return this.indicatorsService.validateIndicatorCodes(codes);
  }
}

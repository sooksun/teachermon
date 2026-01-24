import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TeachersService } from './teachers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('teachers')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard) // TODO: Enable after login is working
@Controller('teachers')
export class TeachersController {
  constructor(private teachersService: TeachersService) {}

  @ApiOperation({ summary: 'Get all teachers with filters and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'region', required: false, type: String })
  @ApiQuery({ name: 'province', required: false, type: String })
  @ApiQuery({ name: 'schoolId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'cohort', required: false, type: Number })
  @Get()
  findAll(@Query() query: any) {
    return this.teachersService.findAll(query);
  }

  @ApiOperation({ summary: 'Get teacher by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teachersService.findOne(id);
  }

  @ApiOperation({ summary: 'Get teacher statistics' })
  @Get(':id/statistics')
  getStatistics(@Param('id') id: string) {
    return this.teachersService.getStatistics(id);
  }

  @ApiOperation({ summary: 'Create new teacher' })
  @Post()
  create(@Body() data: any) {
    return this.teachersService.create(data);
  }

  @ApiOperation({ summary: 'Update teacher' })
  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.teachersService.update(id, data);
  }

  @ApiOperation({ summary: 'Delete teacher' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.teachersService.remove(id);
  }
}

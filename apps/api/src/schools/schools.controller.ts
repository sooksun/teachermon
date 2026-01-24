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
import { SchoolsService } from './schools.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('schools')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard) // TODO: Enable after login is working
@Controller('schools')
export class SchoolsController {
  constructor(private schoolsService: SchoolsService) {}

  @ApiOperation({ summary: 'Get all schools with filters and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'region', required: false, type: String })
  @ApiQuery({ name: 'province', required: false, type: String })
  @ApiQuery({ name: 'schoolSize', required: false, type: String })
  @ApiQuery({ name: 'areaType', required: false, type: String })
  @Get()
  findAll(@Query() query: any) {
    return this.schoolsService.findAll(query);
  }

  @ApiOperation({ summary: 'Get school by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.schoolsService.findOne(id);
  }

  @ApiOperation({ summary: 'Get teachers in school' })
  @Get(':id/teachers')
  getTeachers(@Param('id') id: string) {
    return this.schoolsService.getTeachers(id);
  }

  @ApiOperation({ summary: 'Create new school' })
  @Post()
  create(@Body() data: any) {
    return this.schoolsService.create(data);
  }

  @ApiOperation({ summary: 'Update school' })
  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.schoolsService.update(id, data);
  }

  @ApiOperation({ summary: 'Delete school' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.schoolsService.remove(id);
  }
}

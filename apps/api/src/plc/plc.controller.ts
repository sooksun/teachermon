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
import { PLCService } from './plc.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('plc')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard) // TODO: Enable after login is working
@Controller('plc')
export class PLCController {
  constructor(private plcService: PLCService) {}

  @ApiOperation({ summary: 'Get all PLC activities' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'teacherId', required: false, type: String })
  @ApiQuery({ name: 'plcLevel', required: false, type: String })
  @Get()
  findAll(@Query() query: any) {
    return this.plcService.findAll(query);
  }

  @ApiOperation({ summary: 'Get PLC activity by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.plcService.findOne(id);
  }

  @ApiOperation({ summary: 'Get PLC group statistics' })
  @Get('stats/groups')
  getGroupStats(@Query('level') level?: string) {
    return this.plcService.getGroupStats(level || '');
  }

  @ApiOperation({ summary: 'Create new PLC activity' })
  @Post()
  create(@Body() data: any) {
    return this.plcService.create(data);
  }

  @ApiOperation({ summary: 'Update PLC activity' })
  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.plcService.update(id, data);
  }

  @ApiOperation({ summary: 'Delete PLC activity' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.plcService.remove(id);
  }
}

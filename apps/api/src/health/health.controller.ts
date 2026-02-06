import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  async check() {
    const start = Date.now();
    let dbOk = true;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbOk = false;
    }

    return {
      status: dbOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: Date.now() - start,
      services: {
        database: dbOk ? 'connected' : 'disconnected',
      },
    };
  }
}

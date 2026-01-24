import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@teachermon/database';

@Injectable()
export class PLCService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    teacherId?: string;
    plcLevel?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.PLCActivityWhereInput = {};

    if (params.teacherId) {
      where.teacherId = params.teacherId;
    }

    if (params.plcLevel) {
      where.plcLevel = params.plcLevel as any;
    }

    if (params.startDate || params.endDate) {
      where.plcDate = {};
      if (params.startDate) {
        where.plcDate.gte = params.startDate;
      }
      if (params.endDate) {
        where.plcDate.lte = params.endDate;
      }
    }

    const [activities, total] = await Promise.all([
      this.prisma.pLCActivity.findMany({
        where,
        include: {
          teacher: {
            select: {
              id: true,
              fullName: true,
              school: {
                select: {
                  schoolName: true,
                  province: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { plcDate: 'desc' },
      }),
      this.prisma.pLCActivity.count({ where }),
    ]);

    return {
      data: activities,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const activity = await this.prisma.pLCActivity.findUnique({
      where: { id },
      include: {
        teacher: {
          include: {
            school: true,
          },
        },
      },
    });

    if (!activity) {
      throw new NotFoundException(`PLC activity with ID ${id} not found`);
    }

    return activity;
  }

  async create(data: Prisma.PLCActivityCreateInput) {
    return this.prisma.pLCActivity.create({
      data,
      include: {
        teacher: {
          include: {
            school: true,
          },
        },
      },
    });
  }

  async update(id: string, data: Prisma.PLCActivityUpdateInput) {
    const activity = await this.prisma.pLCActivity.findUnique({ where: { id } });
    if (!activity) {
      throw new NotFoundException(`PLC activity with ID ${id} not found`);
    }

    return this.prisma.pLCActivity.update({
      where: { id },
      data,
      include: {
        teacher: {
          include: {
            school: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    const activity = await this.prisma.pLCActivity.findUnique({ where: { id } });
    if (!activity) {
      throw new NotFoundException(`PLC activity with ID ${id} not found`);
    }

    return this.prisma.pLCActivity.delete({ where: { id } });
  }

  async getGroupStats(level: string) {
    return this.prisma.pLCActivity.groupBy({
      by: ['plcLevel'],
      _count: true,
      where: level ? { plcLevel: level as any } : undefined,
    });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@teachermon/database';

@Injectable()
export class MentoringService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    teacherId?: string;
    visitType?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.MentoringVisitWhereInput = {};

    if (params.teacherId) {
      where.teacherId = params.teacherId;
    }

    if (params.visitType) {
      where.visitType = params.visitType as any;
    }

    if (params.startDate || params.endDate) {
      where.visitDate = {};
      if (params.startDate) {
        where.visitDate.gte = params.startDate;
      }
      if (params.endDate) {
        where.visitDate.lte = params.endDate;
      }
    }

    const [visits, total] = await Promise.all([
      this.prisma.mentoringVisit.findMany({
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
        orderBy: { visitDate: 'desc' },
      }),
      this.prisma.mentoringVisit.count({ where }),
    ]);

    return {
      data: visits,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const visit = await this.prisma.mentoringVisit.findUnique({
      where: { id },
      include: {
        teacher: {
          include: {
            school: true,
          },
        },
      },
    });

    if (!visit) {
      throw new NotFoundException(`Mentoring visit with ID ${id} not found`);
    }

    return visit;
  }

  async create(data: Prisma.MentoringVisitCreateInput) {
    return this.prisma.mentoringVisit.create({
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

  async update(id: string, data: Prisma.MentoringVisitUpdateInput) {
    const visit = await this.prisma.mentoringVisit.findUnique({ where: { id } });
    if (!visit) {
      throw new NotFoundException(`Mentoring visit with ID ${id} not found`);
    }

    return this.prisma.mentoringVisit.update({
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
    const visit = await this.prisma.mentoringVisit.findUnique({ where: { id } });
    if (!visit) {
      throw new NotFoundException(`Mentoring visit with ID ${id} not found`);
    }

    return this.prisma.mentoringVisit.delete({ where: { id } });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@teachermon/database';

@Injectable()
export class TeachersService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    region?: string;
    province?: string;
    schoolId?: string;
    status?: string;
    cohort?: number;
  }) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.TeacherWhereInput = {};

    if (params.search) {
      where.OR = [
        { fullName: { contains: params.search } },
        { citizenId: { contains: params.search } },
        { email: { contains: params.search } },
      ];
    }

    if (params.region) {
      where.school = { is: { region: params.region as any } };
    }

    if (params.province) {
      if (where.school?.is) {
        where.school.is.province = params.province;
      } else {
        where.school = { is: { province: params.province } };
      }
    }

    if (params.schoolId) {
      where.schoolId = params.schoolId;
    }

    if (params.status) {
      where.status = params.status as any;
    }

    if (params.cohort) {
      where.cohort = Number(params.cohort);
    }

    const [teachers, total] = await Promise.all([
      this.prisma.teacher.findMany({
        where,
        include: {
          school: {
            select: {
              id: true,
              schoolName: true,
              province: true,
              region: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.teacher.count({ where }),
    ]);

    return {
      data: teachers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: {
        school: true,
        mentoringVisits: {
          orderBy: { visitDate: 'desc' },
          take: 5,
        },
        competencyAssessments: {
          orderBy: { createdAt: 'desc' },
        },
        reflectiveJournals: {
          orderBy: { month: 'desc' },
          take: 6,
        },
        plcActivities: {
          orderBy: { plcDate: 'desc' },
          take: 10,
        },
        developmentPlans: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${id} not found`);
    }

    return teacher;
  }

  async create(data: Prisma.TeacherCreateInput) {
    return this.prisma.teacher.create({
      data,
      include: { school: true },
    });
  }

  async update(id: string, data: Prisma.TeacherUpdateInput) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id } });
    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${id} not found`);
    }

    return this.prisma.teacher.update({
      where: { id },
      data,
      include: { school: true },
    });
  }

  async remove(id: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id } });
    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${id} not found`);
    }

    return this.prisma.teacher.delete({ where: { id } });
  }

  async getStatistics(id: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id } });
    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${id} not found`);
    }

    const [visitsCount, journalsCount, plcCount, latestAssessment] = await Promise.all([
      this.prisma.mentoringVisit.count({ where: { teacherId: id } }),
      this.prisma.reflectiveJournal.count({ where: { teacherId: id } }),
      this.prisma.pLCActivity.count({ where: { teacherId: id } }),
      this.prisma.competencyAssessment.findFirst({
        where: { teacherId: id },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      visitsCount,
      journalsCount,
      plcCount,
      latestAssessment,
    };
  }
}

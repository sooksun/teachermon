import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@teachermon/database';

@Injectable()
export class SchoolsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    region?: string;
    province?: string;
    schoolSize?: string;
    areaType?: string;
  }) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.SchoolWhereInput = {};

    if (params.search) {
      where.OR = [
        { schoolName: { contains: params.search } },
        { province: { contains: params.search } },
        { directorName: { contains: params.search } },
      ];
    }

    if (params.region) {
      where.region = params.region as any;
    }

    if (params.province) {
      where.province = params.province;
    }

    if (params.schoolSize) {
      where.schoolSize = params.schoolSize as any;
    }

    if (params.areaType) {
      where.areaType = params.areaType as any;
    }

    const [schools, total] = await Promise.all([
      this.prisma.school.findMany({
        where,
        include: {
          _count: {
            select: { teachers: true },
          },
        },
        skip,
        take: limit,
        orderBy: { schoolName: 'asc' },
      }),
      this.prisma.school.count({ where }),
    ]);

    return {
      data: schools,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const school = await this.prisma.school.findUnique({
      where: { id },
      include: {
        teachers: {
          select: {
            id: true,
            fullName: true,
            position: true,
            cohort: true,
            status: true,
            appointmentDate: true,
          },
          orderBy: { fullName: 'asc' },
        },
      },
    });

    if (!school) {
      throw new NotFoundException(`School with ID ${id} not found`);
    }

    return school;
  }

  async getTeachers(id: string) {
    const school = await this.prisma.school.findUnique({ where: { id } });
    if (!school) {
      throw new NotFoundException(`School with ID ${id} not found`);
    }

    return this.prisma.teacher.findMany({
      where: { schoolId: id },
      orderBy: { fullName: 'asc' },
    });
  }

  async create(data: Prisma.SchoolCreateInput) {
    return this.prisma.school.create({ data });
  }

  async update(id: string, data: Prisma.SchoolUpdateInput) {
    const school = await this.prisma.school.findUnique({ where: { id } });
    if (!school) {
      throw new NotFoundException(`School with ID ${id} not found`);
    }

    return this.prisma.school.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    const school = await this.prisma.school.findUnique({ where: { id } });
    if (!school) {
      throw new NotFoundException(`School with ID ${id} not found`);
    }

    return this.prisma.school.delete({ where: { id } });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@teachermon/database';

@Injectable()
export class AssessmentService {
  constructor(private prisma: PrismaService) {}

  // Competency Assessments
  async findAllAssessments(teacherId?: string) {
    const where: Prisma.CompetencyAssessmentWhereInput = teacherId ? { teacherId } : {};

    return this.prisma.competencyAssessment.findMany({
      where,
      include: {
        teacher: {
          select: {
            id: true,
            fullName: true,
            school: {
              select: {
                schoolName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneAssessment(id: string) {
    const assessment = await this.prisma.competencyAssessment.findUnique({
      where: { id },
      include: {
        teacher: {
          include: {
            school: true,
          },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment with ID ${id} not found`);
    }

    return assessment;
  }

  async createAssessment(data: Prisma.CompetencyAssessmentCreateInput) {
    return this.prisma.competencyAssessment.create({
      data,
      include: { teacher: true },
    });
  }

  async updateAssessment(id: string, data: Prisma.CompetencyAssessmentUpdateInput) {
    const assessment = await this.prisma.competencyAssessment.findUnique({ where: { id } });
    if (!assessment) {
      throw new NotFoundException(`Assessment with ID ${id} not found`);
    }

    return this.prisma.competencyAssessment.update({
      where: { id },
      data,
      include: { teacher: true },
    });
  }

  async removeAssessment(id: string) {
    const assessment = await this.prisma.competencyAssessment.findUnique({ where: { id } });
    if (!assessment) {
      throw new NotFoundException(`Assessment with ID ${id} not found`);
    }

    return this.prisma.competencyAssessment.delete({ where: { id } });
  }

  // Development Plans
  async findAllPlans(teacherId?: string) {
    const where: Prisma.DevelopmentPlanWhereInput = teacherId ? { teacherId } : {};

    return this.prisma.developmentPlan.findMany({
      where,
      include: {
        teacher: {
          select: {
            id: true,
            fullName: true,
            school: {
              select: {
                schoolName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOnePlan(id: string) {
    const plan = await this.prisma.developmentPlan.findUnique({
      where: { id },
      include: {
        teacher: {
          include: {
            school: true,
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException(`Development plan with ID ${id} not found`);
    }

    return plan;
  }

  async createPlan(data: Prisma.DevelopmentPlanCreateInput) {
    return this.prisma.developmentPlan.create({
      data,
      include: { teacher: true },
    });
  }

  async updatePlan(id: string, data: Prisma.DevelopmentPlanUpdateInput) {
    const plan = await this.prisma.developmentPlan.findUnique({ where: { id } });
    if (!plan) {
      throw new NotFoundException(`Development plan with ID ${id} not found`);
    }

    return this.prisma.developmentPlan.update({
      where: { id },
      data,
      include: { teacher: true },
    });
  }

  async removePlan(id: string) {
    const plan = await this.prisma.developmentPlan.findUnique({ where: { id } });
    if (!plan) {
      throw new NotFoundException(`Development plan with ID ${id} not found`);
    }

    return this.prisma.developmentPlan.delete({ where: { id } });
  }
}

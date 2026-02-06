import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSelfAssessmentDto } from './dto/create-self-assessment.dto';
import { UpdateSelfAssessmentDto } from './dto/update-self-assessment.dto';
import { SelfAssessmentStatus } from '@teachermon/database';

@Injectable()
export class SelfAssessmentService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, teacherId: string, dto: CreateSelfAssessmentDto): Promise<any> {
    // Create self-assessment
    const assessment = await this.prisma.selfAssessment.create({
      data: {
        teacherId,
        assessmentPeriod: dto.assessmentPeriod,
        pedagogyScore: dto.pedagogyScore,
        classroomScore: dto.classroomScore,
        communityScore: dto.communityScore,
        professionalismScore: dto.professionalismScore,
        pedagogyReflection: dto.pedagogyReflection,
        classroomReflection: dto.classroomReflection,
        communityReflection: dto.communityReflection,
        professionalismReflection: dto.professionalismReflection,
        overallLevel: dto.overallLevel,
        strengths: dto.strengths,
        areasForImprovement: dto.areasForImprovement,
        actionPlan: dto.actionPlan,
      },
      include: {
        teacher: {
          include: {
            school: true,
          },
        },
        portfolioItems: true,
      },
    });

    // Link portfolio items if provided
    if (dto.portfolioItemIds && dto.portfolioItemIds.length > 0) {
      await this.prisma.evidencePortfolio.updateMany({
        where: {
          id: { in: dto.portfolioItemIds },
          teacherId, // Ensure items belong to the teacher
        },
        data: {
          selfAssessmentId: assessment.id,
        },
      });
    }

    return this.findOne(assessment.id);
  }

  async findAll(teacherId: string, period?: string, status?: string): Promise<any[]> {
    const where: any = { teacherId };
    
    if (period) {
      where.assessmentPeriod = period;
    }
    
    if (status) {
      where.status = status as SelfAssessmentStatus;
    }

    return this.prisma.selfAssessment.findMany({
      where,
      include: {
        teacher: {
          include: {
            school: true,
          },
        },
        portfolioItems: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string): Promise<any> {
    const assessment = await this.prisma.selfAssessment.findUnique({
      where: { id },
      include: {
        teacher: {
          include: {
            school: true,
          },
        },
        portfolioItems: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException(`Self-assessment with ID ${id} not found`);
    }

    return assessment;
  }

  async update(
    id: string,
    teacherId: string,
    dto: UpdateSelfAssessmentDto,
  ): Promise<any> {
    // Verify ownership
    const assessment = await this.prisma.selfAssessment.findUnique({
      where: { id },
    });

    if (!assessment) {
      throw new NotFoundException(`Self-assessment with ID ${id} not found`);
    }

    if (assessment.teacherId !== teacherId) {
      throw new ForbiddenException('You can only update your own assessments');
    }

    if (assessment.status === SelfAssessmentStatus.SUBMITTED) {
      throw new ForbiddenException('Cannot update submitted assessment');
    }

    // Update assessment
    const updated = await this.prisma.selfAssessment.update({
      where: { id },
      data: {
        assessmentPeriod: dto.assessmentPeriod,
        pedagogyScore: dto.pedagogyScore,
        classroomScore: dto.classroomScore,
        communityScore: dto.communityScore,
        professionalismScore: dto.professionalismScore,
        pedagogyReflection: dto.pedagogyReflection,
        classroomReflection: dto.classroomReflection,
        communityReflection: dto.communityReflection,
        professionalismReflection: dto.professionalismReflection,
        overallLevel: dto.overallLevel,
        strengths: dto.strengths,
        areasForImprovement: dto.areasForImprovement,
        actionPlan: dto.actionPlan,
      },
    });

    // Update portfolio linkages if provided
    if (dto.portfolioItemIds) {
      // Remove all existing links
      await this.prisma.evidencePortfolio.updateMany({
        where: {
          selfAssessmentId: id,
        },
        data: {
          selfAssessmentId: null,
        },
      });

      // Add new links
      if (dto.portfolioItemIds.length > 0) {
        await this.prisma.evidencePortfolio.updateMany({
          where: {
            id: { in: dto.portfolioItemIds },
            teacherId, // Ensure items belong to the teacher
          },
          data: {
            selfAssessmentId: id,
          },
        });
      }
    }

    return this.findOne(id);
  }

  async submit(id: string, teacherId: string): Promise<any> {
    const assessment = await this.prisma.selfAssessment.findUnique({
      where: { id },
    });

    if (!assessment) {
      throw new NotFoundException(`Self-assessment with ID ${id} not found`);
    }

    if (assessment.teacherId !== teacherId) {
      throw new ForbiddenException('You can only submit your own assessments');
    }

    if (assessment.status !== SelfAssessmentStatus.DRAFT) {
      throw new ForbiddenException('Only draft assessments can be submitted');
    }

    return this.prisma.selfAssessment.update({
      where: { id },
      data: {
        status: SelfAssessmentStatus.SUBMITTED,
        submittedAt: new Date(),
      },
      include: {
        teacher: {
          include: {
            school: true,
          },
        },
        portfolioItems: true,
      },
    });
  }

  async review(
    id: string,
    reviewerId: string,
    comments: string,
  ): Promise<any> {
    const assessment = await this.prisma.selfAssessment.findUnique({
      where: { id },
    });

    if (!assessment) {
      throw new NotFoundException(`Self-assessment with ID ${id} not found`);
    }

    if (assessment.status !== SelfAssessmentStatus.SUBMITTED) {
      throw new ForbiddenException('Only submitted assessments can be reviewed');
    }

    return this.prisma.selfAssessment.update({
      where: { id },
      data: {
        status: SelfAssessmentStatus.REVIEWED,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewerComments: comments,
      },
      include: {
        teacher: {
          include: {
            school: true,
          },
        },
        portfolioItems: true,
      },
    });
  }

  async delete(id: string, teacherId: string): Promise<any> {
    const assessment = await this.prisma.selfAssessment.findUnique({
      where: { id },
    });

    if (!assessment) {
      throw new NotFoundException(`Self-assessment with ID ${id} not found`);
    }

    if (assessment.teacherId !== teacherId) {
      throw new ForbiddenException('You can only delete your own assessments');
    }

    if (assessment.status === SelfAssessmentStatus.REVIEWED) {
      throw new ForbiddenException('Cannot delete reviewed assessment');
    }

    // Unlink portfolio items first
    await this.prisma.evidencePortfolio.updateMany({
      where: { selfAssessmentId: id },
      data: { selfAssessmentId: null },
    });

    return this.prisma.selfAssessment.delete({
      where: { id },
    });
  }
}

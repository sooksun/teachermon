import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@teachermon/database';

@Injectable()
export class JournalsService {
  constructor(private prisma: PrismaService) {}

  async findAll(teacherId?: string) {
    const where: Prisma.ReflectiveJournalWhereInput = teacherId ? { teacherId } : {};

    return this.prisma.reflectiveJournal.findMany({
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
      orderBy: { month: 'desc' },
    });
  }

  async findOne(id: string) {
    const journal = await this.prisma.reflectiveJournal.findUnique({
      where: { id },
      include: {
        teacher: {
          include: {
            school: true,
          },
        },
      },
    });

    if (!journal) {
      throw new NotFoundException(`Journal with ID ${id} not found`);
    }

    return journal;
  }

  async findByTeacherAndMonth(teacherId: string, month: string) {
    return this.prisma.reflectiveJournal.findUnique({
      where: {
        teacherId_month: {
          teacherId,
          month,
        },
      },
    });
  }

  async create(data: Prisma.ReflectiveJournalCreateInput) {
    // Check if journal for this teacher and month already exists
    const existing = await this.prisma.reflectiveJournal.findUnique({
      where: {
        teacherId_month: {
          teacherId: data.teacher.connect?.id || '',
          month: data.month,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Journal for this month already exists');
    }

    return this.prisma.reflectiveJournal.create({
      data,
      include: { teacher: true },
    });
  }

  async update(id: string, data: Prisma.ReflectiveJournalUpdateInput) {
    const journal = await this.prisma.reflectiveJournal.findUnique({ where: { id } });
    if (!journal) {
      throw new NotFoundException(`Journal with ID ${id} not found`);
    }

    return this.prisma.reflectiveJournal.update({
      where: { id },
      data,
      include: { teacher: true },
    });
  }

  async remove(id: string) {
    const journal = await this.prisma.reflectiveJournal.findUnique({ where: { id } });
    if (!journal) {
      throw new NotFoundException(`Journal with ID ${id} not found`);
    }

    return this.prisma.reflectiveJournal.delete({ where: { id } });
  }
}

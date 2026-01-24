import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getOverallStats() {
    const [
      totalTeachers,
      activeTeachers,
      totalSchools,
      totalVisits,
      totalJournals,
      totalPLC,
      teachersByRegion,
      teachersByStatus,
      recentVisits,
      recentJournals,
    ] = await Promise.all([
      this.prisma.teacher.count(),
      this.prisma.teacher.count({ where: { status: 'ACTIVE' } }),
      this.prisma.school.count(),
      this.prisma.mentoringVisit.count(),
      this.prisma.reflectiveJournal.count(),
      this.prisma.pLCActivity.count(),
      this.prisma.teacher.groupBy({
        by: ['schoolId'],
        _count: true,
      }),
      this.prisma.teacher.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.mentoringVisit.findMany({
        take: 10,
        orderBy: { visitDate: 'desc' },
        include: {
          teacher: {
            select: {
              fullName: true,
              school: {
                select: {
                  schoolName: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.reflectiveJournal.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          teacher: {
            select: {
              fullName: true,
            },
          },
        },
      }),
    ]);

    // Get teachers by region
    const teachersWithSchool = await this.prisma.teacher.findMany({
      include: {
        school: {
          select: { region: true },
        },
      },
    });

    const regionStats = teachersWithSchool.reduce((acc: any, teacher) => {
      const region = teacher.school.region;
      acc[region] = (acc[region] || 0) + 1;
      return acc;
    }, {});

    return {
      summary: {
        totalTeachers,
        activeTeachers,
        totalSchools,
        totalVisits,
        totalJournals,
        totalPLC,
      },
      teachersByRegion: regionStats,
      teachersByStatus: teachersByStatus.reduce((acc: any, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {}),
      recentActivities: {
        visits: recentVisits,
        journals: recentJournals,
      },
    };
  }

  async getTeacherStats() {
    const teachers = await this.prisma.teacher.findMany({
      include: {
        school: {
          select: {
            region: true,
            province: true,
          },
        },
        _count: {
          select: {
            mentoringVisits: true,
            reflectiveJournals: true,
            plcActivities: true,
          },
        },
      },
    });

    return teachers;
  }

  async getMonthlyTrends() {
    // Get data for the last 12 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [visits, journals, plc] = await Promise.all([
      this.prisma.mentoringVisit.findMany({
        where: {
          visitDate: {
            gte: sixMonthsAgo,
          },
        },
        select: {
          visitDate: true,
        },
      }),
      this.prisma.reflectiveJournal.findMany({
        where: {
          createdAt: {
            gte: sixMonthsAgo,
          },
        },
        select: {
          month: true,
        },
      }),
      this.prisma.pLCActivity.findMany({
        where: {
          plcDate: {
            gte: sixMonthsAgo,
          },
        },
        select: {
          plcDate: true,
        },
      }),
    ]);

    // Group by month
    const monthlyData: any = {};

    visits.forEach((visit) => {
      const month = visit.visitDate.toISOString().slice(0, 7);
      if (!monthlyData[month]) monthlyData[month] = { visits: 0, journals: 0, plc: 0 };
      monthlyData[month].visits++;
    });

    journals.forEach((journal) => {
      const month = journal.month;
      if (!monthlyData[month]) monthlyData[month] = { visits: 0, journals: 0, plc: 0 };
      monthlyData[month].journals++;
    });

    plc.forEach((activity) => {
      const month = activity.plcDate.toISOString().slice(0, 7);
      if (!monthlyData[month]) monthlyData[month] = { visits: 0, journals: 0, plc: 0 };
      monthlyData[month].plc++;
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        ...(data as any),
      }));
  }
}

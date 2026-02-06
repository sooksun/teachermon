import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getOverallStats(): Promise<any> {
    // Cache dashboard stats for 30 seconds
    const cacheKey = 'dashboard:overallStats';
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;
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
      planByStatus,
      allPlans,
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
      this.prisma.developmentPlan.groupBy({
        by: ['progressStatus'],
        _count: true,
      }),
      this.prisma.developmentPlan.findMany({
        select: { budgetAllocated: true, budgetUsed: true, focusCompetency: true },
      }),
    ]);

    // Get teachers by region using raw aggregation (avoid loading all teachers)
    const regionRows: any[] = await this.prisma.$queryRaw`
      SELECT s.region, COUNT(t.id) as count
      FROM teacher_profile t
      JOIN school_profile s ON t.school_id = s.id
      GROUP BY s.region
    `;
    const regionStats = regionRows.reduce((acc: any, row: any) => {
      acc[row.region] = Number(row.count);
      return acc;
    }, {});

    // Plan progress (Objective 2: monitor plan)
    const planProgress = planByStatus.reduce(
      (acc: Record<string, number>, item) => {
        acc[item.progressStatus] = item._count;
        return acc;
      },
      {},
    );
    const totalPlans = Object.values(planProgress).reduce((a, b) => a + b, 0);

    // Budget (Objective 2: monitor money)
    let totalAllocated = 0;
    let totalUsed = 0;
    for (const p of allPlans) {
      const alloc = p.budgetAllocated != null ? Number(p.budgetAllocated) : 0;
      const used = p.budgetUsed != null ? Number(p.budgetUsed) : 0;
      totalAllocated += alloc;
      totalUsed += used;
    }

    // Active Learning focus count (Objective 1: upskill Active Learning - WP.2)
    const activeLearningPlanCount = allPlans.filter(
      (p) =>
        p.focusCompetency === 'WP.2' ||
        p.focusCompetency === 'WP_2' ||
        String(p.focusCompetency).toUpperCase().includes('WP.2') ||
        String(p.focusCompetency).toUpperCase().includes('WP_2'),
    ).length;

    const result = {
      summary: {
        totalTeachers,
        activeTeachers,
        totalSchools,
        totalVisits,
        totalJournals,
        totalPLC,
        totalPlans,
      },
      planProgress: {
        ...planProgress,
        total: totalPlans,
      },
      planBudget: {
        totalAllocated,
        totalUsed,
        totalRemaining: Math.max(0, totalAllocated - totalUsed),
      },
      activeLearningPlanCount,
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

    await this.cacheManager.set(cacheKey, result, 30000);
    return result;
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
    // Cache monthly trends for 60 seconds
    const cacheKey = 'dashboard:monthlyTrends';
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Use raw SQL aggregation instead of loading all records into memory
    const [visitRows, journalRows, plcRows] = await Promise.all([
      this.prisma.$queryRaw<any[]>`
        SELECT DATE_FORMAT(visit_date, '%Y-%m') as month, COUNT(*) as count
        FROM mentoring_visit
        WHERE visit_date >= ${sixMonthsAgo}
        GROUP BY DATE_FORMAT(visit_date, '%Y-%m')
      `,
      this.prisma.$queryRaw<any[]>`
        SELECT month, COUNT(*) as count
        FROM reflective_journal
        WHERE created_at >= ${sixMonthsAgo}
        GROUP BY month
      `,
      this.prisma.$queryRaw<any[]>`
        SELECT DATE_FORMAT(plc_date, '%Y-%m') as month, COUNT(*) as count
        FROM plc_activity
        WHERE plc_date >= ${sixMonthsAgo}
        GROUP BY DATE_FORMAT(plc_date, '%Y-%m')
      `,
    ]);

    const monthlyData: Record<string, { visits: number; journals: number; plc: number }> = {};
    for (const row of visitRows) {
      if (!monthlyData[row.month]) monthlyData[row.month] = { visits: 0, journals: 0, plc: 0 };
      monthlyData[row.month].visits = Number(row.count);
    }
    for (const row of journalRows) {
      if (!monthlyData[row.month]) monthlyData[row.month] = { visits: 0, journals: 0, plc: 0 };
      monthlyData[row.month].journals = Number(row.count);
    }
    for (const row of plcRows) {
      if (!monthlyData[row.month]) monthlyData[row.month] = { visits: 0, journals: 0, plc: 0 };
      monthlyData[row.month].plc = Number(row.count);
    }

    const result = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }));

    await this.cacheManager.set(cacheKey, result, 60000);
    return result;
  }
}

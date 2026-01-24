export type { School, Teacher, MentoringVisit, CompetencyAssessment, ReflectiveJournal, PLCActivity, DevelopmentPlan, PolicyInsight, User, } from '@teachermon/database';
export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}
export interface TeacherFilters {
    region?: string;
    province?: string;
    schoolId?: string;
    status?: string;
    cohort?: number;
    search?: string;
}
export interface DashboardStats {
    totalTeachers: number;
    activeTeachers: number;
    totalSchools: number;
    totalVisits: number;
    recentJournals: number;
}
//# sourceMappingURL=index.d.ts.map
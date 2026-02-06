import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@teachermon/database';
import {
  CreateProjectBudgetDto,
  UpdateProjectBudgetDto,
  CreateTransactionDto,
  UpdateTransactionDto,
} from './dto/create-transaction.dto';
import { TransactionQueryDto, BudgetReportQueryDto } from './dto/budget-query.dto';

@Injectable()
export class BudgetService {
  constructor(private prisma: PrismaService) {}

  // =============================================
  // Project Budget CRUD
  // =============================================

  async findAllBudgets(): Promise<any[]> {
    return this.prisma.projectBudget.findMany({
      orderBy: { fiscalYear: 'desc' },
      include: {
        _count: { select: { transactions: true } },
      },
    });
  }

  async createBudget(data: CreateProjectBudgetDto, userId: string): Promise<any> {
    return this.prisma.projectBudget.create({
      data: {
        fiscalYear: data.fiscalYear,
        name: data.name,
        totalAllocated: new Prisma.Decimal(data.totalAllocated),
        fundingSource: data.fundingSource,
        description: data.description,
        createdBy: userId,
      },
    });
  }

  async updateBudget(id: string, data: UpdateProjectBudgetDto): Promise<any> {
    const budget = await this.prisma.projectBudget.findUnique({ where: { id } });
    if (!budget) throw new NotFoundException(`งบประมาณ ID ${id} ไม่พบ`);

    const updateData: any = { ...data };
    if (data.totalAllocated !== undefined) {
      updateData.totalAllocated = new Prisma.Decimal(data.totalAllocated);
    }

    return this.prisma.projectBudget.update({
      where: { id },
      data: updateData,
    });
  }

  // =============================================
  // Budget Summary
  // =============================================

  async getSummary() {
    const budgets = await this.prisma.projectBudget.findMany({
      where: { isActive: true },
      select: { id: true, totalAllocated: true },
    });

    const totalAllocated = budgets.reduce(
      (sum, b) => sum + Number(b.totalAllocated),
      0,
    );

    // Only APPROVED transactions count as used
    const approvedResult = await this.prisma.budgetTransaction.aggregate({
      where: {
        status: 'APPROVED',
        projectBudget: { isActive: true },
      },
      _sum: { amount: true },
    });
    const totalUsed = Number(approvedResult._sum.amount || 0);

    // PENDING transactions
    const pendingResult = await this.prisma.budgetTransaction.aggregate({
      where: {
        status: 'PENDING',
        projectBudget: { isActive: true },
      },
      _sum: { amount: true },
      _count: true,
    });
    const totalPending = Number(pendingResult._sum.amount || 0);
    const pendingCount = pendingResult._count;

    return {
      totalAllocated,
      totalUsed,
      totalPending,
      totalRemaining: Math.max(0, totalAllocated - totalUsed),
      pendingCount,
      budgetCount: budgets.length,
    };
  }

  // =============================================
  // Transaction CRUD
  // =============================================

  async findAllTransactions(query: TransactionQueryDto): Promise<any> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.BudgetTransactionWhereInput = {};
    if (query.category) where.category = query.category;
    if (query.status) where.status = query.status;
    if (query.projectBudgetId) where.projectBudgetId = query.projectBudgetId;
    if (query.startDate || query.endDate) {
      where.transactionDate = {};
      if (query.startDate) where.transactionDate.gte = new Date(query.startDate);
      if (query.endDate) where.transactionDate.lte = new Date(query.endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.budgetTransaction.findMany({
        where,
        include: {
          projectBudget: {
            select: { id: true, name: true, fiscalYear: true },
          },
        },
        orderBy: { transactionDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.budgetTransaction.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOneTransaction(id: string): Promise<any> {
    const tx = await this.prisma.budgetTransaction.findUnique({
      where: { id },
      include: {
        projectBudget: true,
      },
    });
    if (!tx) throw new NotFoundException(`รายการจ่าย ID ${id} ไม่พบ`);
    return tx;
  }

  async createTransaction(data: CreateTransactionDto, userId: string): Promise<any> {
    // Verify project budget exists
    const budget = await this.prisma.projectBudget.findUnique({
      where: { id: data.projectBudgetId },
    });
    if (!budget) throw new NotFoundException(`งบประมาณโครงการ ID ${data.projectBudgetId} ไม่พบ`);

    return this.prisma.budgetTransaction.create({
      data: {
        projectBudgetId: data.projectBudgetId,
        transactionDate: new Date(data.transactionDate),
        amount: new Prisma.Decimal(data.amount),
        category: data.category,
        description: data.description,
        recipient: data.recipient,
        receiptNumber: data.receiptNumber,
        receiptFile: data.receiptFile,
        relatedActivityType: data.relatedActivityType,
        relatedActivityId: data.relatedActivityId,
        status: 'PENDING',
        createdBy: userId,
      },
      include: {
        projectBudget: { select: { id: true, name: true } },
      },
    });
  }

  async updateTransaction(id: string, data: UpdateTransactionDto, userId: string): Promise<any> {
    const tx = await this.prisma.budgetTransaction.findUnique({ where: { id } });
    if (!tx) throw new NotFoundException(`รายการจ่าย ID ${id} ไม่พบ`);
    if (tx.status !== 'PENDING') {
      throw new ForbiddenException('แก้ไขได้เฉพาะรายการที่รออนุมัติเท่านั้น');
    }

    const updateData: any = { ...data };
    if (data.amount !== undefined) {
      updateData.amount = new Prisma.Decimal(data.amount);
    }
    if (data.transactionDate) {
      updateData.transactionDate = new Date(data.transactionDate);
    }

    return this.prisma.budgetTransaction.update({
      where: { id },
      data: updateData,
      include: {
        projectBudget: { select: { id: true, name: true } },
      },
    });
  }

  async removeTransaction(id: string): Promise<any> {
    const tx = await this.prisma.budgetTransaction.findUnique({ where: { id } });
    if (!tx) throw new NotFoundException(`รายการจ่าย ID ${id} ไม่พบ`);
    if (tx.status !== 'PENDING') {
      throw new ForbiddenException('ลบได้เฉพาะรายการที่รออนุมัติเท่านั้น');
    }

    return this.prisma.budgetTransaction.delete({ where: { id } });
  }

  // =============================================
  // Approval
  // =============================================

  async approveTransaction(
    id: string,
    action: 'APPROVED' | 'REJECTED',
    userId: string,
    rejectionReason?: string,
  ): Promise<any> {
    const tx = await this.prisma.budgetTransaction.findUnique({ where: { id } });
    if (!tx) throw new NotFoundException(`รายการจ่าย ID ${id} ไม่พบ`);
    if (tx.status !== 'PENDING') {
      throw new ForbiddenException('อนุมัติ/ปฏิเสธได้เฉพาะรายการที่รออนุมัติเท่านั้น');
    }

    return this.prisma.budgetTransaction.update({
      where: { id },
      data: {
        status: action,
        approvedBy: userId,
        approvedAt: new Date(),
        rejectionReason: action === 'REJECTED' ? rejectionReason : null,
      },
      include: {
        projectBudget: { select: { id: true, name: true } },
      },
    });
  }

  // =============================================
  // Reports
  // =============================================

  async getReport(query: BudgetReportQueryDto) {
    const where: Prisma.BudgetTransactionWhereInput = {
      status: 'APPROVED',
    };
    if (query.projectBudgetId) where.projectBudgetId = query.projectBudgetId;
    if (query.startDate || query.endDate) {
      where.transactionDate = {};
      if (query.startDate) where.transactionDate.gte = new Date(query.startDate);
      if (query.endDate) where.transactionDate.lte = new Date(query.endDate);
    }

    // Group by category
    const byCategory = await this.prisma.budgetTransaction.groupBy({
      by: ['category'],
      where,
      _sum: { amount: true },
      _count: true,
    });

    // Total approved
    const totalApproved = byCategory.reduce(
      (sum, item) => sum + Number(item._sum.amount || 0),
      0,
    );

    const categoryBreakdown = byCategory.map((item) => ({
      category: item.category,
      total: Number(item._sum.amount || 0),
      count: item._count,
      percentage: totalApproved > 0
        ? Math.round((Number(item._sum.amount || 0) / totalApproved) * 10000) / 100
        : 0,
    }));

    // Monthly breakdown using raw query
    const monthlyRows: any[] = await this.prisma.$queryRaw`
      SELECT 
        DATE_FORMAT(transaction_date, '%Y-%m') as month,
        SUM(amount) as total,
        COUNT(*) as count
      FROM budget_transaction
      WHERE status = 'APPROVED'
        ${query.projectBudgetId ? Prisma.sql`AND project_budget_id = ${query.projectBudgetId}` : Prisma.sql``}
        ${query.startDate ? Prisma.sql`AND transaction_date >= ${new Date(query.startDate)}` : Prisma.sql``}
        ${query.endDate ? Prisma.sql`AND transaction_date <= ${new Date(query.endDate)}` : Prisma.sql``}
      GROUP BY DATE_FORMAT(transaction_date, '%Y-%m')
      ORDER BY month ASC
    `;

    const monthlyBreakdown = monthlyRows.map((row) => ({
      month: row.month,
      total: Number(row.total),
      count: Number(row.count),
    }));

    // Budget info
    const budgets = await this.prisma.projectBudget.findMany({
      where: query.projectBudgetId
        ? { id: query.projectBudgetId }
        : { isActive: true },
      select: { totalAllocated: true },
    });
    const totalAllocated = budgets.reduce(
      (sum, b) => sum + Number(b.totalAllocated),
      0,
    );

    return {
      totalAllocated,
      totalUsed: totalApproved,
      totalRemaining: Math.max(0, totalAllocated - totalApproved),
      usagePercentage: totalAllocated > 0
        ? Math.round((totalApproved / totalAllocated) * 10000) / 100
        : 0,
      categoryBreakdown,
      monthlyBreakdown,
    };
  }

  async getReportPdf(query: BudgetReportQueryDto) {
    const report = await this.getReport(query);

    const categoryLabels: Record<string, string> = {
      MENTORING: 'ค่าหนุนเสริม/นิเทศ',
      PLC: 'ค่ากิจกรรม PLC',
      TRAINING: 'ค่าอบรม/พัฒนา',
      MATERIAL: 'ค่าวัสดุ/อุปกรณ์',
      TRAVEL: 'ค่าเดินทาง',
      ACCOMMODATION: 'ค่าที่พัก',
      FOOD: 'ค่าอาหาร',
      PRINTING: 'ค่าพิมพ์/เอกสาร',
      COMMUNICATION: 'ค่าสื่อสาร',
      OTHER: 'อื่นๆ',
    };

    const categoryRows = report.categoryBreakdown
      .map(
        (c) => `
        <tr>
          <td>${categoryLabels[c.category] || c.category}</td>
          <td style="text-align:right">${c.count}</td>
          <td style="text-align:right">${c.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
          <td style="text-align:right">${c.percentage}%</td>
        </tr>`,
      )
      .join('');

    const thaiMonthNames = [
      '', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
    ];

    const formatMonthThai = (ym: string) => {
      const [y, m] = ym.split('-').map(Number);
      return `${thaiMonthNames[m] || m} ${y + 543}`;
    };

    const monthlyRows = report.monthlyBreakdown
      .map(
        (m) => `
        <tr>
          <td>${formatMonthThai(m.month)}</td>
          <td style="text-align:right">${m.count}</td>
          <td style="text-align:right">${m.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
        </tr>`,
      )
      .join('');

    // สร้างวันที่ พ.ศ. สำหรับ header
    const now = new Date();
    const thaiDay = now.getDate();
    const thaiMonth = thaiMonthNames[now.getMonth() + 1];
    const thaiYear = now.getFullYear() + 543;
    const thaiDateStr = `${thaiDay} ${thaiMonth} ${thaiYear}`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>รายงานสรุปการใช้จ่ายงบประมาณโครงการ</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');
        body { font-family: 'Sarabun', sans-serif; padding: 20px; font-size: 14px; color: #333; }
        h1 { text-align: center; font-size: 20px; margin-bottom: 5px; }
        h2 { font-size: 16px; margin-top: 20px; border-bottom: 2px solid #333; padding-bottom: 4px; }
        .summary { display: flex; gap: 20px; margin: 15px 0; }
        .summary-card { flex: 1; padding: 12px; border: 1px solid #ddd; border-radius: 6px; text-align: center; }
        .summary-card .label { font-size: 12px; color: #666; }
        .summary-card .value { font-size: 18px; font-weight: bold; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 6px 10px; font-size: 13px; }
        th { background: #f5f5f5; font-weight: bold; }
        .footer { margin-top: 20px; text-align: right; font-size: 11px; color: #999; }
        .no-print { margin-bottom: 15px; text-align: center; }
        .no-print button { padding: 10px 24px; font-size: 14px; font-family: 'Sarabun', sans-serif; cursor: pointer; border: none; border-radius: 6px; color: #fff; background: #2563eb; }
        .no-print button:hover { background: #1d4ed8; }
        @media print {
          .no-print { display: none; }
          body { padding: 0; }
          @page { size: A4 landscape; margin: 15mm 10mm; }
        }
      </style>
    </head>
    <body>
      <div class="no-print">
        <button onclick="window.print()">พิมพ์ / บันทึกเป็น PDF</button>
      </div>
      <h1>รายงานสรุปการใช้จ่ายงบประมาณโครงการ</h1>
      <p style="text-align:center;color:#666;font-size:12px;">
        ข้อมูล ณ วันที่ ${thaiDateStr}
      </p>

      <div class="summary">
        <div class="summary-card">
          <div class="label">งบจัดสรร</div>
          <div class="value">${report.totalAllocated.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</div>
        </div>
        <div class="summary-card">
          <div class="label">ใช้แล้ว</div>
          <div class="value">${report.totalUsed.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</div>
        </div>
        <div class="summary-card">
          <div class="label">คงเหลือ</div>
          <div class="value">${report.totalRemaining.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</div>
        </div>
        <div class="summary-card">
          <div class="label">ใช้ไปแล้ว</div>
          <div class="value">${report.usagePercentage}%</div>
        </div>
      </div>

      <h2>สรุปตามหมวดหมู่</h2>
      <table>
        <thead>
          <tr><th>หมวดหมู่</th><th>จำนวนรายการ</th><th>จำนวนเงิน (บาท)</th><th>สัดส่วน</th></tr>
        </thead>
        <tbody>
          ${categoryRows || '<tr><td colspan="4" style="text-align:center">ไม่มีข้อมูล</td></tr>'}
        </tbody>
      </table>

      <h2>สรุปรายเดือน</h2>
      <table>
        <thead>
          <tr><th>เดือน</th><th>จำนวนรายการ</th><th>จำนวนเงิน (บาท)</th></tr>
        </thead>
        <tbody>
          ${monthlyRows || '<tr><td colspan="3" style="text-align:center">ไม่มีข้อมูล</td></tr>'}
        </tbody>
      </table>

      <div class="footer">สร้างโดยระบบ TeacherMon</div>
    </body>
    </html>`;

    return html;
  }
}

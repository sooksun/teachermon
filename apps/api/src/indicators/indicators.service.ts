import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@teachermon/database';

@Injectable()
export class IndicatorsService {
  constructor(private prisma: PrismaService) {}

  /**
   * ดึงตัวชี้วัดหลักทั้งหมดพร้อม sub-indicators
   */
  async findAll(includeSubIndicators = true): Promise<{
    main: (Prisma.IndicatorGetPayload<{
      include: { subIndicators: true };
    }> | Prisma.IndicatorGetPayload<{
      include: { subIndicators: false };
    }>)[];
    total: number;
  }> {
    const indicators = await this.prisma.indicator.findMany({
      where: {
        isActive: true,
      },
      include: {
        subIndicators: includeSubIndicators
          ? {
              where: {
                isActive: true,
              },
              orderBy: {
                order: 'asc',
              },
            }
          : false,
      },
      orderBy: {
        order: 'asc',
      },
    });

    return {
      main: indicators,
      total: indicators.length,
    };
  }

  /**
   * ดึงตัวชี้วัดหลักตาม code
   */
  async findOneByCode(
    code: string,
    includeSubIndicators = true,
  ): Promise<
    | Prisma.IndicatorGetPayload<{
        include: { subIndicators: true };
      }>
    | Prisma.IndicatorGetPayload<{
        include: { subIndicators: false };
      }>
  > {
    const indicator = await this.prisma.indicator.findUnique({
      where: {
        code,
        isActive: true,
      },
      include: {
        subIndicators: includeSubIndicators
          ? {
              where: {
                isActive: true,
              },
              orderBy: {
                order: 'asc',
              },
            }
          : false,
      },
    });

    if (!indicator) {
      throw new NotFoundException(`Indicator with code ${code} not found`);
    }

    return indicator;
  }

  /**
   * ดึง sub-indicators ทั้งหมด
   */
  async findAllSubIndicators(indicatorId?: string): Promise<{
    data: (Prisma.SubIndicatorGetPayload<{}> & {
      indicator: {
        id: string;
        code: string;
        name: string;
        category: string;
        aspect: string;
      };
    })[];
    total: number;
  }> {
    const where: any = {
      isActive: true,
    };

    if (indicatorId) {
      where.indicatorId = indicatorId;
    }

    const subIndicators = await this.prisma.subIndicator.findMany({
      where,
      include: {
        indicator: {
          select: {
            id: true,
            code: true,
            name: true,
            category: true,
            aspect: true,
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });

    return {
      data: subIndicators,
      total: subIndicators.length,
    };
  }

  /**
   * ดึง sub-indicator ตาม code
   */
  async findSubIndicatorByCode(
    code: string,
  ): Promise<
    Prisma.SubIndicatorGetPayload<{}> & {
      indicator: {
        id: string;
        code: string;
        name: string;
        category: string;
        aspect: string;
      };
    }
  > {
    const subIndicator = await this.prisma.subIndicator.findUnique({
      where: {
        code,
        isActive: true,
      },
      include: {
        indicator: {
          select: {
            id: true,
            code: true,
            name: true,
            category: true,
            aspect: true,
          },
        },
      },
    });

    if (!subIndicator) {
      throw new NotFoundException(`Sub-indicator with code ${code} not found`);
    }

    return subIndicator;
  }

  /**
   * ดึงตัวชี้วัดตาม aspect (ด้าน)
   */
  async findByAspect(aspect: string): Promise<{
    aspect: string;
    indicators: Prisma.IndicatorGetPayload<{
      include: { subIndicators: true };
    }>[];
    total: number;
  }> {
    const indicators = await this.prisma.indicator.findMany({
      where: {
        aspect,
        isActive: true,
      },
      include: {
        subIndicators: {
          where: {
            isActive: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });

    return {
      aspect,
      indicators,
      total: indicators.length,
    };
  }

  /**
   * ดึงตัวชี้วัดตาม category (หมวดหมู่)
   */
  async findByCategory(category: string): Promise<{
    category: string;
    indicators: Prisma.IndicatorGetPayload<{
      include: { subIndicators: true };
    }>[];
    total: number;
  }> {
    const indicators = await this.prisma.indicator.findMany({
      where: {
        category,
        isActive: true,
      },
      include: {
        subIndicators: {
          where: {
            isActive: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });

    return {
      category,
      indicators,
      total: indicators.length,
    };
  }

  /**
   * ตรวจสอบว่า indicator codes ถูกต้องหรือไม่
   */
  async validateIndicatorCodes(
    codes: { main?: string[]; sub?: string[] },
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // ตรวจสอบ main indicators
    if (codes.main && codes.main.length > 0) {
      const mainIndicators = await this.prisma.indicator.findMany({
        where: {
          code: {
            in: codes.main,
          },
          isActive: true,
        },
        select: {
          code: true,
        },
      });

      const validMainCodes = mainIndicators.map((i) => i.code);
      const invalidMainCodes = codes.main.filter(
        (code) => !validMainCodes.includes(code),
      );

      if (invalidMainCodes.length > 0) {
        errors.push(
          `Invalid main indicator codes: ${invalidMainCodes.join(', ')}`,
        );
      }
    }

    // ตรวจสอบ sub-indicators
    if (codes.sub && codes.sub.length > 0) {
      const subIndicators = await this.prisma.subIndicator.findMany({
        where: {
          code: {
            in: codes.sub,
          },
          isActive: true,
        },
        select: {
          code: true,
        },
      });

      const validSubCodes = subIndicators.map((s) => s.code);
      const invalidSubCodes = codes.sub.filter(
        (code) => !validSubCodes.includes(code),
      );

      if (invalidSubCodes.length > 0) {
        errors.push(
          `Invalid sub-indicator codes: ${invalidSubCodes.join(', ')}`,
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * แปลง indicator codes จาก format เก่า (array) เป็น format ใหม่ (object)
   */
  normalizeIndicatorCodes(codes: any): { main: string[]; sub: string[] } {
    // ถ้าเป็น array แสดงว่าเป็น format เก่า
    if (Array.isArray(codes)) {
      return { main: codes, sub: [] };
    }

    // ถ้าเป็น object แสดงว่าเป็น format ใหม่
    if (typeof codes === 'object' && codes !== null) {
      return {
        main: codes.main || [],
        sub: codes.sub || [],
      };
    }

    return { main: [], sub: [] };
  }
}

// Import constants from shared package with fallback
// ใช้ dynamic import เพื่อหลีกเลี่ยง build-time errors
let ASSESSMENT_PERIOD: Record<string, string> | undefined;
let COMPETENCY_LEVEL: Record<string, string> | undefined;

// Try to import from shared package
try {
  // Use type assertion to avoid TypeScript errors
  const sharedModule = require('@teachermon/shared') as any;
  if (sharedModule.ASSESSMENT_PERIOD) {
    ASSESSMENT_PERIOD = sharedModule.ASSESSMENT_PERIOD as Record<string, string>;
  }
  if (sharedModule.COMPETENCY_LEVEL) {
    COMPETENCY_LEVEL = sharedModule.COMPETENCY_LEVEL as Record<string, string>;
  }
} catch (e) {
  // Fallback if import fails - will use fallback constants below
  console.warn('Failed to import constants from @teachermon/shared, using fallback');
}

/** Fallback เมื่อ ASSESSMENT_PERIOD จาก shared เป็น undefined (build/bundling) */
export const ASSESSMENT_PERIOD_FALLBACK: Record<string, string> = {
  BEFORE: 'ก่อนการพัฒนา',
  MIDTERM: 'กลางการพัฒนา',
  AFTER: 'หลังการพัฒนา',
  QUARTERLY_1: 'ไตรมาส 1',
  QUARTERLY_2: 'ไตรมาส 2',
  QUARTERLY_3: 'ไตรมาส 3',
  QUARTERLY_4: 'ไตรมาส 4',
};

/** Fallback เมื่อ COMPETENCY_LEVEL จาก shared เป็น undefined */
export const COMPETENCY_LEVEL_FALLBACK: Record<string, string> = {
  NEEDS_SUPPORT: 'ต้องเสริม',
  FAIR: 'พอใช้',
  GOOD: 'ดี',
  EXCELLENT: 'ดีเยี่ยม',
};

export const PERIOD_MAP = ASSESSMENT_PERIOD ?? ASSESSMENT_PERIOD_FALLBACK;
export const LEVEL_MAP = COMPETENCY_LEVEL ?? COMPETENCY_LEVEL_FALLBACK;

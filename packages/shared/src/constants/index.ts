export const REGIONS = {
  NORTH: 'ภาคเหนือ',
  NORTHEAST: 'ภาคตะวันออกเฉียงเหนือ',
  CENTRAL: 'ภาคกลาง',
  SOUTH: 'ภาคใต้',
} as const;

export const USER_ROLES = {
  TEACHER: 'TEACHER',
  PRINCIPAL: 'PRINCIPAL',
  MENTOR: 'MENTOR',
  PROJECT_MANAGER: 'PROJECT_MANAGER',
  ADMIN: 'ADMIN',
} as const;

export const TEACHER_STATUS = {
  ACTIVE: 'ปฏิบัติงาน',
  TRANSFERRED: 'ย้าย',
  RESIGNED: 'ลาออก',
  ON_LEAVE: 'ลา',
} as const;

export const VISIT_TYPES = {
  LESSON_STUDY: 'Lesson Study',
  COACHING: 'Coaching',
  OBSERVATION: 'Observation',
  FOLLOW_UP: 'Follow Up',
} as const;

export const COMPETENCY_LEVEL = {
  NEEDS_SUPPORT: 'ต้องเสริม',
  FAIR: 'พอใช้',
  GOOD: 'ดี',
  EXCELLENT: 'ดีเยี่ยม',
} as const;

// Alias for backwards compatibility
export const COMPETENCY_LEVELS = COMPETENCY_LEVEL;

export const ASSESSMENT_PERIOD = {
  BEFORE: 'ก่อนการพัฒนา',
  MIDTERM: 'กลางการพัฒนา',
  AFTER: 'หลังการพัฒนา',
  QUARTERLY_1: 'ไตรมาส 1',
  QUARTERLY_2: 'ไตรมาส 2',
  QUARTERLY_3: 'ไตรมาส 3',
  QUARTERLY_4: 'ไตรมาส 4',
} as const;

export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 10,
};

// Export indicators constants
export * from './indicators';
export * from './indicator-checks';

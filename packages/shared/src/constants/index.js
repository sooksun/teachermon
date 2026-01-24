"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PAGINATION = exports.COMPETENCY_LEVELS = exports.VISIT_TYPES = exports.TEACHER_STATUS = exports.USER_ROLES = exports.REGIONS = void 0;
exports.REGIONS = {
    NORTH: 'ภาคเหนือ',
    NORTHEAST: 'ภาคตะวันออกเฉียงเหนือ',
    CENTRAL: 'ภาคกลาง',
    SOUTH: 'ภาคใต้',
};
exports.USER_ROLES = {
    TEACHER: 'TEACHER',
    PRINCIPAL: 'PRINCIPAL',
    MENTOR: 'MENTOR',
    PROJECT_MANAGER: 'PROJECT_MANAGER',
    ADMIN: 'ADMIN',
};
exports.TEACHER_STATUS = {
    ACTIVE: 'ปฏิบัติงาน',
    TRANSFERRED: 'ย้าย',
    RESIGNED: 'ลาออก',
    ON_LEAVE: 'ลา',
};
exports.VISIT_TYPES = {
    LESSON_STUDY: 'Lesson Study',
    COACHING: 'Coaching',
    OBSERVATION: 'Observation',
    FOLLOW_UP: 'Follow Up',
};
exports.COMPETENCY_LEVELS = {
    NEEDS_SUPPORT: 'ต้องเสริม',
    FAIR: 'พอใช้',
    GOOD: 'ดี',
    EXCELLENT: 'ดีเยี่ยม',
};
exports.DEFAULT_PAGINATION = {
    page: 1,
    limit: 10,
};
//# sourceMappingURL=index.js.map
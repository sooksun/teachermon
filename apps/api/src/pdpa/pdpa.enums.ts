// Re-export Prisma enums for PDPA
// This file ensures enums are properly exported and typed

import { Prisma } from '@teachermon/database';

// Export enums as both types and values
export const ConsentType = {
  DATA_COLLECTION: 'DATA_COLLECTION',
  DATA_PROCESSING: 'DATA_PROCESSING',
  DATA_SHARING: 'DATA_SHARING',
  MARKETING: 'MARKETING',
  ANALYTICS: 'ANALYTICS',
} as const;

export const ConsentStatus = {
  PENDING: 'PENDING',
  GRANTED: 'GRANTED',
  REVOKED: 'REVOKED',
  EXPIRED: 'EXPIRED',
} as const;

// Export types
export type ConsentType = (typeof ConsentType)[keyof typeof ConsentType];
export type ConsentStatus = (typeof ConsentStatus)[keyof typeof ConsentStatus];

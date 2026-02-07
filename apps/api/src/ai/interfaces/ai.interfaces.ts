/**
 * AI Service Interfaces
 * หมายเหตุ: AI เป็นเพียงผู้ช่วยเสนอแนะ ไม่ใช่ผู้ตัดสิน
 */

export interface PDPACheckResult {
  isSafe: boolean;
  riskLevel: 'SAFE' | 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK';
  violations: PDPAViolation[];
  sanitizedText?: string;
  suggestions: string[];
}

export interface PDPAViolation {
  type: string;
  pattern: string;
  matchedText: string;
  startIndex: number;
  endIndex: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  suggestion: string;
}

export interface JournalImproveResult {
  improvedText: string;
  improvedFields?: Record<string, string>;
  suggestions: string[];
  confidenceScore: number; // 0.0 - 1.0
  model: string;
}

export interface ReflectionPromptResult {
  prompts: string[];
  relatedIndicators: string[];
  focusAreas: string[];
}

export interface MentoringReportResult {
  reportText: string;
  sections: {
    summary: string;
    strengths: string[];
    improvements: string[];
    followUpTasks: FollowUpTask[];
  };
  confidenceScore: number;
}

export interface FollowUpTask {
  task: string;
  deadline: string; // relative, e.g., "2 สัปดาห์"
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  relatedIndicator?: string;
}

export interface ReadinessExplanation {
  overallScore: number;
  level: string; // "ดีมาก", "ดี", "พอใช้", "ต้องพัฒนา"
  explanation: string;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  weeklyTasks: WeeklyTask[];
}

export interface WeeklyTask {
  task: string;
  indicator: string;
  priority: number;
  estimatedTime: string;
}

export interface EvidenceSummaryResult {
  summary: string; // 3-5 บรรทัด
  keywords: string[];
  suggestedIndicators: string[];
  suggestedFilename: string;
  qualityCheck: EvidenceQualityCheck;
  suggestions: string[];
}

export interface EvidenceQualityCheck {
  hasObjective?: boolean;
  hasSteps?: boolean;
  hasAssessment?: boolean;
  completeness: number; // 0-100
  issues: string[];
  recommendations: string[];
}

export interface AIActivityLog {
  userId: string;
  actionType: string;
  inputData: any;
  outputData: any;
  modelUsed: string;
  tokensUsed?: number;
  confidenceScore?: number;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

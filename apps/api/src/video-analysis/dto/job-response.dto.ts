/**
 * Response shape for a single analysis job.
 * We intentionally keep this loose (mapped from Prisma) rather than
 * over-constraining with class-validator, because this is *output only*.
 */
export interface JobResponse {
  id: string;
  status: string;
  analysisMode: string;
  sourceType: string;
  originalFilename: string | null;

  // byte accounting
  rawBytes: number;
  audioBytes: number;
  framesBytes: number;
  totalBytes: number;

  // error
  errorMessage: string | null;

  // flags
  hasTranscript: boolean;
  hasFrames: boolean;
  hasReport: boolean;
  hasCover: boolean;

  // AI results
  transcriptSummary: string | null;
  analysisReport: any | null;
  evaluationResult: any | null;
  aiAdvice: string | null;

  // timestamps
  createdAt: string;
  uploadedAt: string | null;
  doneAt: string | null;
}

export interface QuotaResponse {
  limitBytes: number;
  usageBytes: number;
  remainingBytes: number;
}

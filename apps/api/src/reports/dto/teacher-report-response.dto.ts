import { ApiProperty } from '@nestjs/swagger';
import {
  AssessmentPeriod,
  CompetencyLevel,
  VisitType,
  FocusArea,
  TeacherStatus,
} from '@teachermon/database';

export class SchoolInfo {
  @ApiProperty()
  schoolName: string;

  @ApiProperty()
  province: string;

  @ApiProperty()
  region: string;
}

export class AssessmentScores {
  @ApiProperty()
  pedagogy: number;

  @ApiProperty()
  classroom: number;

  @ApiProperty()
  community: number;

  @ApiProperty()
  professionalism: number;
}

export class LatestAssessment {
  @ApiProperty({ enum: AssessmentPeriod })
  period: AssessmentPeriod;

  @ApiProperty({ enum: CompetencyLevel })
  overallLevel: CompetencyLevel;

  @ApiProperty({ type: AssessmentScores })
  scores: AssessmentScores;

  @ApiProperty()
  date: Date;

  @ApiProperty()
  assessor: string;
}

export class LatestMentoring {
  @ApiProperty({ enum: VisitType })
  visitType: VisitType;

  @ApiProperty({ enum: FocusArea })
  focusArea: FocusArea;

  @ApiProperty()
  date: Date;

  @ApiProperty()
  observer: string;
}

export class TeacherReportSummary {
  @ApiProperty()
  teacherId: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  position: string;

  @ApiProperty()
  cohort: number;

  @ApiProperty({ type: SchoolInfo })
  school: SchoolInfo;

  // Assessment Summary
  @ApiProperty()
  assessmentCount: number;

  @ApiProperty({ type: LatestAssessment, nullable: true })
  latestAssessment: LatestAssessment | null;

  @ApiProperty({ nullable: true })
  averageScore: number | null;

  // Mentoring Summary
  @ApiProperty()
  mentoringCount: number;

  @ApiProperty({ type: LatestMentoring, nullable: true })
  latestMentoring: LatestMentoring | null;

  // Other Activities
  @ApiProperty()
  journalCount: number;

  @ApiProperty()
  plcCount: number;

  @ApiProperty()
  developmentPlanCount: number;

  // Status
  @ApiProperty({ enum: TeacherStatus })
  status: TeacherStatus;

  @ApiProperty()
  lastActivityDate: Date | null;
}

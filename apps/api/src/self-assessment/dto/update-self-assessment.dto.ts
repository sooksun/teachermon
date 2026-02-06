import { PartialType } from '@nestjs/swagger';
import { CreateSelfAssessmentDto } from './create-self-assessment.dto';

export class UpdateSelfAssessmentDto extends PartialType(
  CreateSelfAssessmentDto,
) {}

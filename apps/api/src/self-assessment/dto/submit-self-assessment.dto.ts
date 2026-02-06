import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitSelfAssessmentDto {
  @ApiProperty()
  @IsUUID()
  id: string;
}

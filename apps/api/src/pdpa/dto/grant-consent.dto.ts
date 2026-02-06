import { IsEnum, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { ConsentType } from '../pdpa.enums';

export class GrantConsentDto {
  @IsEnum(ConsentType)
  consentType: ConsentType;

  @IsOptional()
  @IsString()
  privacyPolicyVersion?: string;

  @IsOptional()
  @IsString()
  termsVersion?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  expiresInDays?: number;
}

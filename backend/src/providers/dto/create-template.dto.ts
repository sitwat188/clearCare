import { IsString, IsIn, IsOptional, IsObject } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  name: string;

  @IsString()
  @IsIn(['medication', 'lifestyle', 'follow-up', 'warning'])
  type: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsObject()
  details?: Record<string, unknown>;
}

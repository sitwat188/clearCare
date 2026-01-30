import { IsString, IsIn, IsOptional, IsObject } from 'class-validator';

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @IsIn(['medication', 'lifestyle', 'follow-up', 'warning'])
  type?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsObject()
  details?: Record<string, unknown>;
}

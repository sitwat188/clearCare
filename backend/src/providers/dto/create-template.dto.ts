import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsIn, IsOptional, IsObject } from 'class-validator';

export class CreateTemplateDto {
  @ApiProperty({ example: 'Daily medication reminder' })
  @IsString()
  name: string;

  @ApiProperty({ enum: ['medication', 'lifestyle', 'follow-up', 'warning'] })
  @IsString()
  @IsIn(['medication', 'lifestyle', 'follow-up', 'warning'])
  type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Template body content' })
  @IsString()
  content: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  details?: Record<string, unknown>;
}

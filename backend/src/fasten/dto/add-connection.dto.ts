import { IsString, IsOptional, MaxLength } from 'class-validator';

export class AddConnectionDto {
  @IsString()
  orgConnectionId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  sourceName?: string;
}

import { IsEnum, IsNotEmpty } from 'class-validator';

export enum AcknowledgmentType {
  RECEIPT = 'receipt',
  UNDERSTANDING = 'understanding',
  COMMITMENT = 'commitment',
}

export class AcknowledgeInstructionDto {
  @IsNotEmpty({ message: 'Acknowledgment type is required' })
  @IsEnum(AcknowledgmentType, {
    message:
      'Acknowledgment type must be receipt, understanding, or commitment',
  })
  acknowledgmentType: AcknowledgmentType;
}

import { InstructionType, InstructionPriority } from './create-instruction.dto';
export declare class UpdateInstructionDto {
    title?: string;
    type?: InstructionType;
    priority?: InstructionPriority;
    content?: string;
    medicationDetails?: any;
    lifestyleDetails?: any;
    followUpDetails?: any;
    warningDetails?: any;
    assignedDate?: string;
    acknowledgmentDeadline?: string;
    expirationDate?: string;
    status?: string;
    complianceTrackingEnabled?: boolean;
    lifestyleTrackingEnabled?: boolean;
}

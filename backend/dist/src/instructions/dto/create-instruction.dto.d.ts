export declare enum InstructionType {
    MEDICATION = "medication",
    LIFESTYLE = "lifestyle",
    FOLLOW_UP = "follow-up",
    WARNING = "warning"
}
export declare enum InstructionPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    URGENT = "urgent"
}
export declare class CreateInstructionDto {
    patientId: string;
    title: string;
    type: InstructionType;
    priority?: InstructionPriority;
    content: string;
    medicationDetails?: any;
    lifestyleDetails?: any;
    followUpDetails?: any;
    warningDetails?: any;
    assignedDate?: string;
    acknowledgmentDeadline?: string;
    expirationDate?: string;
    complianceTrackingEnabled?: boolean;
    lifestyleTrackingEnabled?: boolean;
}

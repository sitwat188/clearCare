export declare enum ComplianceType {
    MEDICATION = "medication",
    LIFESTYLE = "lifestyle",
    APPOINTMENT = "appointment"
}
export declare enum ComplianceStatus {
    COMPLIANT = "compliant",
    NON_COMPLIANT = "non-compliant",
    PARTIAL = "partial",
    NOT_STARTED = "not-started"
}
export declare class CreateComplianceDto {
    instructionId: string;
    type: ComplianceType;
    status?: ComplianceStatus;
    overallPercentage?: number;
    medicationCompliance?: any;
    lifestyleCompliance?: any;
    appointmentCompliance?: any;
}
